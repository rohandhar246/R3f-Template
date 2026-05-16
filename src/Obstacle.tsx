import { forwardRef } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useGLTF, Clone } from "@react-three/drei"; // 🔥 Clone import kiya

useGLTF.preload("/Pipe.glb");

const Obstacle = forwardRef<RapierRigidBody, { position?: [number, number, number]; gapY?: number }>(({ position, gapY = 0 }, ref) => {
  const { scene } = useGLTF("/Pipe.glb");

  const pipeHeight = 40;
  const gapSize = 6;

  return (
    <group position={position}>
      <RigidBody ref={ref} type="fixed" colliders="cuboid">
        {/* 🔥 primitive ki jagah <Clone> use kiya. Ye mobile par lag zero kar dega! */}
        <Clone object={scene} position={[0, gapY - pipeHeight / 2 - gapSize / 2, 0]} scale={[20, 40, 20]} />
        <Clone object={scene} position={[0, gapY + pipeHeight / 2 + gapSize / 2, 0]} rotation={[Math.PI, 0, 0]} scale={[20, 40, 20]} />
      </RigidBody>
    </group>
  );
});

export default Obstacle;
