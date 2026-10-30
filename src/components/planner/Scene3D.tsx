"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useDesignStore } from "@/store/designStore";
import { useIssues } from "@/store/hooks";
import { getComponent } from "@/lib/catalogue";
import { baseElevation } from "@/lib/rules";
import type { Envelope } from "@/types/design";
import { Item3D, preloadModel } from "./Item3D";

/** Start downloading models before the 3D view mounts (called on hover of the 3D button). */
export function preloadModels(urls: string[]) {
  urls.forEach(preloadModel);
}

type Preset = "front" | "corner" | "top";

const WALL_T = 0.06;
const FLOOR_T = 0.03;

function presetPose(preset: Preset, env: Envelope) {
  const size = Math.max(env.width, env.depth);
  const dist = size * 1.25 + 2.5;
  switch (preset) {
    case "front":
      return { position: new Vector3(0, 1.8, env.depth / 2 + dist), target: new Vector3(0, 0.9, 0) };
    case "top":
      return { position: new Vector3(0, size * 1.6 + 3, 0.01), target: new Vector3(0, 0, 0) };
    case "corner": {
      // Look in over an open side when there is one, so shell walls don't block the view.
      const side = env.openSides.right ? 1 : env.openSides.left ? -1 : 0;
      const sideways = side === 0 ? dist * 0.3 : side * (env.width / 2 + dist * 0.6);
      return {
        position: new Vector3(sideways, dist * 0.8, env.depth / 2 + dist * 0.75),
        target: new Vector3(0, 0.6, 0),
      };
    }
  }
}

export default function Scene3D() {
  const [preset, setPreset] = useState<Preset>("corner");
  const [presetKey, setPresetKey] = useState(0);
  const envelope = useDesignStore((s) => s.design.envelope);
  const initial = useMemo(() => presetPose("corner", envelope), []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (p: Preset) => {
    setPreset(p);
    setPresetKey((k) => k + 1);
  };

  return (
    <div className="absolute inset-0 touch-none">
      <Canvas
        shadows="percentage"
        // Render only when something changes, instead of 60 times a second.
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: initial.position.toArray(), fov: 45, near: 0.05, far: 200 }}
        onPointerMissed={() => useDesignStore.getState().select(null)}
      >
        <color attach="background" args={["#ecebe8"]} />
        <StudioLights envelope={envelope} />
        <Booth />
        <CameraRig preset={preset} presetKey={presetKey} />
      </Canvas>

      <div className="absolute left-3 top-3 flex overflow-hidden rounded-md bg-white text-xs font-medium shadow-sm ring-1 ring-stone-200">
        {(["front", "corner", "top"] as const).map((p) => (
          <button
            key={p}
            onClick={() => choose(p)}
            className={`px-3 py-1.5 capitalize ${preset === p ? "bg-accent text-white" : "text-stone-600 hover:bg-stone-50"}`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] text-stone-500 shadow-sm ring-1 ring-stone-200 lg:block">
        Drag to orbit · right-drag to pan · scroll to zoom · click an item to select it
      </div>
    </div>
  );
}

/** Neutral studio lighting built from local light panels (no HDR download needed). */
function StudioLights({ envelope }: { envelope: Envelope }) {
  const half = Math.max(envelope.width, envelope.depth) / 2 + 2;
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        castShadow
        position={[4, 9, 6]}
        intensity={1.6}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
      <Environment resolution={64} frames={1}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer form="rect" intensity={3} position={[0, 6, -4]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1.5} rotation-y={Math.PI / 2} position={[-6, 2, 0]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={1.5} rotation-y={-Math.PI / 2} position={[6, 2, 0]} scale={[10, 3, 1]} />
          <Lightformer form="ring" intensity={2} position={[0, 8, 8]} scale={4} />
        </group>
      </Environment>
    </>
  );
}

function Booth() {
  const design = useDesignStore((s) => s.design);
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);
  const issues = useIssues();
  const { width: W, depth: D, height: H, openSides } = design.envelope;
  const ox = -W / 2;
  const oz = -D / 2;

  const walls = [
    !openSides.back && { key: "back", pos: [0, H / 2, -D / 2 - WALL_T / 2], size: [W + WALL_T * 2, H, WALL_T] },
    !openSides.front && { key: "front", pos: [0, H / 2, D / 2 + WALL_T / 2], size: [W + WALL_T * 2, H, WALL_T] },
    !openSides.left && { key: "left", pos: [-W / 2 - WALL_T / 2, H / 2, 0], size: [WALL_T, H, D] },
    !openSides.right && { key: "right", pos: [W / 2 + WALL_T / 2, H / 2, 0], size: [WALL_T, H, D] },
  ].filter(Boolean) as { key: string; pos: [number, number, number]; size: [number, number, number] }[];

  return (
    <group>
      {/* Exhibition hall floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -FLOOR_T - 0.001, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#d9d6d0" roughness={1} />
      </mesh>
      {/* Booth floor: a thin box whose top is at y = 0 */}
      <mesh position={[0, -FLOOR_T / 2, 0]} receiveShadow>
        <boxGeometry args={[W, FLOOR_T, D]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
      </mesh>
      {/* Shell scheme walls on closed sides */}
      {walls.map((w) => (
        <mesh key={w.key} position={w.pos} castShadow receiveShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color="#fbfbfa" roughness={0.85} />
        </mesh>
      ))}
      {design.instances.map((inst) => (
        <Item3D
          key={inst.id}
          inst={inst}
          comp={getComponent(inst.componentId)}
          originX={ox}
          originZ={oz}
          elevation={baseElevation(inst, design)}
          selected={inst.id === selectedId}
          invalid={!!issues[inst.id]}
          onSelect={select}
        />
      ))}
    </group>
  );
}

/** Orbit controls plus a smooth move to the chosen camera preset. */
function CameraRig({ preset, presetKey }: { preset: Preset; presetKey: number }) {
  const envelope = useDesignStore((s) => s.design.envelope);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<{ position: Vector3; target: Vector3 } | null>(null);

  useEffect(() => {
    if (presetKey > 0) {
      goal.current = presetPose(preset, envelope);
      invalidate();
    }
  }, [preset, presetKey, envelope, invalidate]);

  useEffect(() => {
    controls.current?.target.set(0, 0.6, 0);
    controls.current?.update();
  }, []);

  useFrame((_, dt) => {
    const g = goal.current;
    const c = controls.current;
    if (!g || !c) return;
    const t = 1 - Math.exp(-dt * 6);
    camera.position.lerp(g.position, t);
    c.target.lerp(g.target, t);
    c.update();
    if (camera.position.distanceTo(g.position) < 0.01 && c.target.distanceTo(g.target) < 0.01) {
      goal.current = null;
    } else {
      invalidate(); // keep animating in demand mode
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      maxPolarAngle={Math.PI / 2 - 0.03}
      minDistance={1}
      maxDistance={40}
      onStart={() => (goal.current = null)}
    />
  );
}
