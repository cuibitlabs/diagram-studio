import assert from "node:assert/strict";
import test from "node:test";

import { lightnessOf, mix, normaliseColor, parseColor, rgbToHsl, saturationOf, toHex } from "../src/theme/color.js";
import {
  CVD_TYPES,
  TARGET,
  auditTheme,
  bestOn,
  contrastRatio,
  luminance,
  repairContrast,
  repairTheme,
  simulateCVD,
} from "../src/theme/contrast.js";
import { PALETTES, completeTheme } from "../src/theme/palettes.js";

test("parses every colour syntax a stylesheet might use", () => {
  assert.deepEqual(parseColor("#fff"), { r: 255, g: 255, b: 255 });
  assert.equal(normaliseColor("#ABCdef"), "#abcdef");
  assert.equal(normaliseColor("rgb(255, 0, 0)"), "#ff0000");
  assert.equal(normaliseColor("rgba(0 128 255 / 0.5)"), "#0080ff");
  assert.equal(normaliseColor("hsl(120 100% 50%)"), "#00ff00");
  assert.equal(normaliseColor("transparent"), null);
  assert.equal(normaliseColor("var(--brand)"), null);
  assert.equal(normaliseColor(""), null);
});

test("oklch resolves to the expected sRGB neighbourhood", () => {
  // oklch(0.628 0.2577 29.23) is the Oklab definition of sRGB red.
  const red = parseColor("oklch(0.628 0.2577 29.23)");
  assert.ok(red.r > 245, `expected near-255 red, got ${red.r}`);
  assert.ok(red.g < 20 && red.b < 20, `expected low green/blue, got ${red.g}/${red.b}`);

  const white = parseColor("oklch(1 0 0)");
  assert.equal(toHex(white), "#ffffff");
});

test("hsl round trips", () => {
  const hsl = rgbToHsl({ r: 0, g: 128, b: 255 });
  assert.ok(Math.abs(hsl.h - 210) < 1);
  assert.ok(hsl.s > 0.9);
});

test("saturation and lightness rank colours sensibly", () => {
  assert.ok(saturationOf("#e85d3f") > saturationOf("#8a8a88"));
  assert.ok(lightnessOf("#ffffff") > lightnessOf("#222222"));
});

test("mix interpolates", () => {
  assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
  assert.equal(mix("#000000", "#ffffff", 0), "#000000");
});

test("contrast ratio matches the WCAG reference values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  // #767676 on white is the canonical 4.5:1 boundary colour.
  assert.ok(Math.abs(contrastRatio("#767676", "#ffffff") - 4.54) < 0.05);
  assert.ok(luminance("#ffffff") > luminance("#000000"));
});

test("bestOn picks the readable foreground", () => {
  assert.equal(bestOn("#ffffff"), "#111111");
  assert.equal(bestOn("#111111"), "#ffffff");
});

test("repairContrast reaches the target and keeps the hue", () => {
  const before = "#9ad1ff";
  const result = repairContrast(before, "#ffffff", TARGET.bodyText);
  assert.equal(result.achieved, true);
  assert.ok(contrastRatio(result.color, "#ffffff") >= TARGET.bodyText);
  const hueBefore = rgbToHsl(parseColor(before)).h;
  const hueAfter = rgbToHsl(parseColor(result.color)).h;
  assert.ok(Math.abs(hueBefore - hueAfter) < 2, `hue drifted ${hueBefore} -> ${hueAfter}`);
});

test("repairContrast leaves a passing colour alone", () => {
  const result = repairContrast("#111111", "#ffffff");
  assert.equal(result.adjusted, false);
  assert.equal(result.color, "#111111");
});

test("every shipped palette passes its contrast contract", () => {
  for (const [id, palette] of Object.entries(PALETTES)) {
    for (const row of auditTheme(palette)) {
      assert.ok(row.pass, `${id}: ${row.pair} is ${row.ratio}:1, needs ${row.target}:1 (${row.note})`);
    }
  }
});

test("repairTheme fixes a failing brand theme without moving the background", () => {
  const broken = completeTheme({
    paper: "#ffffff",
    panel: "#ffffff",
    ink: "#bbbbbb",
    muted: "#cccccc",
    accent: "#ffe08a",
    accent2: "#f0f0f0",
    line: "#eeeeee",
    onAccent: "#ffffff",
  });
  const { theme, changes } = repairTheme(broken);
  assert.equal(theme.paper, "#ffffff", "background must not be moved");
  assert.ok(changes.length > 0);
  for (const row of auditTheme(theme)) {
    if (row.pair === "line-on-panel") continue;
    assert.ok(row.pass, `${row.pair} still fails at ${row.ratio}:1`);
  }
});

test("colour-vision simulation covers the common types", () => {
  assert.deepEqual(CVD_TYPES, ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]);
  const grey = simulateCVD("#e85d3f", "achromatopsia");
  const rgb = parseColor(grey);
  assert.equal(rgb.r, rgb.g);
  assert.equal(rgb.g, rgb.b);
});

test("completeTheme fills the derived roles", () => {
  const theme = completeTheme({ accent: "#123456" });
  assert.ok(theme.lineStrong);
  assert.ok(theme.onAccent);
  assert.equal(theme.accent, "#123456");
});
