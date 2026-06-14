import type { ComponentType } from "react";

const pageModules = import.meta.glob("./pages/*.tsx", {
  eager: true,
  import: "default",
}) as Record<string, ComponentType>;

export const pageRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(pageModules).map(([path, Component]) => {
    const name = path.match(/\.\/pages\/(.+)\.tsx$/)?.[1];
    return [name, Component];
  }).filter(([name]) => !!name)
);
