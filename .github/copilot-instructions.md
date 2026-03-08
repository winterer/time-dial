# Copilot Instructions for time-dial

## Project Overview

A vanilla Web Component library providing a time selection widget (`<time-dial>`) with circular dial interface. Single-file component with no runtime dependencies. **Key deliverables:** ES module build to `dist/time-dial.js`, theme stylesheet to `dist/time-dial-themes.css`.

## Architecture

### Component Structure

- **Class:** `TimeDial extends HTMLElement` (custom element `<time-dial>`)
- **Encapsulation:** Shadow DOM with inline styles
- **Rendering:** SVG with dynamic path generation for sectors and overlays
- **State:** Internal `_value: { hour: 0-11, minute: 0-59 }`

### Coordinate System & Constants

```javascript
INNER_RADIUS = 30;    // Hour disc radius
OUTER_RADIUS = 50;    // Minute disc radius
ViewBox = "-56 -56 112 112"
```

- **Angle origin:** 12 o'clock (north), clockwise from top
- **Hour range:** 0–11 (12-hour format, no 24-hour mode)
- **Minute range:** 0–59
- **Minute snapping:** Values normalize to `minute-step` (default 1)

## Key Patterns

### Reactive Attributes & Properties

Observed attributes auto-sync with internal state via `attributeChangedCallback()`:

```javascript
static get observedAttributes() {
  return ['hour', 'minute', 'value', 'size', 'minute-step', 'disabled', 'readonly', 'hour-display', 'minute-display'];
}
```

**Property getters/setters** mirror attributes (e.g., `dial.hour = 3` → `setAttribute('hour', '3')` → triggers callback).

**Value precedence (highest to lowest):**
1. Programmatic `value` property (e.g., `dial.value = '09:30'`)
2. `value` attribute (`HH:MM` format)
3. Separate `hour` and `minute` attributes
4. Default `00:00`

### Event Model

- **`input` event:** Fires continuously during pointer drag or keyboard adjustment
- **`change` event:** Fires on pointer up or keyboard value commit
- **Dispatch pattern:** `this._dispatchEvent('input', { hour, minute })` with `bubbles: true, composed: true`

### Display Modes

- `hour-display` / `minute-display`: `"none" | "ticks" | "dots" | "labels"` (defaults: `"ticks"` / `"dots"`)
- Overlap enforcement: only one overlay mode active per disc

### Pointer & Keyboard Interaction

- **Pointer capture:** `setPointerCapture()` during drag to track outside dial
- **Angle calculation:** `Math.atan2(y, x)` from SVG point, normalized to 0–360°
- **Keyboard:** Arrow keys (↑/↓/←/→) adjust values; H/M keys jump to disc; Tab navigates between discs

---

## Build & Development

### Vite Library Mode

**Config:** `vite.config.js`
- **Entry:** `src/time-dial.js`
- **Format:** ES module only
- **Output:** `dist/time-dial.js` (minified), `dist/time-dial-themes.css` (via custom plugin)

### Scripts

```bash
npm run build          # One-time production build
npm run build:watch   # Watch mode for development
npm run prepublishOnly # Auto-runs before npm publish
```

### Key Build Detail

A custom Vite plugin (name: `copy-themes-css`) copies `src/time-dial-themes.css` to dist using `generateBundle()` / `emitFile()`. Do not use `writeBundle()` + `copyFileSync()` (idiomatic Rollup approach changed).

---

## Styling & Customization

### CSS Parts (Shadow DOM)

Externally styleable parts (use `::part()` selector):

```css
time-dial::part(minute-disc) { /* Outer ring circle */ }
time-dial::part(hour-disc) { /* Inner ring circle */ }
time-dial::part(minute-sector) { /* Filled minute area */ }
time-dial::part(hour-sector) { /* Filled hour area */ }
time-dial::part(ticks) { /* Overlay tick/dot group */ }
time-dial::part(labels) { /* Numeric label group */ }
time-dial::part(svg) { /* Root SVG */ }
```

### CSS Custom Properties (theming)

All theming via `--td-*` variables (no color values hardcoded in shadow DOM):

```css
time-dial {
  --td-size: 240px;
  --td-minute-disc-fill: white;
  --td-hour-disc-fill: white;
  --td-minute-sector-fill: rgba(128, 255, 128, 0.5);
  --td-hour-sector-fill: rgba(0, 255, 0, 0.5);
  /* ... plus tick, dot, label, focus colors */
}
```

**Themes:** Pre-built classes in `src/time-dial-themes.css` (`.ocean-theme`, `.sunset-theme`, `.dark-theme`).

---

## Development Notes

### Accessibility (ARIA)

- Host: `role="group"`, custom `aria-label` support
- Discs: `role="slider"` with `aria-valuenow`, `aria-valuetext`, `aria-valuemin`, `aria-valuemax`
- Focus rings: `:focus-visible` only (keyboard nav indicator)

### SVG Rendering Methods

- **Sectors:** `_sectorPath(radius, angle)` → M/L/A/Z SVG path command
- **Overlays:** `_renderHourTicks()`, `_renderMinuteDots()`, etc. (populate groups dynamically)
- **Normalization:** `_angleFromTop(x, y)`, `_polar(r, angle)` for coordinate transforms

### Private vs Public

- **Public props:** `hour`, `minute`, `value`, `size`, `disabled`, `readonly`, `hourDisplay`, `minuteDisplay`, `minuteStep`
- **Internal:** Prefixed `_` (e.g., `_value`, `_updateSectors()`, `_onPointerDown()`)
- **Constants:** Uppercase (e.g., `INNER_RADIUS`, `OUTER_RADIUS`)

---

## Distribution & CI/CD

### GitHub Pages Demo

- **Hosted at:** `docs/index.html` (GitHub Pages, `/docs` folder, main branch)
- **CDN:** Uses jsDelivr (e.g., `https://cdn.jsdelivr.net/gh/winterer/time-dial@main/src/time-dial.js`)

### CI/CD Workflows

**Build workflow (`.github/workflows/build.yml`):**
- Triggers: Push to main, pull requests
- Node 20, `npm ci` → `npm run build`
- Verifies `dist/time-dial.js` and `dist/time-dial-themes.css` exist

**Release Assets workflow (`.github/workflows/release-assets.yml`):**
- Triggers: GitHub Release creation
- Validates tag version matches `package.json` (enforced: tag `vX.Y.Z` must match version `X.Y.Z`)
- Builds and uploads `dist/time-dial.js` and `dist/time-dial-themes.css` to release

---

## When Modifying...

- **Adding attributes:** Add to `observedAttributes`, handle in `attributeChangedCallback()`, create getter/setter
- **Changing colors/sizes:** Use CSS custom properties (no hardcoded values in shadow DOM)
- **Adding overlays:** Create `_render*()` method, toggle visibility in `_updateOverlays()`
- **Changing build output:** Update `vite.config.js` `fileName`, `package.json` exports, `.github/workflows/build.yml` verification
- **Part names:** Match CSS part names to semantic function, not position (e.g., `minute-disc`, not `outer-disc`)
