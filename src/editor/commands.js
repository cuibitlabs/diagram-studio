/**
 * Command registry and fuzzy matcher for the command palette.
 *
 * The registry is data, not DOM, so the palette's behaviour is testable and the
 * same list can drive keyboard shortcuts and menus.
 */

/**
 * Subsequence score. Higher is better; 0 means no match.
 * Consecutive characters and word-start hits score more, so "adn" ranks
 * "Add node" above "Align distribute nodes".
 */
export function score(query, text) {
  const needle = query.toLowerCase().trim();
  const haystack = text.toLowerCase();
  if (!needle) return 1;
  if (haystack.includes(needle)) return 1000 - haystack.indexOf(needle);

  let index = 0;
  let total = 0;
  let previous = -1;
  for (const char of needle) {
    const found = haystack.indexOf(char, index);
    if (found === -1) return 0;
    total += found === previous + 1 ? 6 : 1;
    if (found === 0 || haystack[found - 1] === " ") total += 4;
    previous = found;
    index = found + 1;
  }
  return total;
}

/** Rank commands against a query, dropping non-matches. */
export const filterCommands = (commands, query) =>
  commands
    .map((command) => ({ command, rank: Math.max(score(query, command.label), score(query, `${command.group} ${command.label}`) * 0.9) }))
    .filter((entry) => entry.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.command.label.localeCompare(b.command.label))
    .map((entry) => entry.command);

/**
 * Build the command list for the current editor state.
 *
 * @param {object} actions  named callbacks provided by the shell
 * @param {{selectionCount:number, types:Array, palettes:Array}} state
 */
export function buildCommands(actions, state) {
  const many = state.selectionCount >= 2;
  const three = state.selectionCount >= 3;

  const commands = [
    { id: "add-node", group: "Edit", label: "Add node", hint: "N", run: actions.addNode },
    { id: "duplicate", group: "Edit", label: "Duplicate selection", hint: "Ctrl+D", run: actions.duplicate, enabled: state.selectionCount > 0 },
    { id: "delete", group: "Edit", label: "Delete selection", hint: "Del", run: actions.deleteSelection, enabled: state.selectionCount > 0 },
    { id: "undo", group: "Edit", label: "Undo", hint: "Ctrl+Z", run: actions.undo },
    { id: "redo", group: "Edit", label: "Redo", hint: "Ctrl+Shift+Z", run: actions.redo },
    { id: "relayout", group: "Layout", label: "Re-layout from the model", run: actions.relayout },
    { id: "align-left", group: "Layout", label: "Align left", run: () => actions.align("left"), enabled: many },
    { id: "align-centre-x", group: "Layout", label: "Align centres horizontally", run: () => actions.align("centre-x"), enabled: many },
    { id: "align-right", group: "Layout", label: "Align right", run: () => actions.align("right"), enabled: many },
    { id: "align-top", group: "Layout", label: "Align top", run: () => actions.align("top"), enabled: many },
    { id: "align-centre-y", group: "Layout", label: "Align centres vertically", run: () => actions.align("centre-y"), enabled: many },
    { id: "align-bottom", group: "Layout", label: "Align bottom", run: () => actions.align("bottom"), enabled: many },
    { id: "distribute-h", group: "Layout", label: "Distribute horizontally", run: () => actions.distribute("horizontal"), enabled: three },
    { id: "distribute-v", group: "Layout", label: "Distribute vertically", run: () => actions.distribute("vertical"), enabled: three },
    { id: "present", group: "View", label: "Present step by step", hint: "F5", run: actions.present },
    { id: "toggle-grid", group: "View", label: "Toggle alignment grid", run: actions.toggleGrid },
    { id: "toggle-title", group: "View", label: "Toggle canvas title", run: actions.toggleTitle },
    { id: "fit", group: "View", label: "Fit to window", run: actions.fit },
    { id: "export-svg", group: "Export", label: "Export SVG", run: () => actions.export("svg") },
    { id: "export-png", group: "Export", label: "Export PNG", run: () => actions.export("png") },
    { id: "export-pdf", group: "Export", label: "Export PDF", run: () => actions.export("pdf") },
    { id: "export-html", group: "Export", label: "Export self-contained HTML", run: () => actions.export("html") },
    { id: "export-variants", group: "Export", label: "Export light, dark and titled variants", run: () => actions.export("variants") },
    { id: "export-mermaid", group: "Export", label: "Export Mermaid", run: () => actions.export("mermaid") },
    { id: "export-drawio", group: "Export", label: "Export draw.io", run: () => actions.export("drawio") },
    { id: "export-project", group: "Export", label: "Download editable project", run: actions.saveProject },
  ];

  for (const type of state.types ?? []) {
    commands.push({ id: `type-${type.id}`, group: "Structure", label: `Switch to ${type.label}`, hint: type.description, run: () => actions.setType(type.id) });
  }
  for (const palette of state.palettes ?? []) {
    commands.push({ id: `palette-${palette.id}`, group: "Theme", label: `Theme: ${palette.name}`, run: () => actions.setPalette(palette.id) });
  }

  return commands.filter((command) => command.enabled !== false);
}
