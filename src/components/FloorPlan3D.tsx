import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';

interface FloorPlan3DProps {
  plotLength: number;
  plotWidth: number;
  rooms: number;
  style: string;
}

function Room({ position, size, color, label }: { 
  position: [number, number, number]; 
  size: [number, number, number]; 
  color: string;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      <Text
        position={[0, size[1] + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {/* Walls outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color="#ffffff" linewidth={2} />
      </lineSegments>
    </group>
  );
}

function Floor({ width, length }: { width: number; length: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial color="#2a2a2a" metalness={0.1} roughness={0.9} />
    </mesh>
  );
}

function Scene({ plotLength, plotWidth, rooms, style }: FloorPlan3DProps) {
  const roomConfigs = getRoomLayout(plotLength, plotWidth, rooms, style);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      <Floor width={plotWidth / 3} length={plotLength / 3} />
      <Grid 
        args={[plotWidth / 3, plotLength / 3]} 
        cellSize={1} 
        cellThickness={0.5}
        cellColor="#444444"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={50}
        fadeStrength={1}
        position={[0, 0.01, 0]}
      />

      {roomConfigs.map((room, index) => (
        <Room
          key={index}
          position={room.position}
          size={room.size}
          color={room.color}
          label={room.label}
        />
      ))}

      <OrbitControls 
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

function getRoomLayout(plotLength: number, plotWidth: number, rooms: number, style: string) {
  const scale = 0.03;
  const scaledLength = plotLength * scale;
  const scaledWidth = plotWidth * scale;
  
  const colors = {
    modern: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'],
    traditional: ['#d97706', '#dc2626', '#059669', '#7c3aed'],
    minimal: ['#64748b', '#475569', '#334155', '#1e293b'],
    luxury: ['#fbbf24', '#f59e0b', '#d97706', '#b45309']
  };

  const roomColors = colors[style as keyof typeof colors] || colors.modern;
  const roomHeight = 2.5;

  if (rooms === 2) {
    return [
      { 
        position: [-scaledWidth / 4, 0, 0] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength * 0.8] as [number, number, number], 
        color: roomColors[0],
        label: 'Living Room'
      },
      { 
        position: [scaledWidth / 4, 0, 0] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength * 0.8] as [number, number, number], 
        color: roomColors[1],
        label: 'Bedroom'
      }
    ];
  } else if (rooms === 3) {
    return [
      { 
        position: [-scaledWidth / 4, 0, scaledLength / 4] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength / 2] as [number, number, number], 
        color: roomColors[0],
        label: 'Living Room'
      },
      { 
        position: [scaledWidth / 4, 0, scaledLength / 4] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength / 2] as [number, number, number], 
        color: roomColors[1],
        label: 'Bedroom 1'
      },
      { 
        position: [0, 0, -scaledLength / 4] as [number, number, number], 
        size: [scaledWidth * 0.8, roomHeight, scaledLength / 2] as [number, number, number], 
        color: roomColors[2],
        label: 'Kitchen'
      }
    ];
  } else {
    return [
      { 
        position: [-scaledWidth / 4, 0, scaledLength / 4] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength / 2] as [number, number, number], 
        color: roomColors[0],
        label: 'Living Room'
      },
      { 
        position: [scaledWidth / 4, 0, scaledLength / 4] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength / 2] as [number, number, number], 
        color: roomColors[1],
        label: 'Bedroom 1'
      },
      { 
        position: [-scaledWidth / 4, 0, -scaledLength / 4] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength / 2] as [number, number, number], 
        color: roomColors[2],
        label: 'Kitchen'
      },
      { 
        position: [scaledWidth / 4, 0, -scaledLength / 4] as [number, number, number], 
        size: [scaledWidth / 2, roomHeight, scaledLength / 2] as [number, number, number], 
        color: roomColors[3],
        label: 'Bedroom 2'
      }
    ];
  }
}

export default function FloorPlan3D(props: FloorPlan3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [15, 12, 15], fov: 50 }}
        shadows
        className="bg-gradient-to-b from-background to-background/80"
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
