/**
 * Colour parsing and conversion.
 *
 * Brand extraction has to cope with whatever a site actually ships: hex,
 * `rgb()`, `hsl()`, `oklch()` and custom properties. Everything is normalised
 * to sRGB here so the rest of the theme layer only deals with one shape.
 */

const NAMED = {
  black: "#000000",
  white: "#ffffff",
  transparent: null,
  currentcolor: null,
  inherit: null,
};

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const clamp255 = (value) => Math.round(clamp(value, 0, 255));

const hex2 = (value) => clamp255(value).toString(16).padStart(2, "0");

/** @returns {string} `#rrggbb` */
export const toHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

function parseNumberList(source) {
  return source
    .split(/[\s,/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const asNumber = (token, scale = 1) =>
  token.endsWith("%") ? (Number.parseFloat(token) / 100) * scale : Number.parseFloat(token);

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    hue < 60 ? [c, x, 0] :
    hue < 120 ? [x, c, 0] :
    hue < 180 ? [0, c, x] :
    hue < 240 ? [0, x, c] :
    hue < 300 ? [x, 0, c] : [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
  else h = 60 * ((rn - gn) / delta + 4);
  return { h: (h + 360) % 360, s, l };
}

export const hslToHex = (h, s, l) => toHex(hslToRgb(h, s, l));

const gammaEncode = (value) => (value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055);

/** OKLCH → sRGB. Constants from the Oklab definition. */
function oklchToRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: clamp(gammaEncode(clamp(lr)), 0, 1) * 255,
    g: clamp(gammaEncode(clamp(lg)), 0, 1) * 255,
    b: clamp(gammaEncode(clamp(lb)), 0, 1) * 255,
  };
}

/**
 * Parse any CSS colour this project might meet.
 *
 * @param {string} input
 * @returns {{r:number,g:number,b:number}|null} null when the value is not a
 *   concrete colour (`transparent`, `currentColor`, an unresolved var()).
 */
export function parseColor(input) {
  if (!input) return null;
  const value = String(input).trim().toLowerCase();
  if (value in NAMED) return NAMED[value] ? parseColor(NAMED[value]) : null;

  if (value.startsWith("#")) {
    const digits = value.slice(1);
    if (digits.length === 3 || digits.length === 4) {
      const [r, g, b] = [...digits.slice(0, 3)].map((char) => Number.parseInt(char + char, 16));
      return { r, g, b };
    }
    if (digits.length === 6 || digits.length === 8) {
      return {
        r: Number.parseInt(digits.slice(0, 2), 16),
        g: Number.parseInt(digits.slice(2, 4), 16),
        b: Number.parseInt(digits.slice(4, 6), 16),
      };
    }
    return null;
  }

  const call = value.match(/^([a-z-]+)\((.*)\)$/);
  if (!call) return null;
  const [, fn, body] = call;
  const parts = parseNumberList(body);
  if (!parts.length) return null;

  if (fn === "rgb" || fn === "rgba") {
    return { r: asNumber(parts[0], 255), g: asNumber(parts[1], 255), b: asNumber(parts[2], 255) };
  }
  if (fn === "hsl" || fn === "hsla") {
    return hslToRgb(Number.parseFloat(parts[0]), asNumber(parts[1], 1), asNumber(parts[2], 1));
  }
  if (fn === "oklch") {
    return oklchToRgb(asNumber(parts[0], 1), Number.parseFloat(parts[1]), Number.parseFloat(parts[2] ?? "0"));
  }
  return null;
}

/** Normalise any input to `#rrggbb`, or null when it is not a colour. */
export function normaliseColor(input) {
  const rgb = parseColor(input);
  return rgb ? toHex(rgb) : null;
}

/** How colourful a value is, 0–1. Used to tell a brand accent from a neutral. */
export function saturationOf(input) {
  const rgb = parseColor(input);
  if (!rgb) return 0;
  return rgbToHsl(rgb).s;
}

/** Perceived lightness, 0–1. */
export function lightnessOf(input) {
  const rgb = parseColor(input);
  if (!rgb) return 0;
  return rgbToHsl(rgb).l;
}

/** Mix two colours in sRGB. `amount` is how much of `b` to use. */
export function mix(a, b, amount = 0.5) {
  const first = parseColor(a);
  const second = parseColor(b);
  if (!first || !second) return normaliseColor(a) ?? "#000000";
  return toHex({
    r: first.r + (second.r - first.r) * amount,
    g: first.g + (second.g - first.g) * amount,
    b: first.b + (second.b - first.b) * amount,
  });
}
