import type { DesignDocument } from "@/types/design";

const KEY = "booth-planner:design:v1";

export interface SavedProject {
  projectName: string;
  design: DesignDocument;
  savedAt: string;
}

function isDesign(value: unknown): value is DesignDocument {
  const d = value as DesignDocument;
  return (
    !!d &&
    typeof d.envelope?.width === "number" &&
    typeof d.envelope?.depth === "number" &&
    Array.isArray(d.instances)
  );
}

export function loadProject(): SavedProject | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProject;
    return isDesign(parsed.design) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProject(projectName: string, design: DesignDocument): string | null {
  try {
    const savedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify({ projectName, design, savedAt } satisfies SavedProject));
    return savedAt;
  } catch {
    return null;
  }
}

export function downloadJson(projectName: string, design: DesignDocument) {
  const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  a.href = url;
  a.download = `${slug || "booth-design"}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
