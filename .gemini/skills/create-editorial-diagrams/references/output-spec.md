# Output specification

## Size presets

| Preset | ViewBox | Minimum label | Use |
| --- | --- | --- | --- |
| `doc-inline` | 720 × 480 | 12 px | Article column |
| `doc-wide` | 1200 × 760 | 14 px | Wide article or report |
| `slide-16x9` | 1600 × 900 | 18 px | Presentation |
| `slide-4x3` | 1200 × 900 | 18 px | Legacy presentation |
| `social-og` | 1200 × 630 | 18 px | Link preview |
| `social-square` | 1080 × 1080 | 20 px | Social post |
| `print-a4-landscape` | 1123 × 794 | 14 px | A4 at 96 dpi |
| `fit` | Content bounds + padding | 14 px | SVG component |

## Detail presets

- `faithful`: keep up to 24 nodes; preserve zones, uncommon paths, and technical sublabels.
- `balanced`: keep up to 12 nodes; merge repeated leaves and convert small decisions to edge labels.
- `simplified`: keep up to 7 nodes; preserve only the central reading path and one important exception.

## Audience language

- `engineer`: retain service names, protocols, ports, field types, and failure paths.
- `mixed`: use plain labels with compact technical sublabels.
- `executive`: describe capabilities, ownership, value, risk, and outcomes.

## Export checklist

- SVG opens independently and contains no unresolved external styles.
- PNG is at least 2× the delivery pixel size when raster quality matters.
- PDF page size matches the requested print or slide ratio.
- HTML works without a build step unless the user requested an application component.
- Filenames use lowercase words separated by hyphens.
