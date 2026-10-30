"use client";

import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { Edges, useGLTF } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Box3, Mesh, MeshStandardMaterial, Vector3, type Material, type Object3D } from "three";
import type { CatalogueItem, Instance } from "@/types/design";

/** Load models without the Draco decoder (it would be fetched from a CDN); meshopt decodes locally. */
export const useModel = (url: string) => useGLTF(url, false);
export const preloadModel = (url: string) => useGLTF.preload(url, false);

/**
 * Tinted copies of model materials, shared by every item with the same model,
 * material and colour, so ten red chairs use one material, not ten.
 */
const tintCache = new Map<string, Material>();
function tintedMaterial(base: Material, url: string, color: string) {
  const key = `${url}|${base.name}|${color}`;
  let m = tintCache.get(key);
  if (!m) {
    m = base.clone();
    if (m instanceof MeshStandardMaterial) m.color.set(color);
    tintCache.set(key, m);
  }
  return m;
}

interface Props {
  inst: Instance;
  comp: CatalogueItem | undefined;
  /** Booth origin offset: 2D (x, y) metres → 3D (x - W/2, z - D/2). */
  originX: number;
  originZ: number;
  elevation: number;
  selected: boolean;
  invalid: boolean;
  onSelect: (id: string) => void;
}

export function Item3D({ inst, comp, originX, originZ, elevation, selected, invalid, onSelect }: Props) {
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(inst.id);
  };
  const box = <BoxItem inst={inst} comp={comp} />;

  return (
    <group
      position={[inst.x + originX, elevation, inst.y + originZ]}
      // 2D rotation is clockwise seen from above; in three.js that is a negative turn around Y.
      rotation={[0, (-inst.rotation * Math.PI) / 180, 0]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {comp?.kind === "model" && comp.modelUrl ? (
        <ModelErrorBoundary fallback={box}>
          <Suspense fallback={box}>
            <ModelItem url={comp.modelUrl} inst={inst} comp={comp} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        box
      )}
      {(selected || invalid) && (
        <mesh position={[0, inst.height / 2, 0]} raycast={() => null}>
          <boxGeometry args={[inst.width + 0.03, inst.height + 0.03, inst.depth + 0.03]} />
          <meshBasicMaterial transparent opacity={invalid ? 0.12 : 0} color="#dc2626" depthWrite={false} />
          <Edges color={invalid ? "#dc2626" : "#2563eb"} lineWidth={2} />
        </mesh>
      )}
    </group>
  );
}

/** Generated geometry for walls, counters, platforms, flooring, and fallback for models. */
function BoxItem({ inst, comp }: { inst: Instance; comp: CatalogueItem | undefined }) {
  const isFloor = comp?.layer === "floor";
  return (
    <mesh position={[0, inst.height / 2, 0]} castShadow={!isFloor} receiveShadow>
      <boxGeometry args={[inst.width, inst.height, inst.depth]} />
      <meshStandardMaterial color={inst.color} roughness={isFloor ? 0.95 : 0.6} />
    </mesh>
  );
}

/**
 * Loads a GLB, measures its bounding box, and scales it so it matches the
 * catalogue width/depth/height exactly, with its base on the floor.
 */
function ModelItem({ url, inst, comp }: { url: string; inst: Instance; comp: CatalogueItem }) {
  const { scene } = useModel(url);
  const invalidate = useThree((s) => s.invalidate);

  // Clone the hierarchy only; geometry and untinted materials stay shared with the cached model.
  const { object, size, center, minY } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o: Object3D) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.baseMaterial = mesh.material;
    });
    const bounds = new Box3().setFromObject(object);
    return {
      object,
      size: bounds.getSize(new Vector3()),
      center: bounds.getCenter(new Vector3()),
      minY: bounds.min.y,
    };
  }, [scene]);

  // Apply the instance colour to the catalogue's tint materials only.
  useEffect(() => {
    const tint = new Set(comp.tintMaterials ?? []);
    const pick = (m: Material) => (tint.has(m.name) ? tintedMaterial(m, url, inst.color) : m);
    object.traverse((o: Object3D) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const base = mesh.userData.baseMaterial as Material | Material[];
      mesh.material = Array.isArray(base) ? base.map(pick) : pick(base);
    });
    invalidate(); // changed outside React, so ask for a frame
  }, [object, url, comp.tintMaterials, inst.color, invalidate]);

  const sx = inst.width / (size.x || 1);
  const sy = inst.height / (size.y || 1);
  const sz = inst.depth / (size.z || 1);

  return (
    <group scale={[sx, sy, sz]}>
      <primitive object={object} position={[-center.x, -minY, -center.z]} />
    </group>
  );
}

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
