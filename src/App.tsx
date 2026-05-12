import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function App() {
  return (
    // 1. Container: Tailwind se full screen black background
    <div className="w-full h-screen bg-[#020617]">
      {/* 2. The Universe: Canvas portal khulta hai yahan se */}
      <Canvas camera={{ position: [3, 3, 3] }}>
        {/* 3. The Sun: Ambient light jo har jagah barabar roshni degi */}
        <ambientLight intensity={1} />

        {/* 4. The Flashlight: Point light jo ek taraf se chamkegi */}
        <pointLight position={[10, 10, 10]} intensity={1} />

        {/* 5. The Hero: Humara simple box */}
        <mesh>
          {/* Skeleton: 1 unit lamba, chauda, uncha box */}
          <boxGeometry args={[2, 2, 2]} />
          {/* Skin: Lightning Blue color */}
          <meshStandardMaterial color="#2563eb" />
        </mesh>

        {/* 6. The Navigator: Taaki hum mouse se ghum kar dekh sakein */}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
