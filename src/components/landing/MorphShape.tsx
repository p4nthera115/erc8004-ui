import { useEffect, useRef, useState } from "react"

type Point = { x: number; y: number; cornerRadius: number }
type Points = Record<string, Point>
type Segment = { startPointId: string; endPointId: string }
type Segments = Record<string, Segment>
type SegmentDirection = "forward" | "reverse"
type Cell = { segmentIds: string[]; segmentDirections: SegmentDirection[] }
type WallBounds = {
  left: number | null
  right: number | null
  top: number | null
  bottom: number | null
}
type WallPin = { pinX: number | null; pinY: number | null }

const WALL_EPSILON = 0.5

const POINTS: Points = {"p0":{"x":100,"y":100,"cornerRadius":20},"p1":{"x":252.14230346679688,"y":100,"cornerRadius":112},"p2":{"x":700,"y":100,"cornerRadius":20},"p4":{"x":267.4065246582032,"y":612.8768920898436,"cornerRadius":130},"p5":{"x":700,"y":536.4619750976562,"cornerRadius":85},"p6":{"x":100,"y":700,"cornerRadius":20},"p7":{"x":266.126220703125,"y":700,"cornerRadius":200},"p8":{"x":700,"y":700,"cornerRadius":20},"p3_s0":{"x":100,"y":278.71948242187494,"cornerRadius":155},"p4_s1":{"x":166.19686889648438,"y":283.05703735351557,"cornerRadius":159},"pimon2xigh_4":{"x":100,"y":643.2618408203125,"cornerRadius":92},"pimon2y4nl_6":{"x":200.11920166015628,"y":230.2779235839844,"cornerRadius":20},"pimon2yngx_10":{"x":100.41403222084057,"y":506.70056152343744,"cornerRadius":0}}
const SEGMENTS: Segments = {"s0":{"startPointId":"p0","endPointId":"p1"},"s2":{"startPointId":"p4","endPointId":"pimon2xigh_4"},"s3":{"startPointId":"p3_s0","endPointId":"p0"},"s4":{"startPointId":"p1","endPointId":"p2"},"s5":{"startPointId":"p2","endPointId":"p5"},"s6":{"startPointId":"p5","endPointId":"p4"},"s7":{"startPointId":"p4","endPointId":"p7"},"s8":{"startPointId":"p7","endPointId":"p6"},"s9":{"startPointId":"p6","endPointId":"pimon2xigh_4"},"s10":{"startPointId":"p5","endPointId":"p8"},"s11":{"startPointId":"p8","endPointId":"p7"},"sfmon2x76x_0":{"startPointId":"p4_s1","endPointId":"p3_s0"},"simon2xigh_9":{"startPointId":"pimon2xigh_4","endPointId":"p4"},"simon2y4nl_12":{"startPointId":"p1","endPointId":"pimon2y4nl_6"},"simon2y4nl_13":{"startPointId":"pimon2y4nl_6","endPointId":"p4_s1"},"simon2y7yj_17":{"startPointId":"pimon2y4nl_6","endPointId":"p1"},"simon2yngx_20":{"startPointId":"pimon2xigh_4","endPointId":"pimon2yngx_10"},"simon2yngx_21":{"startPointId":"pimon2yngx_10","endPointId":"pimon2y4nl_6"}}
const CELLS: Cell[] = [{"segmentIds":["s0","simon2y4nl_12","simon2y4nl_13","sfmon2x76x_0","s3"],"segmentDirections":["forward","forward","forward","forward","forward"]},{"segmentIds":["s4","s5","s6","simon2xigh_9","simon2yngx_20","simon2yngx_21","simon2y7yj_17"],"segmentDirections":["forward","forward","forward","reverse","forward","forward","forward"]},{"segmentIds":["s2","s7","s8","s9"],"segmentDirections":["reverse","forward","forward","forward"]},{"segmentIds":["s6","s10","s11","s7"],"segmentDirections":["reverse","forward","forward","reverse"]}]
const VIEW_BOX = {"width":1000,"height":1000}

const HOVER_SCALE = 1.15
const HOVER_LERP_RATE = 0.15
const MIN_CELL_SIZE = 20
const BREATH_AMPLITUDE = 0.05
const BREATH_SPEED = 0.5

const CORNER_RADIUS_MULTIPLIER = 1
const GAP = 1

const GLOW_STD_DEVIATION = 15
const GLOW_FLOOD_COLOR = "#ffffff"
const GLOW_FLOOD_OPACITY = 1

const BACKGROUND = {"top":{"color":"#000000","position":0.22},"middle":{"color":"#336696","position":0.61},"bottom":{"color":"#ffffff","position":1}}

const STROKE_WIDTH = 2
const STROKE_X1 = 0
const STROKE_Y1 = 1
const STROKE_X2 = 0
const STROKE_Y2 = 0

function roundedPolygonPath(points: Point[], radii: number[]): string {
  const n = points.length
  if (n < 3) return ""
  let d = ""
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const curr = points[i]
    const next = points[(i + 1) % n]

    const inDx = curr.x - prev.x
    const inDy = curr.y - prev.y
    const inLen = Math.hypot(inDx, inDy)

    const outDx = next.x - curr.x
    const outDy = next.y - curr.y
    const outLen = Math.hypot(outDx, outDy)

    const r = Math.min(radii[i], inLen / 2, outLen / 2)

    const startX = curr.x - (inDx / inLen) * r
    const startY = curr.y - (inDy / inLen) * r
    const endX = curr.x + (outDx / outLen) * r
    const endY = curr.y + (outDy / outLen) * r

    d += (i === 0 ? "M " : " L ") + startX.toFixed(2) + " " + startY.toFixed(2)
    d +=
      " Q " + curr.x.toFixed(2) + " " + curr.y.toFixed(2) + " " +
      endX.toFixed(2) + " " + endY.toFixed(2)
  }
  d += " Z"
  return d
}

function insetVertices(vertices: Point[], gap: number): Point[] {
  const n = vertices.length
  if (n < 3 || gap === 0) return vertices.slice()

  let area2 = 0
  for (let i = 0; i < n; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % n]
    area2 += (b.x - a.x) * (b.y + a.y)
  }
  const clockwise = area2 > 0

  const result: Point[] = []
  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n]
    const curr = vertices[i]
    const next = vertices[(i + 1) % n]

    const e1x = curr.x - prev.x
    const e1y = curr.y - prev.y
    const e2x = next.x - curr.x
    const e2y = next.y - curr.y

    const e1len = Math.hypot(e1x, e1y)
    const e2len = Math.hypot(e2x, e2y)
    if (e1len === 0 || e2len === 0) {
      result.push({ x: curr.x, y: curr.y, cornerRadius: curr.cornerRadius })
      continue
    }

    const e1ux = e1x / e1len
    const e1uy = e1y / e1len
    const e2ux = e2x / e2len
    const e2uy = e2y / e2len

    const sign = clockwise ? 1 : -1
    const n1x = -e1uy * sign
    const n1y = e1ux * sign
    const n2x = -e2uy * sign
    const n2y = e2ux * sign

    let bx = n1x + n2x
    let by = n1y + n2y
    const blen = Math.hypot(bx, by)
    if (blen === 0) {
      result.push({ x: curr.x, y: curr.y, cornerRadius: curr.cornerRadius })
      continue
    }
    bx /= blen
    by /= blen

    const sinHalf = bx * n1x + by * n1y
    const safeSin = Math.max(Math.abs(sinHalf), 0.2)
    const dist = gap / safeSin

    result.push({
      x: curr.x + bx * dist * -1,
      y: curr.y + by * dist * -1,
      cornerRadius: curr.cornerRadius,
    })
  }
  return result
}

function cellPointIds(cell: Cell, segments: Segments): string[] {
  const out: string[] = []
  for (let i = 0; i < cell.segmentIds.length; i++) {
    const seg = segments[cell.segmentIds[i]]
    const dir = cell.segmentDirections[i]
    out.push(dir === "forward" ? seg.startPointId : seg.endPointId)
  }
  return out
}

function computeCellVertexPoints(
  cell: Cell,
  segments: Segments,
  resolvedPoints: Points
): Array<{ id: string; x: number; y: number; cornerRadius: number }> {
  const ids = cellPointIds(cell, segments)
  return ids.map((id) => {
    const p = resolvedPoints[id]
    return { id, x: p.x, y: p.y, cornerRadius: p.cornerRadius }
  })
}

function computeContainerWalls(points: Points): WallBounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const id in points) {
    const p = points[id]
    if (!p) continue
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { left: null, right: null, top: null, bottom: null }
  }
  const countNearX = (val: number) => {
    let c = 0
    for (const id in points) {
      const p = points[id]
      if (!p) continue
      if (Math.abs(p.x - val) <= WALL_EPSILON) c++
    }
    return c
  }
  const countNearY = (val: number) => {
    let c = 0
    for (const id in points) {
      const p = points[id]
      if (!p) continue
      if (Math.abs(p.y - val) <= WALL_EPSILON) c++
    }
    return c
  }
  return {
    left: countNearX(minX) >= 2 ? minX : null,
    right: minX !== maxX && countNearX(maxX) >= 2 ? maxX : null,
    top: countNearY(minY) >= 2 ? minY : null,
    bottom: minY !== maxY && countNearY(maxY) >= 2 ? maxY : null,
  }
}

function getWallPin(p: { x: number; y: number }, walls: WallBounds): WallPin {
  let pinX: number | null = null
  let pinY: number | null = null
  if (walls.left !== null && Math.abs(p.x - walls.left) <= WALL_EPSILON) {
    pinX = walls.left
  } else if (
    walls.right !== null && Math.abs(p.x - walls.right) <= WALL_EPSILON
  ) {
    pinX = walls.right
  }
  if (walls.top !== null && Math.abs(p.y - walls.top) <= WALL_EPSILON) {
    pinY = walls.top
  } else if (
    walls.bottom !== null && Math.abs(p.y - walls.bottom) <= WALL_EPSILON
  ) {
    pinY = walls.bottom
  }
  return { pinX, pinY }
}

function computeCellsByPoint(
  cells: Cell[],
  segments: Segments
): Record<string, number[]> {
  const out: Record<string, number[]> = {}
  for (let i = 0; i < cells.length; i++) {
    const seen = new Set<string>()
    for (const sid of cells[i].segmentIds) {
      const s = segments[sid]
      if (!s) continue
      seen.add(s.startPointId)
      seen.add(s.endPointId)
    }
    for (const id of seen) {
      if (!out[id]) out[id] = []
      out[id].push(i)
    }
  }
  return out
}

function getNeighborIndices(cellIndex: number, cells: Cell[]): number[] {
  const own = new Set(cells[cellIndex].segmentIds)
  const out: number[] = []
  for (let i = 0; i < cells.length; i++) {
    if (i === cellIndex) continue
    for (const sid of cells[i].segmentIds) {
      if (own.has(sid)) {
        out.push(i)
        break
      }
    }
  }
  return out
}

function computeScaledPoints(
  cells: Cell[],
  segments: Segments,
  basePoints: Points,
  scales: number[],
  cellsByPoint: Record<string, number[]>,
  pinByPointId: Record<string, WallPin>
): Points {
  const centroids = cells.map((cell) => {
    const ids = cellPointIds(cell, segments)
    if (ids.length === 0) return { x: 0, y: 0 }
    let cx = 0
    let cy = 0
    for (const id of ids) {
      const p = basePoints[id]
      cx += p.x
      cy += p.y
    }
    return { x: cx / ids.length, y: cy / ids.length }
  })

  const out: Points = {}
  for (const id in basePoints) {
    const orig = basePoints[id]
    const contribs = cellsByPoint[id]
    if (!contribs || contribs.length === 0) {
      out[id] = { x: orig.x, y: orig.y, cornerRadius: orig.cornerRadius }
      continue
    }
    let sumX = 0
    let sumY = 0
    for (const ci of contribs) {
      const c = centroids[ci]
      const s = scales[ci]
      sumX += c.x + (orig.x - c.x) * s
      sumY += c.y + (orig.y - c.y) * s
    }
    let nx = sumX / contribs.length
    let ny = sumY / contribs.length
    const pin = pinByPointId[id]
    if (pin) {
      if (pin.pinX !== null) nx = pin.pinX
      if (pin.pinY !== null) ny = pin.pinY
    }
    out[id] = { x: nx, y: ny, cornerRadius: orig.cornerRadius }
  }
  return out
}

function convexHull(points: Point[]): Point[] {
  const n = points.length
  if (n <= 1) return points
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

  const lower: Point[] = []
  for (let i = 0; i < n; i++) {
    const p = sorted[i]
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: Point[] = []
  for (let i = n - 1; i >= 0; i--) {
    const p = sorted[i]
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop()
    }
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function pointInPolygon(
  px: number,
  py: number,
  poly: Array<{ x: number; y: number }>
): boolean {
  let inside = false
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointerToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const transformed = pt.matrixTransform(ctm.inverse())
  return { x: transformed.x, y: transformed.y }
}

function useTime(paused: boolean): number {
  const [time, setTime] = useState(0)
  useEffect(() => {
    if (paused) return
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      setTime((t) => t + (now - last))
      last = now
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [paused])
  return time
}


type MorphShapeProps = {
  width?: number | string
  height?: number | string
  className?: string
  paused?: boolean
}

export default function MorphShape({
  width = "100%",
  height = "100%",
  className,
  paused = false,
}: MorphShapeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const time = useTime(false)
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null)

  const scaleStateRef = useRef<{
    current: number[]
    target: number[]
    lastTime: number
  }>({ current: [], target: [], lastTime: 0 })

  const cellResolvedVertsRef = useRef<Point[][]>([])

  const walls = computeContainerWalls(POINTS)
  const pinByPointId: Record<string, WallPin> = {}
  for (const id in POINTS) {
    pinByPointId[id] = getWallPin(POINTS[id], walls)
  }

  const cellsByPoint = computeCellsByPoint(CELLS, SEGMENTS)

  {
    const st = scaleStateRef.current
    while (st.current.length < CELLS.length) {
      st.current.push(1)
      st.target.push(1)
    }
    while (st.current.length > CELLS.length) {
      st.current.pop()
      st.target.pop()
    }
  }

  const neighborsRespectFloor = (
    hoverIndex: number,
    candidateScale: number,
    neighbors: number[]
  ): boolean => {
    const trial = new Array(CELLS.length).fill(1)
    trial[hoverIndex] = candidateScale
    const scaled = computeScaledPoints(
      CELLS, SEGMENTS, POINTS, trial, cellsByPoint, pinByPointId
    )
    for (const ni of neighbors) {
      const verts = computeCellVertexPoints(CELLS[ni], SEGMENTS, scaled)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const v of verts) {
        if (v.x < minX) minX = v.x
        if (v.y < minY) minY = v.y
        if (v.x > maxX) maxX = v.x
        if (v.y > maxY) maxY = v.y
      }
      if (Math.min(maxX - minX, maxY - minY) < MIN_CELL_SIZE) return false
    }
    return true
  }

  const clampHoverScale = (hoverIndex: number, maxScale: number): number => {
    const neighbors = getNeighborIndices(hoverIndex, CELLS)
    if (neighbors.length === 0) return maxScale
    if (neighborsRespectFloor(hoverIndex, maxScale, neighbors)) return maxScale
    let lo = 1
    let hi = maxScale
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2
      if (neighborsRespectFloor(hoverIndex, mid, neighbors)) lo = mid
      else hi = mid
    }
    return lo
  }

  {
    const st = scaleStateRef.current
    const activeHover = paused ? null : hoveredCellIndex
    for (let i = 0; i < CELLS.length; i++) {
      if (activeHover === i) {
        st.target[i] = clampHoverScale(i, HOVER_SCALE)
      } else {
        st.target[i] = 1
      }
    }
  }

  {
    const st = scaleStateRef.current
    if (time !== st.lastTime) {
      const dtSec = st.lastTime === 0 ? 1 / 60 : (time - st.lastTime) / 1000
      const factor = 1 - Math.pow(1 - HOVER_LERP_RATE, dtSec * 60)
      for (let i = 0; i < st.current.length; i++) {
        st.current[i] += (st.target[i] - st.current[i]) * factor
      }
      st.lastTime = time
    }
  }

  const breathPhaseSec = (time * BREATH_SPEED) / 1000
  const combinedScales = scaleStateRef.current.current.map((hover, i) => {
    if (paused) return hover
    const breath =
      1 + BREATH_AMPLITUDE * Math.sin(breathPhaseSec + i * 1.7)
    return hover * breath
  })

  const scaledPoints = computeScaledPoints(
    CELLS, SEGMENTS, POINTS, combinedScales, cellsByPoint, pinByPointId
  )

  let allCellVerts: Point[] = []
  for (const cell of CELLS) {
    const cellVerts = computeCellVertexPoints(cell, SEGMENTS, scaledPoints)
    allCellVerts = allCellVerts.concat(
      cellVerts.map((v) => ({ x: v.x, y: v.y, cornerRadius: v.cornerRadius }))
    )
  }
  const hullPoints = convexHull(allCellVerts)
  const paddedHullPoints = insetVertices(hullPoints, 0)
  const containerRadii = paddedHullPoints.map(
    () => 28 * CORNER_RADIUS_MULTIPLIER
  )

  const cellResolvedVerts: Point[][] = []
  const cellInsetPaths = CELLS.map((cell) => {
    const cellVerts = computeCellVertexPoints(cell, SEGMENTS, scaledPoints)
    const resolved: Point[] = cellVerts.map((v) => ({
      x: v.x, y: v.y, cornerRadius: v.cornerRadius,
    }))
    cellResolvedVerts.push(resolved)
    const inset = insetVertices(resolved, GAP)
    const radii = cellVerts.map(
      (v) => v.cornerRadius * CORNER_RADIUS_MULTIPLIER
    )
    return roundedPolygonPath(inset, radii)
  })
  cellResolvedVertsRef.current = cellResolvedVerts

  let pminX = Infinity, pminY = Infinity, pmaxX = -Infinity, pmaxY = -Infinity
  for (const id in POINTS) {
    const p = POINTS[id]
    if (!p) continue
    pminX = Math.min(pminX, p.x)
    pminY = Math.min(pminY, p.y)
    pmaxX = Math.max(pmaxX, p.x)
    pmaxY = Math.max(pmaxY, p.y)
  }
  const hasPointBounds =
    Number.isFinite(pminX) && Number.isFinite(pminY) &&
    Number.isFinite(pmaxX) && Number.isFinite(pmaxY)
  const contentCx = hasPointBounds ? (pminX + pmaxX) / 2 : VIEW_BOX.width / 2
  const contentCy = hasPointBounds ? (pminY + pmaxY) / 2 : VIEW_BOX.height / 2
  const centerTx = VIEW_BOX.width / 2 - contentCx
  const centerTy = VIEW_BOX.height / 2 - contentCy

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    if (paused) {
      if (hoveredCellIndex !== null) setHoveredCellIndex(null)
      return
    }
    const raw = pointerToSvg(svgRef.current, e.clientX, e.clientY)
    const lx = raw.x - centerTx
    const ly = raw.y - centerTy
    let hit: number | null = null
    const polys = cellResolvedVertsRef.current
    for (let i = 0; i < polys.length; i++) {
      if (pointInPolygon(lx, ly, polys[i])) {
        hit = i
        break
      }
    }
    if (hit !== hoveredCellIndex) setHoveredCellIndex(hit)
  }

  const handleSvgPointerLeave = () => {
    if (hoveredCellIndex !== null) setHoveredCellIndex(null)
  }

  const sortedStops = [
    { position: BACKGROUND.top.position, color: BACKGROUND.top.color },
    { position: BACKGROUND.middle.position, color: BACKGROUND.middle.color },
    { position: BACKGROUND.bottom.position, color: BACKGROUND.bottom.color },
  ].sort((a, b) => a.position - b.position)

  return (
    <svg
      ref={svgRef}
      className={className}
      width={width}
      height={height}
      viewBox={"0 0 " + VIEW_BOX.width + " " + VIEW_BOX.height}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handleSvgPointerMove}
      onPointerLeave={handleSvgPointerLeave}
      style={{ touchAction: "none" }}
    >
      <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
          {sortedStops.map((stop, i) => (
            <stop
              key={stop.position + "-" + i}
              offset={stop.position}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>

        <linearGradient
          id="containerGradient"
          x1={STROKE_X1}
          y1={STROKE_Y1}
          x2={STROKE_X2}
          y2={STROKE_Y2}
        >
          {sortedStops.map((stop, i) => (
            <stop
              key={stop.position + "-" + i}
              offset={stop.position}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>

        {/* userSpaceOnUse with viewBox-relative bounds keeps the filter
            region constant across frames; with the default
            objectBoundingBox, Safari rebuilds the filter scratch buffer
            every frame as the cell bbox shifts. */}
        <filter
          id="outerGlow"
          filterUnits="userSpaceOnUse"
          x={-VIEW_BOX.width / 2}
          y={-VIEW_BOX.height / 2}
          width={VIEW_BOX.width * 2}
          height={VIEW_BOX.height * 2}
        >
          <feGaussianBlur
            in="SourceAlpha"
            stdDeviation={GLOW_STD_DEVIATION}
            result="blur"
          />
          <feFlood
            floodColor={GLOW_FLOOD_COLOR}
            floodOpacity={GLOW_FLOOD_OPACITY}
            result="glowColor"
          />
          <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
          <feComposite
            in="glow"
            in2="SourceAlpha"
            operator="out"
            result="outerGlowOnly"
          />
          <feMerge>
            <feMergeNode in="outerGlowOnly" />
          </feMerge>
        </filter>

        <filter
          id="innerGlow"
          filterUnits="userSpaceOnUse"
          x={-VIEW_BOX.width / 2}
          y={-VIEW_BOX.height / 2}
          width={VIEW_BOX.width * 2}
          height={VIEW_BOX.height * 2}
        >
          <feGaussianBlur
            in="SourceAlpha"
            stdDeviation={GLOW_STD_DEVIATION}
            result="blur"
          />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComposite
            in="SourceAlpha"
            in2="offsetBlur"
            operator="out"
            result="innerMask"
          />
          <feFlood
            floodColor="#ffffff"
            floodOpacity={GLOW_FLOOD_OPACITY}
            result="glowColor"
          />
          <feComposite
            in="glowColor"
            in2="innerMask"
            operator="in"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
          </feMerge>
        </filter>

        <clipPath id="containerClip">
          <path
            d={roundedPolygonPath(paddedHullPoints, containerRadii)}
            fillRule="evenodd"
          />
        </clipPath>

        <mask id="containerMask" fillRule="evenodd">
          <path
            d={roundedPolygonPath(paddedHullPoints, containerRadii)}
            fill="white"
          />
          {cellInsetPaths.map((d, i) => (
            <path key={"cell-mask-" + i} d={d} fill="black" />
          ))}
        </mask>
      </defs>

      <rect
        x="0"
        y="0"
        width={VIEW_BOX.width}
        height={VIEW_BOX.height}
        fill="url(#bgGradient)"
        pointerEvents="none"
      />

      <g
        fillRule="evenodd"
        transform={"translate(" + centerTx + " " + centerTy + ")"}
      >
        {paddedHullPoints.length >= 3 && (
          <>
            <g mask="url(#containerMask)">
              <path
                d={roundedPolygonPath(paddedHullPoints, containerRadii)}
                fill="#ffffff"
                stroke="none"
                filter="url(#innerGlow)"
                pointerEvents="none"
              />
            </g>

            <path
              d={roundedPolygonPath(paddedHullPoints, containerRadii)}
              fill="none"
              stroke="url(#containerGradient)"
              strokeWidth={STROKE_WIDTH}
              pointerEvents="none"
            />
          </>
        )}

        <g clipPath="url(#containerClip)" filter="url(#outerGlow)">
          {cellInsetPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </g>
    </svg>
  )
}
