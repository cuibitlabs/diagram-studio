import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const skill = resolve(root, "skills/create-editorial-diagrams");
const destinations = [
  ".claude/skills/create-editorial-diagrams",
  ".gemini/skills/create-editorial-diagrams",
];
for (const destination of destinations) {
  const target = resolve(root, destination);
  await mkdir(resolve(target, ".."), { recursive: true });
  await rm(target, { recursive: true, force: true });
  await cp(skill, target, { recursive: true });
}
console.log(`Synced ${destinations.length} native skill adapters.`);
