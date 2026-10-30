/** All lengths are in metres. Rotation is in degrees, clockwise when seen from above. */

export type Side = "front" | "back" | "left" | "right";

export type OpenSides = Record<Side, boolean>;

export interface Envelope {
  width: number; // along x
  depth: number; // along y (2D) / z (3D); the front edge is at y = depth
  height: number; // shell wall height
  openSides: OpenSides;
}

export interface Instance {
  id: string;
  componentId: string;
  /** Centre of the item, measured from the back-left corner of the booth. */
  x: number;
  y: number;
  rotation: number;
  width: number;
  depth: number;
  height: number;
  color: string;
}

export interface DesignDocument {
  envelope: Envelope;
  instances: Instance[];
}

export type Category =
  | "Structure"
  | "Counters"
  | "Seating"
  | "Tables"
  | "Displays & Screens"
  | "Decor";

export type ComponentKind = "model" | "wall" | "box";

/**
 * floor:    lies flat on the floor (flooring, platform, rug); never overlaps anything
 * object:   normal furniture; checked for overlaps
 * overhead: mounted on top of the shell walls (fascia); never overlaps anything
 */
export type Layer = "floor" | "object" | "overhead";

export interface CatalogueItem {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  width: number;
  depth: number;
  height: number;
  defaultColor: string;
  kind: ComponentKind;
  modelUrl?: string;
  /** Kenney asset name: picks the GLB model and the Isometric / Side images. */
  asset?: string;
  layer?: Layer; // default "object"
  /** Other items can stand on top of it (tables, counters, cabinets). */
  surface?: boolean;
  /** Small item that may stand on a surface (screens, desk plants). */
  onSurface?: boolean;
  /** Model material names that take the instance colour. Others keep their original colour. */
  tintMaterials?: string[];
  /** Which dimensions the user may change. Default: all three. */
  resizable?: ("width" | "depth" | "height")[];
}
