/**
 * Diagram type registry.
 *
 * Every entry is a real renderer with its own layout and drawing rules. Adding
 * a type means adding a module here, a reference doc, and example assets —
 * `scripts/verify-docs-sync.py` fails the build if any of those are missing.
 */

import architecture from "./architecture.js";
import c4Container from "./c4-container.js";
import c4Context from "./c4-context.js";
import fishbone from "./fishbone.js";
import heatmap from "./heatmap.js";
import kanban from "./kanban.js";
import sankey from "./sankey.js";
import serviceBlueprint from "./service-blueprint.js";
import stackedBar from "./stacked-bar.js";
import treemap from "./treemap.js";
import valueStream from "./value-stream.js";
import wardley from "./wardley.js";
import waterfall from "./waterfall.js";
import bar from "./bar.js";
import currentState from "./current-state.js";
import dataFlow from "./data-flow.js";
import deployment from "./deployment.js";
import er from "./er.js";
import flowchart from "./flowchart.js";
import gantt from "./gantt.js";
import highLevel from "./high-level.js";
import journey from "./journey.js";
import layers from "./layers.js";
import line from "./line.js";
import loop from "./loop.js";
import matrix from "./matrix.js";
import medallion from "./medallion.js";
import mindMap from "./mind-map.js";
import nested from "./nested.js";
import network from "./network.js";
import orgChart from "./org-chart.js";
import process from "./process.js";
import pyramid from "./pyramid.js";
import quadrant from "./quadrant.js";
import radar from "./radar.js";
import roadmap from "./roadmap.js";
import scatter from "./scatter.js";
import sequence from "./sequence.js";
import state from "./state.js";
import swimlane from "./swimlane.js";
import timeline from "./timeline.js";
import tree from "./tree.js";
import venn from "./venn.js";

/** Ordered for the library panel: structure, then hierarchy, then measurement. */
export const RENDERERS = [
  architecture,
  c4Context,
  c4Container,
  highLevel,
  currentState,
  flowchart,
  process,
  state,
  sequence,
  dataFlow,
  deployment,
  network,
  er,
  swimlane,
  serviceBlueprint,
  valueStream,
  kanban,
  tree,
  orgChart,
  nested,
  mindMap,
  loop,
  layers,
  medallion,
  pyramid,
  timeline,
  roadmap,
  journey,
  quadrant,
  matrix,
  wardley,
  fishbone,
  venn,
  radar,
  bar,
  line,
  scatter,
  stackedBar,
  waterfall,
  sankey,
  treemap,
  heatmap,
  gantt,
];

const byId = new Map(RENDERERS.map((renderer) => [renderer.id, renderer]));

/** Lightweight descriptors for menus and validation. */
export const DIAGRAM_TYPES = RENDERERS.map(({ id, label, family, description }) => ({ id, label, family, description }));

export const hasType = (id) => byId.has(id);

export function getRenderer(id) {
  const renderer = byId.get(id);
  if (renderer) return renderer;
  return byId.get("architecture");
}

export const getType = (id) => {
  const renderer = getRenderer(id);
  return { id: renderer.id, label: renderer.label, family: renderer.family, description: renderer.description };
};

/** Starter content for a type. Returns a fresh object every call. */
export const sampleFor = (id) => structuredClone(getRenderer(id).sample?.() ?? { nodes: [], edges: [] });
