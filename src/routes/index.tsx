import { createFileRoute } from "@tanstack/react-router";
import { StudioApp } from "@/components/StudioApp";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Spritely.AI — 2D Game Asset Pipeline" },
      { name: "description", content: "Generate consistent 2D game character sprites from natural language. Pro pipeline for indie devs and studios." },
      { property: "og:title", content: "Spritely.AI — 2D Game Asset Pipeline" },
      { property: "og:description", content: "Generate consistent 2D game character sprites from natural language." },
    ],
  }),
});

function Index() {
  return (
    <div className="dark">
      <StudioApp />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
