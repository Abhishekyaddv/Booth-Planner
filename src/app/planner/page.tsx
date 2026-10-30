import type { Metadata } from "next";
import { PlannerApp } from "@/components/planner/PlannerApp";

export const metadata: Metadata = {
  title: "Planner · Messe India Booth Planner",
};

export default function PlannerPage() {
  return <PlannerApp />;
}
