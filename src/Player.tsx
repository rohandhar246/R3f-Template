import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import { RapierRigidBody, RigidBody, BallCollider } from "@react-three/rapier";
import * as THREE from "three";

useGLTF.preload("/Bird.glb");

function BirdModel({ meshRef }: { meshRef: React.RefObject<THREE.Group> }) {
  const { scene } = useGLTF("/Bird.glb");
  return (
    // 🔥 FIX 1: Double Group Lagaya!
    // Andar wala group bird ko aage dikhayega, bahar wala smoothly up/down (Pitch) karega
    <group ref={meshRef}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <primitive object={scene} castShadow receiveShadow />
      </group>
    </group>
  );
}

export default function Player() {
  const ScoreSound = useRef<HTMLAudioElement>(null!);
  const HitSound = useRef<HTMLAudioElement>(null!);
  const JumpSound = useRef<HTMLAudioElement>(null!);

  useEffect(() => {
    ScoreSound.current = new Audio("/Jump.wav");
    HitSound.current = new Audio("/Shoot.wav");
    JumpSound.current = new Audio("/PowerUp.wav");
    [ScoreSound, HitSound, JumpSound].forEach((r) => r.current.load());
    (window as any).camIndex = parseInt(localStorage.getItem("camIndex") || "0");
  }, []);

  const playSound = (audioRef: React.MutableRefObject<HTMLAudioElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const rb = useRef<RapierRigidBody>(null!);
  const birdMeshRef = useRef<THREE.Group>(null!);
  const [, getKeys] = useKeyboardControls();
  const lastScore = useRef(0);
  const hasFlapped = useRef(false);
  const mobileJumpActive = useRef(false);

  const smoothedCamPos = useRef(new THREE.Vector3());
  const smoothedLookTarget = useRef(new THREE.Vector3());
  const smoothedBirdPos = useRef(new THREE.Vector3());
  const _targetCamPos = useRef(new THREE.Vector3());
  const _targetLook = useRef(new THREE.Vector3());

  const prevCamIndex = useRef(parseInt(localStorage.getItem("camIndex") || "0"));

  const FORWARD_SPEED = -15;
  const FLAP_FORCE = 7;
  const VISUAL_LERP = 0.3;
  const CAM_LERP = 0.08;

  useEffect(() => {
    const handleTouch = () => {
      if ((window as any).gameStatus === "PLAYING") {
        mobileJumpActive.current = true;
        setTimeout(() => {
          mobileJumpActive.current = false;
        }, 100);
      }
    };
    window.addEventListener("pointerdown", handleTouch);
    return () => window.removeEventListener("pointerdown", handleTouch);
  }, []);

  useFrame((state) => {
    if (!rb.current) return;
    const status = (window as any).gameStatus;
    const pos = rb.current.translation();
    const vel = rb.current.linvel();
    const { jump } = getKeys();

    // ── GAME NOT STARTED (IDLE STATE) ──
    if (status !== "PLAYING") {
      rb.current.setGravityScale(0, true);
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // 🔥 FIX 2: Start screen par bird hawa mein "Hover" karegi (No instant death)
      if (birdMeshRef.current) {
        birdMeshRef.current.position.set(pos.x, pos.y + Math.sin(state.clock.elapsedTime * 3) * 0.2, pos.z);
        birdMeshRef.current.rotation.x = 0;
      }
    }
    // ── GAME PLAYING STATE ──
    else {
      rb.current.setGravityScale(1, true);

      // Jump Logic
      const isJumping = jump || mobileJumpActive.current;
      let moveY = vel.y;
      if (isJumping && !hasFlapped.current) {
        playSound(JumpSound);
        moveY = FLAP_FORCE;
        hasFlapped.current = true;
      }
      if (!isJumping) hasFlapped.current = false;

      rb.current.setLinvel({ x: 0, y: moveY, z: FORWARD_SPEED }, true);

      // Visual Mesh Following Physics
      if (birdMeshRef.current) {
        smoothedBirdPos.current.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), VISUAL_LERP);
        birdMeshRef.current.position.copy(smoothedBirdPos.current);

        // 🔥 FIX 3: Perfect Pitch up and down without twisting!
        const targetRotX = Math.min(Math.max(vel.y * 0.08, -0.6), 0.6);
        birdMeshRef.current.rotation.x = THREE.MathUtils.lerp(birdMeshRef.current.rotation.x, targetRotX, 0.15);
      }

      // Score Update
      const currentScore = Math.floor(Math.abs(pos.z) / 30);
      if (currentScore > lastScore.current) {
        playSound(ScoreSound);
        lastScore.current = currentScore;
        const scoreEl = document.getElementById("score");
        if (scoreEl) scoreEl.innerText = currentScore.toString();
        window.dispatchEvent(new CustomEvent("scoreUpdate", { detail: currentScore }));
      }
    }

    // ── CAMERA LOGIC (Runs continuously so start screen view works) ──
    const isMobile = window.innerWidth < 768;
    const currentCamIndex = (window as any).camIndex ?? prevCamIndex.current;
    const justSwitched = currentCamIndex !== prevCamIndex.current;
    prevCamIndex.current = currentCamIndex;

    const camTargetPos = birdMeshRef.current ? birdMeshRef.current.position : pos;

    if (currentCamIndex === 0) {
      _targetCamPos.current.set(camTargetPos.x, camTargetPos.y + 2, camTargetPos.z + 6);
      _targetLook.current.set(camTargetPos.x, camTargetPos.y, camTargetPos.z - 10);
    } else {
      const sideDist = isMobile ? 10 : 8;
      _targetCamPos.current.set(camTargetPos.x + sideDist, camTargetPos.y + 1, camTargetPos.z + 3);
      _targetLook.current.set(camTargetPos.x, camTargetPos.y + 1, camTargetPos.z - 8);
    }

    if (justSwitched) {
      smoothedCamPos.current.copy(_targetCamPos.current);
      smoothedLookTarget.current.copy(_targetLook.current);
    } else {
      smoothedCamPos.current.lerp(_targetCamPos.current, CAM_LERP);
      smoothedLookTarget.current.lerp(_targetLook.current, CAM_LERP);
    }

    state.camera.position.copy(smoothedCamPos.current);
    state.camera.lookAt(smoothedLookTarget.current);
  });

  return (
    <>
      <RigidBody
        ref={rb}
        position={[0, 4, 0]} // 🔥 THE MEGA FIX: Missing starting position added!
        onCollisionEnter={() => {
          playSound(HitSound);
          (window as any).gameStatus = "GAME_OVER";
          window.dispatchEvent(new Event("gameOver"));
        }}
        lockRotations={true}
      >
        {/* Explicit BallCollider instead of guessing */}
        <BallCollider args={[0.4]} />
      </RigidBody>

      <BirdModel meshRef={birdMeshRef} />
    </>
  );
}
