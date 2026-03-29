import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Deterministic hash from agentRegistry + agentId → seed values for the shader
function hashToSeeds(agentRegistry: string, agentId: number): number[] {
  let hash = 0
  const input = `${agentRegistry}:${agentId}`
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  // Generate 6 deterministic floats from the hash
  const seeds: number[] = []
  for (let i = 0; i < 6; i++) {
    hash = ((hash * 1103515245 + 12345) & 0x7fffffff)
    seeds.push((hash % 1000) / 1000)
  }
  return seeds
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed1;
  uniform float uSeed2;
  uniform float uSeed3;
  uniform float uSeed4;
  uniform float uSeed5;
  uniform float uSeed6;
  varying vec2 vUv;

  // Simplex-style noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Fingerprint core position — offset by seed for uniqueness
    vec2 core = vec2(uSeed1 * 0.15 - 0.075, uSeed2 * 0.1 - 0.05);
    float coreDist = length(uv - core);

    // Layer 1: concentric elliptical ridges around the core
    float ellipse = length(vec2(
      (uv.x - core.x) * (1.0 + uSeed3 * 0.4),
      (uv.y - core.y) * (0.8 + uSeed4 * 0.4)
    ));
    float ridges1 = sin(ellipse * (45.0 + uSeed1 * 20.0));

    // Layer 2: flow-field warping to break symmetry (like real fingerprints)
    float warp = snoise(uv * (4.0 + uSeed3 * 3.0) + uTime * 0.02) * 0.8
               + snoise(uv * (8.0 + uSeed5 * 4.0)) * 0.4;

    // Layer 3: angular ridges that create whorl/loop/arch patterns
    float pattern = sin(
      ellipse * (40.0 + uSeed1 * 25.0) +
      angle * (uSeed2 * 3.0 - 1.5) +
      warp * 3.0
    );

    // Combine: sharp ridge lines
    float ridge = smoothstep(-0.1, 0.1, pattern) * 0.7 +
                  smoothstep(-0.05, 0.05, ridges1 + warp * 0.5) * 0.3;

    // Color palette — each agent gets a distinct hue combo
    float hue1 = uSeed1 * 6.28318;
    float hue2 = hue1 + 1.5 + uSeed4 * 1.5;
    vec3 col1 = vec3(
      0.55 + 0.35 * cos(hue1),
      0.45 + 0.35 * cos(hue1 + 2.094),
      0.55 + 0.4  * cos(hue1 + 4.189)
    );
    vec3 col2 = vec3(
      0.12 + 0.08 * cos(hue2),
      0.08 + 0.06 * cos(hue2 + 2.094),
      0.18 + 0.12 * cos(hue2 + 4.189)
    );

    vec3 color = mix(col2, col1, ridge);

    // Subtle depth — darken away from core
    color *= 1.0 - coreDist * 0.4;

    // Circular mask with anti-aliased edge
    float mask = 1.0 - smoothstep(0.38, 0.42, dist);
    color *= mask;

    // Inner glow
    color += col1 * 0.1 * (1.0 - smoothstep(0.0, 0.25, coreDist)) * mask;

    gl_FragColor = vec4(color, mask);
  }
`

interface FingerprintMeshProps {
  seeds: number[]
}

function FingerprintMesh({ seeds }: FingerprintMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSeed1: { value: seeds[0] },
    uSeed2: { value: seeds[1] },
    uSeed3: { value: seeds[2] },
    uSeed4: { value: seeds[3] },
    uSeed5: { value: seeds[4] },
    uSeed6: { value: seeds[5] },
  }), [seeds])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}

interface FingerprintBadgeProps {
  agentRegistry: string
  agentId: number
  size?: number
  className?: string
}

export function FingerprintBadge({
  agentRegistry,
  agentId,
  size = 200,
  className = '',
}: FingerprintBadgeProps) {
  const seeds = useMemo(
    () => hashToSeeds(agentRegistry, agentId),
    [agentRegistry, agentId],
  )

  return (
    <div
      className={`rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 1], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true }}
      >
        <FingerprintMesh seeds={seeds} />
      </Canvas>
    </div>
  )
}
