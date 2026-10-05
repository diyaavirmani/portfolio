import type { Metadata } from "next";
import ColoredFolio from "./colored-folio";

export const metadata: Metadata = {
  title: "Diya Virmani · Colored Folio",
  description: "Diya Virmani's projects, tech stack, and work experience in agentic systems, RAG, and machine learning.",
};

export default function Page() {
  return <ColoredFolio />;
}
