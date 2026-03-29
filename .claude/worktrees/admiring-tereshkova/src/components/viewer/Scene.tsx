"use client"

import { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
  PresentationControls,
  useGLTF,
  Center,
  Html,
  useProgress,
} from "@react-three/drei"
import { motion } from "framer-motion"
import * as THREE from "three"

interface SceneProps {
  modelUrl?: string
  environmentPreset?:
    | "studio"
    | "city"
    | "sunset"
    | "night"
    | "warehouse"
    | "forest"
  autoRotate?: boolean
  showControls?: boolean
  exposure?: number
  scale?: number
}

// Loading component with luxury styling
function Loader() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-2 border-gold-500/20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-gold-400 border-t-transparent animate-spin"
            style={{ animationDuration: "1s" }}
          />
        </div>
        <div className="text-gold-400 font-mono text-sm">
          {progress.toFixed(0)}%
        </div>
      </div>
    </Html>
  )
}

// Placeholder 3D object when no model is loaded
function PlaceholderModel() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#d4a24a"
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1}
        />
      </mesh>
    </Float>
  )
}

// GLB/GLTF Model loader
function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url)

  return (
    <Center>
      <primitive object={scene} scale={scale} />
    </Center>
  )
}

// Main 3D scene
function SceneContent({
  modelUrl,
  environmentPreset = "studio",
  autoRotate = true,
  exposure = 1,
  scale = 1,
}: Omit<SceneProps, "showControls">) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#d4a24a" />

      {/* Environment */}
      <Environment preset={environmentPreset} background={false} />

      {/* Model */}
      <Suspense fallback={<Loader />}>
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          {modelUrl ? (
            <Model url={modelUrl} scale={scale} />
          ) : (
            <PlaceholderModel />
          )}
        </PresentationControls>
      </Suspense>

      {/* Contact shadow for grounding */}
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.5}
        scale={10}
        blur={2.5}
        far={4}
        color="#000000"
      />

      {/* Orbit controls for additional interaction */}
      <OrbitControls
        makeDefault
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enableZoom={true}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={2}
        maxDistance={10}
      />
    </>
  )
}

// Main exported component with Canvas
export function Scene({
  modelUrl,
  environmentPreset = "studio",
  autoRotate = true,
  showControls = true,
  exposure = 1,
  scale = 1,
}: SceneProps) {
  return (
    <div className="canvas-container relative group">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: exposure,
        }}
      >
        <SceneContent
          modelUrl={modelUrl}
          environmentPreset={environmentPreset}
          autoRotate={autoRotate}
          exposure={exposure}
          scale={scale}
        />
      </Canvas>

      {/* Controls overlay */}
      {showControls && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-obsidian-900/80 backdrop-blur-md border border-platinum-800/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-platinum-400 text-xs">Drag to rotate</span>
          <span className="text-platinum-600">•</span>
          <span className="text-platinum-400 text-xs">Scroll to zoom</span>
        </motion.div>
      )}

      {/* Luxury corner accents */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-gold-500/20 rounded-tl-2xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-gold-500/20 rounded-tr-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-gold-500/20 rounded-bl-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-gold-500/20 rounded-br-2xl pointer-events-none" />
    </div>
  )
}
