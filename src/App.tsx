import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Float, Text, Environment, Html, Trail, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// Game state types
interface GameState {
  score: number
  speed: number
  gameOver: boolean
  started: boolean
  time: number
}

// Mars terrain with procedural craters
function MarsTerrain() {
  const meshRef = useRef<THREE.Mesh>(null!)

  const geometry = new THREE.PlaneGeometry(200, 200, 128, 128)
  const positions = geometry.attributes.position.array as Float32Array

  // Create Mars-like terrain with craters
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]

    // Base terrain noise
    let z = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2
    z += Math.sin(x * 0.1 + y * 0.1) * 1.5

    // Add craters
    const craterPositions = [
      { cx: 10, cy: 15, r: 8 },
      { cx: -20, cy: -10, r: 12 },
      { cx: 30, cy: -25, r: 6 },
      { cx: -15, cy: 30, r: 10 },
      { cx: 45, cy: 20, r: 7 },
    ]

    craterPositions.forEach(crater => {
      const dist = Math.sqrt((x - crater.cx) ** 2 + (y - crater.cy) ** 2)
      if (dist < crater.r) {
        z -= (crater.r - dist) * 0.5
      }
    })

    positions[i + 2] = z
  }

  geometry.computeVertexNormals()

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <primitive object={geometry} />
      <meshStandardMaterial
        color="#8B4513"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  )
}

// Speeder bike (Star Wars inspired)
function Speeder({ position, onCollision }: { position: [number, number, number], onCollision: () => void }) {
  const groupRef = useRef<THREE.Group>(null!)
  const engineGlowRef = useRef<THREE.PointLight>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      // Hovering effect
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.1

      // Engine glow pulse
      if (engineGlowRef.current) {
        engineGlowRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 10) * 0.5
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.3, 3]} />
        <meshStandardMaterial color={hovered ? "#ff6b00" : "#2a2a2a"} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Front nose */}
      <mesh position={[0, 0, 1.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.3, 1, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Left engine */}
      <mesh position={[-0.6, -0.1, -0.5]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 2, 16]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right engine */}
      <mesh position={[0.6, -0.1, -0.5]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 2, 16]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Engine glow left */}
      <mesh position={[-0.6, -0.1, -1.6]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>

      {/* Engine glow right */}
      <mesh position={[0.6, -0.1, -1.6]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.25, 0.5]}>
        <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Engine lights */}
      <pointLight ref={engineGlowRef} position={[0, -0.1, -1.6]} color="#00ffff" intensity={2} distance={5} />

      {/* Trail effect */}
      <Trail
        width={1}
        length={6}
        color="#00ffff"
        attenuation={(t) => t * t}
      >
        <mesh position={[0, 0, -1.5]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      </Trail>
    </group>
  )
}

// Power orb collectible
function PowerOrb({ position, onCollect, collected }: { position: [number, number, number], onCollect: () => void, collected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  if (collected) return null

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} onClick={onCollect}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          color="#ffcc00"
          emissive="#ff6600"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
        <pointLight color="#ffcc00" intensity={1} distance={5} />
      </mesh>
    </Float>
  )
}

// Obstacle rocks
function Obstacle({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <dodecahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial
        color="#5a3d2b"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  )
}

// Imperial Star Destroyer in the sky
function StarDestroyer() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 50
      groupRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.1) * 30 - 100
    }
  })

  return (
    <group ref={groupRef} position={[0, 80, -100]} rotation={[0.1, Math.PI, 0]} scale={3}>
      {/* Main hull */}
      <mesh>
        <coneGeometry args={[8, 30, 4]} />
        <meshStandardMaterial color="#404040" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Bridge tower */}
      <mesh position={[0, 2, -8]}>
        <boxGeometry args={[4, 6, 4]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Shield generators */}
      <mesh position={[-1.5, 5, -8]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.5, 5, -8]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Engine glow */}
      <mesh position={[0, 0, -15]}>
        <boxGeometry args={[6, 2, 1]} />
        <meshBasicMaterial color="#4488ff" />
      </mesh>
      <pointLight position={[0, 0, -16]} color="#4488ff" intensity={5} distance={50} />
    </group>
  )
}

// TIE Fighter enemies
function TieFighter({ initialPosition }: { initialPosition: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null!)
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime + timeOffset.current
      groupRef.current.position.x = initialPosition[0] + Math.sin(t * 0.5) * 20
      groupRef.current.position.z = initialPosition[2] + Math.cos(t * 0.3) * 15
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.2
    }
  })

  return (
    <group ref={groupRef} position={initialPosition} scale={0.8}>
      {/* Cockpit */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Viewport */}
      <mesh position={[0, 0, 0.9]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#001a33" />
      </mesh>

      {/* Left wing */}
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[0.1, 3, 2.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Right wing */}
      <mesh position={[2, 0, 0]}>
        <boxGeometry args={[0.1, 3, 2.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Wing struts */}
      <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
      <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
    </group>
  )
}

// Mars atmosphere / dust
function MarsAtmosphere() {
  return (
    <>
      <fog attach="fog" args={['#3d1a0a', 50, 200]} />
      <Sparkles
        count={200}
        scale={100}
        size={1}
        speed={0.3}
        color="#ff6633"
        opacity={0.3}
      />
    </>
  )
}

// Game controller component
function GameController({
  gameState,
  setGameState
}: {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const speederPos = useRef<[number, number, number]>([0, 0.5, 0])
  const velocity = useRef({ x: 0, z: 0 })
  const keys = useRef({ w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false })
  const { camera } = useThree()

  const [orbs, setOrbs] = useState([
    { id: 1, pos: [5, 1, -10] as [number, number, number], collected: false },
    { id: 2, pos: [-8, 1, -25] as [number, number, number], collected: false },
    { id: 3, pos: [12, 1, -40] as [number, number, number], collected: false },
    { id: 4, pos: [-5, 1, -55] as [number, number, number], collected: false },
    { id: 5, pos: [8, 1, -70] as [number, number, number], collected: false },
    { id: 6, pos: [-10, 1, -85] as [number, number, number], collected: false },
    { id: 7, pos: [3, 1, -100] as [number, number, number], collected: false },
    { id: 8, pos: [-7, 1, -115] as [number, number, number], collected: false },
  ])

  const obstacles = [
    [10, 0, -20] as [number, number, number],
    [-12, 0, -35] as [number, number, number],
    [15, 0, -50] as [number, number, number],
    [-8, 0, -65] as [number, number, number],
    [5, 0, -80] as [number, number, number],
    [-15, 0, -95] as [number, number, number],
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current || e.key.startsWith('Arrow')) {
        e.preventDefault()
        if (e.key.startsWith('Arrow')) {
          keys.current[e.key as keyof typeof keys.current] = true
        } else {
          keys.current[key as keyof typeof keys.current] = true
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current || e.key.startsWith('Arrow')) {
        if (e.key.startsWith('Arrow')) {
          keys.current[e.key as keyof typeof keys.current] = false
        } else {
          keys.current[key as keyof typeof keys.current] = false
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (!gameState.started || gameState.gameOver) return

    // Update game time
    setGameState(prev => ({ ...prev, time: prev.time + delta }))

    const acceleration = 0.5
    const friction = 0.95
    const maxSpeed = 15

    // Handle input
    if (keys.current.w || keys.current.ArrowUp) velocity.current.z -= acceleration
    if (keys.current.s || keys.current.ArrowDown) velocity.current.z += acceleration
    if (keys.current.a || keys.current.ArrowLeft) velocity.current.x -= acceleration
    if (keys.current.d || keys.current.ArrowRight) velocity.current.x += acceleration

    // Apply friction
    velocity.current.x *= friction
    velocity.current.z *= friction

    // Clamp speed
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2)
    if (speed > maxSpeed) {
      velocity.current.x = (velocity.current.x / speed) * maxSpeed
      velocity.current.z = (velocity.current.z / speed) * maxSpeed
    }

    // Update position
    speederPos.current[0] += velocity.current.x * delta
    speederPos.current[2] += velocity.current.z * delta

    // Boundary limits
    speederPos.current[0] = Math.max(-40, Math.min(40, speederPos.current[0]))

    // Update camera to follow speeder
    camera.position.x = speederPos.current[0]
    camera.position.z = speederPos.current[2] + 15
    camera.position.y = 8
    camera.lookAt(speederPos.current[0], 0, speederPos.current[2] - 10)

    // Check orb collection
    orbs.forEach((orb, index) => {
      if (!orb.collected) {
        const dist = Math.sqrt(
          (speederPos.current[0] - orb.pos[0]) ** 2 +
          (speederPos.current[2] - orb.pos[2]) ** 2
        )
        if (dist < 2) {
          setOrbs(prev => {
            const newOrbs = [...prev]
            newOrbs[index] = { ...newOrbs[index], collected: true }
            return newOrbs
          })
          setGameState(prev => ({ ...prev, score: prev.score + 100 }))
        }
      }
    })

    // Check obstacle collision
    obstacles.forEach(obs => {
      const dist = Math.sqrt(
        (speederPos.current[0] - obs[0]) ** 2 +
        (speederPos.current[2] - obs[2]) ** 2
      )
      if (dist < 2.5) {
        setGameState(prev => ({ ...prev, gameOver: true }))
      }
    })

    // Win condition
    if (speederPos.current[2] < -120) {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        score: prev.score + Math.floor(1000 - prev.time * 10)
      }))
    }

    setGameState(prev => ({ ...prev, speed: speed }))
  })

  const collectOrb = useCallback((id: number) => {
    setOrbs(prev => prev.map(o => o.id === id ? { ...o, collected: true } : o))
    setGameState(prev => ({ ...prev, score: prev.score + 100 }))
  }, [setGameState])

  return (
    <>
      <Speeder position={speederPos.current} onCollision={() => setGameState(prev => ({ ...prev, gameOver: true }))} />

      {orbs.map(orb => (
        <PowerOrb
          key={orb.id}
          position={orb.pos}
          collected={orb.collected}
          onCollect={() => collectOrb(orb.id)}
        />
      ))}

      {obstacles.map((pos, i) => (
        <Obstacle key={i} position={pos} />
      ))}
    </>
  )
}

// HUD overlay
function HUD({ gameState, onStart, onRestart }: {
  gameState: GameState
  onStart: () => void
  onRestart: () => void
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6">
        <div className="flex justify-between items-start max-w-6xl mx-auto">
          {/* Score */}
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 md:p-4">
            <div className="text-cyan-400 text-[10px] md:text-xs uppercase tracking-[0.3em] mb-1">Score</div>
            <div className="text-cyan-300 text-2xl md:text-4xl font-bold font-mono">{gameState.score.toString().padStart(6, '0')}</div>
          </div>

          {/* Speed indicator */}
          <div className="bg-black/60 backdrop-blur-md border border-orange-500/30 rounded-lg p-3 md:p-4">
            <div className="text-orange-400 text-[10px] md:text-xs uppercase tracking-[0.3em] mb-1">Speed</div>
            <div className="text-orange-300 text-2xl md:text-4xl font-bold font-mono">{Math.floor(gameState.speed * 10)}</div>
          </div>

          {/* Time */}
          <div className="bg-black/60 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3 md:p-4">
            <div className="text-yellow-400 text-[10px] md:text-xs uppercase tracking-[0.3em] mb-1">Time</div>
            <div className="text-yellow-300 text-2xl md:text-4xl font-bold font-mono">{gameState.time.toFixed(1)}s</div>
          </div>
        </div>
      </div>

      {/* Start screen */}
      {!gameState.started && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="text-center p-6 md:p-8 max-w-lg mx-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 mb-4 md:mb-6 tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              MARS SPEEDER
            </h1>
            <p className="text-orange-200/80 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
              Race across the Martian surface. Collect power orbs.<br className="hidden md:block" />
              Avoid the rocks. Reach the extraction point.
            </p>
            <div className="text-cyan-400/70 text-xs md:text-sm mb-6 md:mb-8 uppercase tracking-widest">
              [W/A/S/D] or [Arrow Keys] to move
            </div>
            <button
              onClick={onStart}
              className="px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-lg md:text-xl font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30"
            >
              LAUNCH MISSION
            </button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="text-center p-6 md:p-8 max-w-lg mx-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 mb-4 md:mb-6" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {gameState.score > 500 ? 'MISSION COMPLETE' : 'MISSION FAILED'}
            </h2>
            <div className="text-6xl md:text-7xl lg:text-8xl font-mono text-yellow-400 mb-4">{gameState.score}</div>
            <p className="text-cyan-300/70 text-base md:text-lg mb-6 md:mb-8">Final Score</p>
            <button
              onClick={onRestart}
              className="px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-lg md:text-xl font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/30"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Controls hint (mobile) */}
      {gameState.started && !gameState.gameOver && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 md:hidden">
          <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-3 text-center">
            <p className="text-white/60 text-xs">Use on-screen or keyboard controls</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Loading screen
function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#1a0a05] to-[#0a0505]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4 mx-auto" />
        <p className="text-orange-400 animate-pulse tracking-widest">LOADING MARS...</p>
      </div>
    </div>
  )
}

// Main App component
export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    speed: 0,
    gameOver: false,
    started: false,
    time: 0,
  })

  const handleStart = () => {
    setGameState(prev => ({ ...prev, started: true }))
  }

  const handleRestart = () => {
    setGameState({
      score: 0,
      speed: 0,
      gameOver: false,
      started: true,
      time: 0,
    })
    // Force page reload to reset game state
    window.location.reload()
  }

  return (
    <div className="w-screen h-screen bg-[#1a0a05] overflow-hidden relative">
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          shadows
          camera={{ position: [0, 8, 15], fov: 60 }}
          gl={{ antialias: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.3} color="#ff9966" />
          <directionalLight
            position={[50, 50, 25]}
            intensity={1.5}
            color="#ffccaa"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-20, 10, -20]} intensity={0.5} color="#ff6633" />

          {/* Mars atmosphere */}
          <MarsAtmosphere />
          <color attach="background" args={['#1a0a05']} />

          {/* Environment */}
          <Environment preset="sunset" />

          {/* Stars in sky */}
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

          {/* Terrain */}
          <MarsTerrain />

          {/* Star Wars elements */}
          <StarDestroyer />
          <TieFighter initialPosition={[20, 25, -30]} />
          <TieFighter initialPosition={[-25, 30, -50]} />
          <TieFighter initialPosition={[15, 28, -70]} />

          {/* Game elements */}
          <GameController gameState={gameState} setGameState={setGameState} />

          {/* Floating title in 3D space */}
          {!gameState.started && (
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.5}>
              <Text
                position={[0, 15, -50]}
                fontSize={8}
                color="#ff6633"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.2}
                outlineColor="#ffaa66"
              >
                MARS
              </Text>
            </Float>
          )}
        </Canvas>
      </Suspense>

      {/* HUD Overlay */}
      <HUD gameState={gameState} onStart={handleStart} onRestart={handleRestart} />

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-center">
        <p className="text-white/30 text-[10px] md:text-xs tracking-wide">
          Requested by <span className="text-orange-400/50">@BitG_MEME</span> · Built by <span className="text-cyan-400/50">@clonkbot</span>
        </p>
      </div>
    </div>
  )
}
