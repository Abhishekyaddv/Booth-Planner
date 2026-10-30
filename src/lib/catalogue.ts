import type { CatalogueItem, Category } from "@/types/design";
import { modelUrl } from "./assets";

const WOOD = ["wood"];
const FABRIC = ["carpet", "carpetBlue"];

export const CATEGORIES: Category[] = [
  "Structure",
  "Counters",
  "Seating",
  "Tables",
  "Displays & Screens",
  "Decor",
];

/** Subcategories in display order, per category. */
export const SUBCATEGORIES: Record<Category, string[]> = {
  Structure: ["Walls & fascia", "Floors & platforms", "Rooms"],
  Counters: ["Reception", "Desks"],
  Seating: ["Chairs", "Bar stools", "Sofas & lounge", "Benches"],
  Tables: ["Meeting", "Coffee & side"],
  "Displays & Screens": ["Screens & tech", "Shelving & storage", "Plinths"],
  Decor: ["Plants", "Lighting", "Rugs", "Accessories"],
};

type Entry = Omit<CatalogueItem, "modelUrl">;

// `asset` is the Kenney file name; the model URL is derived from it.
const ENTRIES: Entry[] = [
  // Structure: generated in code
  { id: "wall-panel", name: "Wall panel", category: "Structure", subcategory: "Walls & fascia", kind: "wall", width: 1, depth: 0.08, height: 2.5, defaultColor: "#f4f4f2", resizable: ["width", "height"] },
  { id: "fascia", name: "Fascia board", category: "Structure", subcategory: "Walls & fascia", kind: "box", layer: "overhead", width: 3, depth: 0.05, height: 0.3, defaultColor: "#1f6feb", resizable: ["width", "height"] },
  { id: "platform", name: "Raised platform", category: "Structure", subcategory: "Floors & platforms", kind: "box", layer: "floor", width: 2, depth: 2, height: 0.1, defaultColor: "#d6d3d1" },
  { id: "flooring", name: "Carpet flooring", category: "Structure", subcategory: "Floors & platforms", kind: "box", layer: "floor", width: 3, depth: 3, height: 0.01, defaultColor: "#9ca3af", resizable: ["width", "depth"] },
  { id: "storage-room", name: "Storage room", category: "Structure", subcategory: "Rooms", kind: "box", width: 1, depth: 1, height: 2.5, defaultColor: "#d6d3d1" },

  // Counters
  { id: "reception-counter", name: "Reception counter", category: "Counters", subcategory: "Reception", kind: "box", surface: true, width: 1.2, depth: 0.5, height: 1.0, defaultColor: "#ffffff" },
  { id: "info-desk", name: "Info desk", category: "Counters", subcategory: "Desks", kind: "model", asset: "desk", surface: true, width: 1.4, depth: 0.7, height: 0.75, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "corner-desk", name: "Corner desk", category: "Counters", subcategory: "Desks", kind: "model", asset: "deskCorner", surface: true, width: 1.4, depth: 1.4, height: 0.75, defaultColor: "#e6994f", tintMaterials: WOOD },

  // Seating
  { id: "chair", name: "Wooden chair", category: "Seating", subcategory: "Chairs", kind: "model", asset: "chair", width: 0.45, depth: 0.45, height: 0.9, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "chair-cushion", name: "Cushioned chair", category: "Seating", subcategory: "Chairs", kind: "model", asset: "chairCushion", width: 0.45, depth: 0.45, height: 0.9, defaultColor: "#f05e57", tintMaterials: ["carpet"] },
  { id: "chair-modern", name: "Modern chair", category: "Seating", subcategory: "Chairs", kind: "model", asset: "chairModernCushion", width: 0.45, depth: 0.45, height: 0.9, defaultColor: "#5c85de", tintMaterials: FABRIC },
  { id: "chair-modern-frame", name: "Frame chair", category: "Seating", subcategory: "Chairs", kind: "model", asset: "chairModernFrameCushion", width: 0.45, depth: 0.45, height: 0.9, defaultColor: "#5c85de", tintMaterials: FABRIC },
  { id: "chair-rounded", name: "Rounded chair", category: "Seating", subcategory: "Chairs", kind: "model", asset: "chairRounded", width: 0.45, depth: 0.45, height: 0.9, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "office-chair", name: "Office chair", category: "Seating", subcategory: "Chairs", kind: "model", asset: "chairDesk", width: 0.6, depth: 0.6, height: 1.0, defaultColor: "#f05e57", tintMaterials: FABRIC },
  { id: "bar-stool", name: "Bar stool", category: "Seating", subcategory: "Bar stools", kind: "model", asset: "stoolBar", width: 0.4, depth: 0.4, height: 0.75, defaultColor: "#f05e57", tintMaterials: FABRIC },
  { id: "bar-stool-square", name: "Square bar stool", category: "Seating", subcategory: "Bar stools", kind: "model", asset: "stoolBarSquare", width: 0.4, depth: 0.4, height: 0.75, defaultColor: "#f05e57", tintMaterials: FABRIC },
  { id: "lounge-chair", name: "Lounge armchair", category: "Seating", subcategory: "Sofas & lounge", kind: "model", asset: "loungeChair", width: 0.8, depth: 0.7, height: 0.75, defaultColor: "#f05e57", tintMaterials: FABRIC },
  { id: "loveseat", name: "Designer loveseat", category: "Seating", subcategory: "Sofas & lounge", kind: "model", asset: "loungeDesignChair", width: 1.4, depth: 0.8, height: 0.75, defaultColor: "#5c85de", tintMaterials: FABRIC },
  { id: "sofa", name: "Sofa", category: "Seating", subcategory: "Sofas & lounge", kind: "model", asset: "loungeSofa", width: 2.0, depth: 0.85, height: 0.8, defaultColor: "#f05e57", tintMaterials: FABRIC },
  { id: "sofa-design", name: "Designer sofa", category: "Seating", subcategory: "Sofas & lounge", kind: "model", asset: "loungeDesignSofa", width: 2.2, depth: 0.8, height: 0.75, defaultColor: "#5c85de", tintMaterials: FABRIC },
  { id: "sofa-corner", name: "Corner sofa", category: "Seating", subcategory: "Sofas & lounge", kind: "model", asset: "loungeSofaCorner", width: 2.0, depth: 2.0, height: 0.8, defaultColor: "#f05e57", tintMaterials: FABRIC },
  { id: "bench", name: "Wooden bench", category: "Seating", subcategory: "Benches", kind: "model", asset: "bench", width: 1.0, depth: 0.45, height: 0.8, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "bench-cushion", name: "Cushioned bench", category: "Seating", subcategory: "Benches", kind: "model", asset: "benchCushionLow", width: 1.2, depth: 0.6, height: 0.45, defaultColor: "#f05e57", tintMaterials: ["carpet"] },

  // Tables
  { id: "meeting-table", name: "Meeting table", category: "Tables", subcategory: "Meeting", kind: "model", asset: "table", surface: true, width: 1.6, depth: 0.85, height: 0.75, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "meeting-table-glass", name: "Glass meeting table", category: "Tables", subcategory: "Meeting", kind: "model", asset: "tableGlass", surface: true, width: 1.6, depth: 0.85, height: 0.75, defaultColor: "#bdd4ff", tintMaterials: ["metal"] },
  { id: "trestle-table", name: "Trestle table", category: "Tables", subcategory: "Meeting", kind: "model", asset: "tableCross", surface: true, width: 1.6, depth: 0.85, height: 0.75, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "round-table", name: "Round table", category: "Tables", subcategory: "Meeting", kind: "model", asset: "tableRound", surface: true, width: 0.9, depth: 0.9, height: 0.75, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "coffee-table", name: "Coffee table", category: "Tables", subcategory: "Coffee & side", kind: "model", asset: "tableCoffee", surface: true, width: 1.0, depth: 0.6, height: 0.4, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "coffee-table-glass", name: "Glass coffee table", category: "Tables", subcategory: "Coffee & side", kind: "model", asset: "tableCoffeeGlass", surface: true, width: 1.0, depth: 0.6, height: 0.4, defaultColor: "#bdd4ff", tintMaterials: ["metal"] },
  { id: "console-table", name: "Console table", category: "Tables", subcategory: "Coffee & side", kind: "model", asset: "sideTable", surface: true, width: 1.0, depth: 0.4, height: 0.75, defaultColor: "#e6994f", tintMaterials: WOOD },

  // Displays & Screens
  { id: "tv-screen", name: "TV screen 55\"", category: "Displays & Screens", subcategory: "Screens & tech", kind: "model", asset: "televisionModern", onSurface: true, width: 1.25, depth: 0.3, height: 0.85, defaultColor: "#4f6363", tintMaterials: ["metalDark"] },
  { id: "monitor", name: "Monitor", category: "Displays & Screens", subcategory: "Screens & tech", kind: "model", asset: "computerScreen", onSurface: true, width: 0.6, depth: 0.2, height: 0.45, defaultColor: "#4f6363", tintMaterials: ["metalDark"] },
  { id: "laptop", name: "Laptop", category: "Displays & Screens", subcategory: "Screens & tech", kind: "model", asset: "laptop", onSurface: true, width: 0.35, depth: 0.3, height: 0.22, defaultColor: "#4f6363", tintMaterials: ["metalDark"] },
  { id: "speaker", name: "Floor speaker", category: "Displays & Screens", subcategory: "Screens & tech", kind: "model", asset: "speaker", width: 0.3, depth: 0.3, height: 1.2, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "speaker-small", name: "Desk speaker", category: "Displays & Screens", subcategory: "Screens & tech", kind: "model", asset: "speakerSmall", onSurface: true, width: 0.18, depth: 0.16, height: 0.35, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "media-cabinet", name: "Media cabinet", category: "Displays & Screens", subcategory: "Shelving & storage", kind: "model", asset: "cabinetTelevision", surface: true, width: 1.6, depth: 0.45, height: 0.6, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "media-cabinet-doors", name: "Media cabinet with doors", category: "Displays & Screens", subcategory: "Shelving & storage", kind: "model", asset: "cabinetTelevisionDoors", surface: true, width: 1.6, depth: 0.45, height: 0.6, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "display-shelf", name: "Display shelf", category: "Displays & Screens", subcategory: "Shelving & storage", kind: "model", asset: "bookcaseOpen", width: 0.8, depth: 0.35, height: 1.8, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "display-shelf-low", name: "Low display shelf", category: "Displays & Screens", subcategory: "Shelving & storage", kind: "model", asset: "bookcaseOpenLow", surface: true, width: 0.8, depth: 0.35, height: 0.8, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "cupboard", name: "Tall cupboard", category: "Displays & Screens", subcategory: "Shelving & storage", kind: "model", asset: "bookcaseClosedDoors", width: 0.8, depth: 0.45, height: 1.8, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "storage-cabinet", name: "Storage cabinet", category: "Displays & Screens", subcategory: "Shelving & storage", kind: "model", asset: "bookcaseClosedWide", width: 1.6, depth: 0.4, height: 1.6, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "storage-box", name: "Storage box", category: "Displays & Screens", subcategory: "Shelving & storage", kind: "model", asset: "cardboardBoxClosed", width: 0.5, depth: 0.5, height: 0.6, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "display-plinth", name: "Display plinth", category: "Displays & Screens", subcategory: "Plinths", kind: "box", surface: true, width: 0.5, depth: 0.5, height: 1.0, defaultColor: "#ffffff" },
  { id: "display-plinth-low", name: "Low plinth", category: "Displays & Screens", subcategory: "Plinths", kind: "box", surface: true, width: 0.8, depth: 0.8, height: 0.45, defaultColor: "#ffffff" },

  // Decor
  { id: "tall-plant", name: "Tall plant", category: "Decor", subcategory: "Plants", kind: "model", asset: "pottedPlant", width: 0.5, depth: 0.5, height: 1.4, defaultColor: "#ad7547", tintMaterials: ["woodDark"] },
  { id: "desk-plant", name: "Desk plant", category: "Decor", subcategory: "Plants", kind: "model", asset: "plantSmall1", onSurface: true, width: 0.2, depth: 0.2, height: 0.3, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "desk-plant-2", name: "Desk plant (leafy)", category: "Decor", subcategory: "Plants", kind: "model", asset: "plantSmall2", onSurface: true, width: 0.2, depth: 0.2, height: 0.3, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "desk-plant-3", name: "Desk plant (cactus)", category: "Decor", subcategory: "Plants", kind: "model", asset: "plantSmall3", onSurface: true, width: 0.2, depth: 0.2, height: 0.32, defaultColor: "#e6994f", tintMaterials: WOOD },
  { id: "floor-lamp-round", name: "Floor lamp (round)", category: "Decor", subcategory: "Lighting", kind: "model", asset: "lampRoundFloor", width: 0.4, depth: 0.4, height: 1.7, defaultColor: "#bdd1d6", tintMaterials: ["metal"] },
  { id: "floor-lamp-square", name: "Floor lamp (square)", category: "Decor", subcategory: "Lighting", kind: "model", asset: "lampSquareFloor", width: 0.35, depth: 0.35, height: 1.7, defaultColor: "#bdd1d6", tintMaterials: ["metal"] },
  { id: "table-lamp-round", name: "Table lamp (round)", category: "Decor", subcategory: "Lighting", kind: "model", asset: "lampRoundTable", onSurface: true, width: 0.25, depth: 0.25, height: 0.5, defaultColor: "#bdd1d6", tintMaterials: ["metal"] },
  { id: "table-lamp-square", name: "Table lamp (square)", category: "Decor", subcategory: "Lighting", kind: "model", asset: "lampSquareTable", onSurface: true, width: 0.2, depth: 0.2, height: 0.5, defaultColor: "#bdd1d6", tintMaterials: ["metal"] },
  { id: "rug", name: "Rug", category: "Decor", subcategory: "Rugs", kind: "model", asset: "rugRectangle", layer: "floor", width: 2.0, depth: 1.2, height: 0.01, defaultColor: "#f05e57", tintMaterials: ["carpet"], resizable: ["width", "depth"] },
  { id: "rug-rounded", name: "Rounded rug", category: "Decor", subcategory: "Rugs", kind: "model", asset: "rugRounded", layer: "floor", width: 2.0, depth: 1.2, height: 0.01, defaultColor: "#f05e57", tintMaterials: ["carpet"], resizable: ["width", "depth"] },
  { id: "rug-square", name: "Square rug", category: "Decor", subcategory: "Rugs", kind: "model", asset: "rugSquare", layer: "floor", width: 1.6, depth: 1.6, height: 0.01, defaultColor: "#f05e57", tintMaterials: ["carpet"], resizable: ["width", "depth"] },
  { id: "rug-round", name: "Round rug", category: "Decor", subcategory: "Rugs", kind: "model", asset: "rugRound", layer: "floor", width: 1.6, depth: 1.6, height: 0.01, defaultColor: "#f05e57", tintMaterials: ["carpet"], resizable: ["width", "depth"] },
  { id: "books", name: "Brochure stack", category: "Decor", subcategory: "Accessories", kind: "model", asset: "books", onSurface: true, width: 0.3, depth: 0.2, height: 0.2, defaultColor: "#9c4c4a", tintMaterials: ["carpetDarker"] },
  { id: "bin", name: "Waste bin", category: "Decor", subcategory: "Accessories", kind: "model", asset: "trashcan", width: 0.35, depth: 0.3, height: 0.6, defaultColor: "#bdd1d6", tintMaterials: ["metal"] },
  { id: "coat-stand", name: "Coat stand", category: "Decor", subcategory: "Accessories", kind: "model", asset: "coatRackStanding", width: 0.5, depth: 0.5, height: 1.8, defaultColor: "#e6994f", tintMaterials: WOOD },
];

export const CATALOGUE: CatalogueItem[] = ENTRIES.map((e) =>
  e.asset ? { ...e, modelUrl: modelUrl(e.asset) } : e,
);

const BY_ID = new Map(CATALOGUE.map((c) => [c.id, c]));

export function getComponent(id: string): CatalogueItem | undefined {
  return BY_ID.get(id);
}

export function layerOf(item: CatalogueItem | undefined) {
  return item?.layer ?? "object";
}

/** dataTransfer type used when dragging a catalogue card onto the 2D plan. */
export const DRAG_MIME = "application/x-booth-component";
