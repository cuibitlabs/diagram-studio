/**
 * Node box measurement.
 *
 * A node's drawn size is derived from its content, never assumed. Fixed heights
 * were the single biggest source of clipped labels in the previous renderer.
 */

import { ceilTo, layoutParagraph, measureText } from "./text.js";
import { TYPE } from "./typography.js";
// Which names resolve to a glyph is a fact about the icon set, and the box has
// to agree with what will be drawn. Sizing here against `node.icon` while
// `nodeCard` drew against the resolved name left a gutter reserved for a glyph
// that was never emitted. `icons.js` is a static table with no dependencies.
import { resolveIcon } from "../render/icons.js";

export const BOX = {
  padX: 20,
  padY: 16,
  gap: 8,
  minW: 160,
  maxW: 288,
  minH: 64,
  maxTitleLines: 3,
  maxSubLines: 2,
  iconSize: 20,
  iconGap: 12,
  badge: 24,
};

/**
 * Measure one node.
 *
 * @param {object} node   model node (`label`, optional `sublabel`, `icon`, `badge`)
 * @param {object} [spec] overrides: `{minW, maxW, minH, titleStyle, subStyle, dense, padX, padY}`
 * @returns {{w:number,h:number,title:object,sub:object|null,contentX:number,truncated:boolean}}
 */
export function measureNodeBox(node, spec = {}) {
  const padX = spec.padX ?? BOX.padX;
  const padY = spec.padY ?? BOX.padY;
  const minW = spec.minW ?? BOX.minW;
  const maxW = spec.maxW ?? BOX.maxW;
  const minH = spec.minH ?? BOX.minH;
  const titleStyle = spec.titleStyle ?? (spec.dense ? TYPE.nodeTitleSmall : TYPE.nodeTitle);
  const subStyle = spec.subStyle ?? TYPE.nodeSub;

  const iconAllowance = resolveIcon(node.icon) ? BOX.iconSize + BOX.iconGap : 0;
  const hasBadge = Boolean(node.badge);
  const badgeAllowance = hasBadge ? BOX.badge + BOX.gap : 0;

  const innerMax = maxW - padX * 2 - iconAllowance - badgeAllowance;
  const title = layoutParagraph(node.label, innerMax, titleStyle, spec.maxTitleLines ?? BOX.maxTitleLines, titleStyle.leading);

  const subText = node.sublabel ? String(node.sublabel).trim() : "";
  const sub = subText
    ? layoutParagraph(subText, innerMax, subStyle, spec.maxSubLines ?? BOX.maxSubLines, subStyle.leading)
    : null;

  const contentWidth = Math.max(title.width, sub?.width ?? 0);
  const w = ceilTo(Math.min(maxW, Math.max(minW, contentWidth + padX * 2 + iconAllowance + badgeAllowance)));
  const contentHeight = title.height + (sub ? BOX.gap + sub.height : 0);
  const h = ceilTo(Math.max(minH, contentHeight + padY * 2));

  return {
    w,
    h,
    title,
    sub,
    contentX: padX + iconAllowance,
    padX,
    padY,
    truncated: title.truncated || Boolean(sub?.truncated),
  };
}

/**
 * Size every node in place. Nodes carrying `fixedSize: true` keep author-set
 * dimensions — used by imports that must preserve source geometry.
 *
 * @returns {string[]} ids of nodes whose text had to be truncated
 */
export function sizeNodes(nodes, spec = {}) {
  const truncated = [];
  for (const node of nodes) {
    if (node.fixedSize) continue;
    const box = measureNodeBox(node, spec);
    node.w = box.w;
    node.h = box.h;
    if (box.truncated) truncated.push(node.id);
  }
  return truncated;
}

/** Width of an edge label pill, including its padding. */
export function edgeLabelBox(label, style = TYPE.edgeLabel) {
  const text = String(label ?? "").trim();
  if (!text) return null;
  const width = measureText(text, style);
  return {
    text,
    w: ceilTo(width + 16),
    h: ceilTo(style.leading + 6),
  };
}
