# `<time-dial>` Web Component

A framework-agnostic time selection widget implemented as a Web Component. The widget displays a circular dial with two concentric discs for intuitive hour and minute selection.

## Features

- **Two concentric selection zones**
  - Inner disc selects hours (0–11, 12-hour format)
  - Outer ring selects minutes (0–59)
- **Pointer interaction** using Pointer Events API
  - Click to set time
  - Drag for continuous adjustment
- **Keyboard navigation**
  - Tab to move between hour and minute discs
  - Arrow keys (↑/↓/←/→) to adjust values
  - H/M keys to jump to hour/minute disc
- **Visual feedback** with filled circle sectors ("pizza slices")
- **Configurable overlays** for hour/minute tick marks, dots, or labels
- **Accessibility**
  - ARIA roles and labels
  - Focus indicators for keyboard navigation
  - Screen reader support
- **Encapsulated styling** with Shadow DOM
- **Framework-agnostic** - works in plain HTML and any framework

## Installation

### Direct Usage

```html
<script src="src/time-dial.js"></script>

<time-dial></time-dial>
```

### ES Module

```javascript
import './src/time-dial.js';
```

## Usage

### Basic Example

```html
<time-dial id="myDial"></time-dial>

<script>
  const dial = document.getElementById('myDial');
  
  // Listen for changes
  dial.addEventListener('change', (e) => {
    console.log('Time selected:', e.detail);
    // { hour: 3, minute: 45 }
  });
  
  // Set initial time
  dial.hour = 9;
  dial.minute = 30;
  // or
  dial.value = '09:30';
</script>
```

### With Attributes

```html
<time-dial 
  hour="3" 
  minute="45" 
  size="300"
  aria-label="Select appointment time">
</time-dial>
```

### Disabled State

```html
<time-dial disabled></time-dial>
```

## API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `hour` | number | `0` | Hour value (0–11) |
| `minute` | number | `0` | Minute value (0–59) |
| `value` | string | `"00:00"` | Time in `HH:MM` format |
| `size` | number | `240` | Widget size in pixels (width and height) |
| `minute-step` | number | `1` | Minute snapping step (must be a positive divisor of 60) |
| `disabled` | boolean | `false` | Disables all interaction |
| `readonly` | boolean | `false` | Prevents user interaction but keeps focusability |
| `hour-display` | `"none" \| "ticks" \| "dots" \| "labels"` | `"ticks"` | Controls hour overlays |
| `minute-display` | `"none" \| "ticks" \| "dots" \| "labels"` | `"dots"` | Controls minute overlays |
| `aria-label` | string | `"Time dial"` | Accessible label |
| `aria-labelledby` | string | - | ID of labeling element |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `hour` | number | Get/set hour (0–11) |
| `minute` | number | Get/set minute (0–59) |
| `value` | string | Get/set time as `HH:MM` string |
| `size` | number | Get/set widget size in pixels |
| `minuteStep` | number | Get/set minute snapping step (invalid values fall back to `1`) |
| `disabled` | boolean | Get/set disabled state |
| `readonly` | boolean | Get/set readonly state |
| `hourDisplay` | `"none" \| "ticks" \| "dots" \| "labels"` | Get/set hour overlays |
| `minuteDisplay` | `"none" \| "ticks" \| "dots" \| "labels"` | Get/set minute overlays |

### Events

#### `input`

Fired continuously while dragging or using arrow keys.

```javascript
dial.addEventListener('input', (e) => {
  console.log('Current value:', e.detail);
  // { hour: 3, minute: 45 }
});
```

#### `change`

Fired when interaction completes (pointer up) and after keyboard-based value adjustments.

```javascript
dial.addEventListener('change', (e) => {
  console.log('Final value:', e.detail);
  // { hour: 3, minute: 45 }
});
```

**Event properties:**
- `event.detail`: `{ hour: number, minute: number }`
- `bubbles`: `true`
- `composed`: `true` (crosses shadow DOM boundary)

### CSS Parts

The component exposes the following parts for custom styling:

```css
time-dial::part(outer-disc) {
  /* Minute disc styles */
}

time-dial::part(inner-disc) {
  /* Hour disc styles */
}

time-dial::part(hour-sector) {
  /* Hour sector (filled area) */
}

time-dial::part(minute-sector) {
  /* Minute sector (filled area) */
}

time-dial::part(ticks) {
  /* Tick mark and dot overlays */
}

time-dial::part(labels) {
  /* Numeric label overlays */
}

time-dial::part(svg) {
  /* Root SVG element */
}
```

### CSS Custom Properties

The component also supports theming via CSS custom properties:

```css
time-dial {
  --td-size: 240px;

  --td-minute-disc-fill: white;
  --td-hour-disc-fill: white;
  --td-minute-disc-shadow: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  --td-hour-disc-shadow: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));

  --td-minute-sector-fill: rgba(128, 255, 128, 0.5);
  --td-hour-sector-fill: rgba(0, 255, 0, 0.5);

  --td-tick-color: #8a8a8a;
  --td-tick-width: 1;
  --td-dot-color: #8a8a8a;

  --td-label-color: currentColor;
  --td-label-font-size: 10px;
  --td-label-font-family: inherit;
  --td-label-font-weight: inherit;

  --td-focus-color: #000000;
  --td-focus-width: 1;
  --td-disabled-opacity: 0.6;
}
```

### Value Precedence

When multiple inputs are provided, values are resolved in this order:

1. Programmatic `value` property assignment
2. `value` attribute (`HH:MM`)
3. `hour` and `minute` attributes/properties
4. Default `00:00`

## Keyboard Navigation

### Focus Management

- **Tab** / **Shift+Tab**: Navigate between hour and minute discs
- **H**: Focus hour disc
- **M**: Focus minute disc

### Value Adjustment

When a disc is focused:

- **Arrow Up (↑)** / **Arrow Right (→)**: Increment value
  - Hour: +1 (wraps from 11 to 0)
  - Minute: +`minute-step` (wraps from 59 to 0)
- **Arrow Down (↓)** / **Arrow Left (←)**: Decrement value
  - Hour: -1 (wraps from 0 to 11)
  - Minute: -`minute-step` (wraps from 0 to 59)

### Focus Indicators

Focus rings are displayed only for keyboard navigation (using `:focus-visible`), not for mouse clicks.

## Time Value Model

- **Hour**: 0–11 (0-indexed, 12-hour format)
  - `0` = 12 AM
  - `1` = 1 AM
  - `11` = 11 AM
- **Minute**: 0–59
- **Default**: `00:00` (midnight)

## Accessibility

The component implements ARIA best practices:

- Host element has `role="group"`
- Each disc has `role="slider"` with appropriate ARIA attributes:
  - `aria-label`: "Hours" or "Minutes"
  - `aria-valuemin`, `aria-valuemax`: Value range
  - `aria-valuenow`: Current value
  - `aria-valuetext`: Human-readable value (e.g., "3 o'clock")
- Keyboard navigation support
- Focus indicators for keyboard users
- Custom `aria-label` and `aria-labelledby` support

## Browser Support

Works in all modern browsers supporting:

- Custom Elements (Web Components)
- Shadow DOM
- Pointer Events
- ES2019+ JavaScript

**Tested in:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Development

### Running the Demo

Open [examples/time-dial-demo.html](examples/time-dial-demo.html) in your browser.

### Architecture

- **Shadow DOM**: Encapsulated styles and markup
- **SVG Rendering**: Scalable vector graphics for crisp display at any size
- **Pointer Events API**: Unified mouse/touch/pen handling
- **No Dependencies**: Pure vanilla JavaScript

### Constants

Internal geometry (in SVG viewBox units):
- `INNER_RADIUS`: 30 (hour disc)
- `OUTER_RADIUS`: 50 (minute disc)
- ViewBox: `-56 -56 112 112`

## Implementation Notes

### Angle Calculation

- Origin: 12 o'clock (north, top of dial)
- Direction: Clockwise
- Range: 0–360 degrees

### Sector Rendering

Both hour and minute selections are visualized as filled sectors ("pizza slices") extending clockwise from 12 o'clock.

### Pointer Capture

During drag operations, the component uses `setPointerCapture()` to ensure smooth tracking even if the pointer moves outside the dial.

### Event Timing

- **`input`**: Dispatched during pointer move and keyboard adjustment
- **`change`**: Dispatched on pointer up and after keyboard adjustment

## Limitations (Current Version)

- No 24-hour mode (only 0–11 hour range)

## License

[Specify your license here]

## Contributing

[Specify contribution guidelines here]
