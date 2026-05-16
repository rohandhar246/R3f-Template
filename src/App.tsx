import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, Environment } from "@react-three/drei";
import { Suspense } from "react";
import Player from "./Player";
import ObstacleManager from "./ObstacleManager";
import Clouds from "./Clouds";
import UI from "./UI";

(window as any).gameStatus = "START";

// Detect mobile once at module load — avoids window.innerWidth reads in render
const IS_MOBILE = window.innerWidth < 768;

export default function App() {
  return (
    <KeyboardControls map={[{ name: "jump", keys: ["Space"] }]}>
      <div className="w-full h-screen bg-sky-300 bg-[url('/skybox.jpg')] bg-cover bg-center overflow-hidden relative">
        <UI />

        <Canvas
          // ── Mobile-critical performance settings ──────────────────────────
          dpr={[1, IS_MOBILE ? 1.5 : 2]} // cap pixel ratio — biggest GPU win
          shadows={false} // shadow maps are expensive, skip
          frameloop="always"
          gl={{
            antialias: !IS_MOBILE, // AA off on mobile = 2-3x fillrate
            powerPreference: "high-performance",
            alpha: true,
            depth: true
          }}
          camera={{ fov: IS_MOBILE ? 85 : 75, near: 0.1, far: 150 }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />
            {/* Shorter fog range = fewer fragments to shade on mobile */}
            <fog attach="fog" args={["#7dd3fc", 15, IS_MOBILE ? 70 : 90]} />

            <Physics
              gravity={[0, -20, 0]}
              // Fixed 60Hz physics tick — prevents variable-rate physics jitter
              timeStep={1 / 60}
              updatePriority={0}
            >
              <Player />
              <ObstacleManager />
            </Physics>

            <Clouds />

            <Environment preset="sunset" />
          </Suspense>
        </Canvas>

        {/* Score HUD — written directly by Player via DOM for zero React overhead */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <h1
            id="score"
            className="font-black text-white text-center leading-none"
            style={{
              fontFamily: "'Impact', monospace",
              fontSize: "clamp(36px, 9vw, 72px)",
              textShadow: "2px 2px 0 rgba(0,0,0,0.5), 0 0 20px rgba(56,189,248,0.4)"
            }}
          >
            0
          </h1>
        </div>
      </div>
    </KeyboardControls>
  );
}
