import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import Obstacle from "./Obstacle";

const PIPE_COUNT = 6;
const PIPE_SPACING = 25;
const SPAWN_OFFSET = 40;

// Pre-compute initial Y positions once — no Math.random() per frame
const INIT_Y = Array.from({ length: PIPE_COUNT }, (_, i) => {
  const s = i * 91.7; // arbitrary seed spread
  return (((s * 0.618) % 1) - 0.5) * 7;
});

export default function ObstacleManager() {
  const pipeRefs = useRef<(RapierRigidBody | null)[]>([]);

  useFrame((state) => {
    // Skip entirely when not playing — saves 6 translation reads per frame
    if ((window as any).gameStatus !== "PLAYING") return;

    const playerZ = state.camera.position.z;

    for (let i = 0; i < pipeRefs.current.length; i++) {
      const ref = pipeRefs.current[i];
      if (!ref) continue;

      const p = ref.translation();
      if (p.z > playerZ + 15) {
        ref.setTranslation(
          {
            x: 0,
            y: (Math.random() - 0.5) * 7, // random only when recycling (rare)
            z: p.z - PIPE_COUNT * PIPE_SPACING
          },
          true
        );
      }
    }
  });

  return (
    <>
      {INIT_Y.map((y, i) => (
        <Obstacle
          key={i}
          ref={(el) => {
            pipeRefs.current[i] = el;
          }}
          position={[0, y, -i * PIPE_SPACING - SPAWN_OFFSET]}
        />
      ))}
    </>
  );
}
