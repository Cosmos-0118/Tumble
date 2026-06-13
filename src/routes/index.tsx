import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Factory = lazy(() => import("@/components/Factory"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oddly Satisfying Factory" },
      {
        name: "description",
        content:
          "A tiny Rube Goldberg sandbox. Drop colored balls, build ramps and bumpers, and listen to the chain reactions.",
      },
      { property: "og:title", content: "Oddly Satisfying Factory" },
      {
        property: "og:description",
        content:
          "A tiny Rube Goldberg sandbox. Drop colored balls, build ramps and bumpers, and listen to the chain reactions.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading factory…</div>}>
      <Factory />
    </Suspense>
  );
}
