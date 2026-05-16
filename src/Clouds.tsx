import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── A single cloud made from 3–5 overlapping spheres ─────────────────────────
function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  // Puffs: [x-offset, y-offset, sphere-radius]
  const puffs: [number, number, number][] = [
    [0, 0, 1.2],
    [1.4, 0.3, 0.9],
    [-1.3, 0.2, 0.85],
    [0.6, 0.9, 0.7],
    [-0.5, 0.85, 0.65]
  ];

  return (
    <group position={position} scale={scale}>
      {puffs.map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[r, 6, 5]} /> {/* Low-poly for mobile */}
          <meshLambertMaterial color="#ffffff" transparent opacity={0.82} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Pool of clouds that recycle as player moves forward ──────────────────────
const CLOUD_COUNT = 10; // total pool size
const SPREAD_Z = 200; // how far ahead clouds extend
const SPREAD_X = 14; // left-right spread
const SPREAD_Y_MIN = 6; // below this Y = too low
const SPREAD_Y_MAX = 14; // above this Y = too high

// Deterministic initial layout so no Math.random() per frame
function makeCloud(i: number) {
  const seed = i * 137.5; // golden-angle-ish spread
  return {
    x: (((seed * 0.618) % 1) - 0.5) * SPREAD_X * 4,
    y: SPREAD_Y_MIN + ((seed * 0.382) % 1) * (SPREAD_Y_MAX - SPREAD_Y_MIN),
    z: -i * (SPREAD_Z / CLOUD_COUNT) - 10,
    scale: 0.8 + ((seed * 0.27) % 0.6)
  };
}

export default function Clouds() {
  // Store mutable cloud state in a plain array (no React state → no re-renders)
  const clouds = useRef(Array.from({ length: CLOUD_COUNT }, (_, i) => makeCloud(i)));

  // One group ref per cloud
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    if ((window as any).gameStatus !== "PLAYING") return;

    const playerZ = state.camera.position.z;

    refs.current.forEach((ref, i) => {
      if (!ref) return;
      const c = clouds.current[i];

      // Recycle cloud when player has passed it by > 20 units
      if (c.z > playerZ + 20) {
        // Teleport to far ahead with fresh random-ish position
        const newSeed = (i + CLOUD_COUNT + Math.floor(Math.abs(playerZ) / 10)) * 137.5;
        c.x = (((newSeed * 0.618) % 1) - 0.5) * SPREAD_X * 2;
        c.y = SPREAD_Y_MIN + ((newSeed * 0.382) % 1) * (SPREAD_Y_MAX - SPREAD_Y_MIN);
        c.z = playerZ - SPREAD_Z - Math.random() * 20;
        c.scale = 0.8 + ((newSeed * 0.27) % 0.6);
      }

      // Gentle sideways drift (very slow — atmospheric, not distracting)
      c.x += Math.sin(state.clock.elapsedTime * 0.05 + i) * 0.002;

      ref.position.set(c.x, c.y, c.z);
      ref.scale.setScalar(c.scale);
    });
  });

  // Geometry/material memo so they're not re-created on render
  const cloudPositions = useMemo(() => clouds.current.map((c) => [c.x, c.y, c.z] as [number, number, number]), []);
  const cloudScales = useMemo(() => clouds.current.map((c) => c.scale), []);

  return (
    <>
      {cloudPositions.map((pos, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={pos}
          scale={cloudScales[i]}
        >
          {/* Puffs inlined here (no sub-component call) for perf */}
          {(
            [
              [0, 0, 1.2],
              [1.4, 0.3, 0.9],
              [-1.3, 0.2, 0.85],
              [0.6, 0.9, 0.7],
              [-0.5, 0.85, 0.65]
            ] as [number, number, number][]
          ).map(([x, y, r], j) => (
            <mesh key={j} position={[x, y, 0]}>
              <sphereGeometry args={[r, 6, 5]} />
              <meshLambertMaterial color="#e8f4ff" transparent opacity={0.78} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
