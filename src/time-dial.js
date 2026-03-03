class TimeDial extends HTMLElement {
    static get observedAttributes() {
        return ['hour', 'minute', 'value', 'size', 'minute-step', 'disabled', 'readonly', 'hour-display', 'minute-display', 'aria-label', 'aria-labelledby', 'tabindex'];
    }

    constructor() {
        super();

        // Constants
        this.INNER_RADIUS = 30;
        this.OUTER_RADIUS = 50;

        // Internal state
        this._value = { hour: 0, minute: 0 };
        this._size = 240;
        this._minuteStep = 1;
        this._disabled = false;
        this._readonly = false;
        this._hourDisplay = 'ticks';
        this._minuteDisplay = 'dots';
        this._pointerCaptured = false;

        // Attach shadow DOM
        const template = document.createElement('template');
        template.innerHTML = `
        <style>
            :host {
                display: inline-block;
                width: var(--td-size, 240px);
                height: var(--td-size, 240px);
                overflow: visible;
            }

            svg {
                width: 100%;
                height: 100%;
                display: block;
                overflow: visible;
            }

            .minute-disc {
                fill: var(--td-minute-disc-fill, white);
                filter: var(--td-minute-disc-shadow, drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3)));
                outline: none;
            }

            .hour-disc {
                fill: var(--td-hour-disc-fill, white);
                filter: var(--td-hour-disc-shadow, drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3)));
                outline: none;
            }

            .minute-sector {
                fill: var(--td-minute-sector-fill, rgba(128, 255, 128, 0.5));
                pointer-events: none;
            }

            .hour-sector {
                fill: var(--td-hour-sector-fill, rgba(0, 255, 0, 0.5));
                pointer-events: none;
            }

            .hour-tick,
            .minute-tick {
                stroke: var(--td-tick-color, #8a8a8a);
                stroke-width: var(--td-tick-width, 1);
            }

            .hour-dot,
            .minute-dot {
                fill: var(--td-dot-color, #8a8a8a);
            }

            .hour-label,
            .minute-label {
                fill: var(--td-label-color, currentColor);
                font-size: var(--td-label-font-size, 10px);
                font-family: var(--td-label-font-family, inherit);
                font-weight: var(--td-label-font-weight, inherit);
                pointer-events: none;
            }

            .minute-disc:focus-visible {
                outline: none;
                stroke: var(--td-focus-color, #000000);
                stroke-width: var(--td-focus-width, 1);
            }

            .hour-disc:focus-visible {
                outline: none;
                stroke: var(--td-focus-color, #000000);
                stroke-width: var(--td-focus-width, 1);
            }

            :host([disabled]) {
                opacity: var(--td-disabled-opacity, 0.6);
            }

            :host([disabled]) .minute-disc,
            :host([disabled]) .hour-disc {
                pointer-events: none;
            }
        </style>

        <svg id="timeDial" viewBox="-56 -56 112 112" xmlns="http://www.w3.org/2000/svg" part="svg">
            <circle id="minuteDisc" class="minute-disc" r="${this.OUTER_RADIUS}" part="outer-disc" tabindex="2" role="slider" aria-label="Minutes" aria-valuemin="0" aria-valuemax="59"></circle>
            <path id="minuteSector" class="minute-sector" part="minute-sector" pointer-events="none"></path>

            <circle id="hourDisc" class="hour-disc" r="${this.INNER_RADIUS}" part="inner-disc" tabindex="1" role="slider" aria-label="Hours" aria-valuemin="0" aria-valuemax="11"></circle>
            <path id="hourSector" class="hour-sector" part="hour-sector" pointer-events="none"></path>

            <g id="ticksLayer" part="ticks" pointer-events="none">
                <g id="hourTicks"></g>
                <g id="minuteTicks"></g>
            </g>

            <g id="labelsLayer" part="labels" pointer-events="none">
                <g id="hourLabels"></g>
                <g id="minuteLabels"></g>
            </g>
        </svg>
        `;

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Cache SVG elements
        this._svg = this.shadowRoot.getElementById('timeDial');
        this._hourSector = this.shadowRoot.getElementById('hourSector');
        this._minuteSector = this.shadowRoot.getElementById('minuteSector');
        this._hourDisc = this.shadowRoot.getElementById('hourDisc');
        this._minuteDisc = this.shadowRoot.getElementById('minuteDisc');
        this._ticksLayer = this.shadowRoot.getElementById('ticksLayer');
        this._labelsLayer = this.shadowRoot.getElementById('labelsLayer');
        this._hourTicks = this.shadowRoot.getElementById('hourTicks');
        this._minuteTicks = this.shadowRoot.getElementById('minuteTicks');
        this._hourLabels = this.shadowRoot.getElementById('hourLabels');
        this._minuteLabels = this.shadowRoot.getElementById('minuteLabels');

        // Bind event handlers
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);
        this._onHourKeyDown = (e) => this._onKeyDown('hour', e);
        this._onMinuteKeyDown = (e) => this._onKeyDown('minute', e);
    }

    connectedCallback() {
        // Set initial size
        this.shadowRoot.host.style.setProperty('--td-size', `${this._size}px`);

        // Set ARIA role
        this.setAttribute('role', 'group');
        this.setAttribute('aria-label', this.getAttribute('aria-label') || 'Time dial');

        // Update aria-valuenow for sectors
        this._updateAriaValues();

        // Attach event listeners
        this._svg.addEventListener('pointerdown', this._onPointerDown);
        this._svg.addEventListener('pointermove', this._onPointerMove);
        this._svg.addEventListener('pointerup', this._onPointerUp);
        this._svg.addEventListener('pointercancel', this._onPointerCancel);

        // Add keyboard listeners to discs
        this._hourDisc.addEventListener('keydown', this._onHourKeyDown);
        this._minuteDisc.addEventListener('keydown', this._onMinuteKeyDown);

        // Render initial state
        this._updateSectors();
        this._updateOverlays();
    }

    disconnectedCallback() {
        // Clean up event listeners
        this._svg.removeEventListener('pointerdown', this._onPointerDown);
        this._svg.removeEventListener('pointermove', this._onPointerMove);
        this._svg.removeEventListener('pointerup', this._onPointerUp);
        this._svg.removeEventListener('pointercancel', this._onPointerCancel);

        // Remove keyboard listeners from discs
        this._hourDisc.removeEventListener('keydown', this._onHourKeyDown);
        this._minuteDisc.removeEventListener('keydown', this._onMinuteKeyDown);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'hour':
                if (newValue !== null) {
                    const hour = parseInt(newValue, 10);
                    if (!isNaN(hour) && hour >= 0 && hour < 12) {
                        this._value.hour = hour;
                        this._updateSectors();
                    }
                }
                break;
            case 'minute':
                if (newValue !== null) {
                    const minute = parseInt(newValue, 10);
                    if (!isNaN(minute) && minute >= 0 && minute < 60) {
                        this._value.minute = this._normalizeMinuteToStep(minute);
                        this._updateSectors();
                    }
                }
                break;
            case 'value':
                if (newValue !== null) {
                    this._parseAndSetValue(newValue);
                }
                break;
            case 'size':
                if (newValue !== null) {
                    const size = parseInt(newValue, 10);
                    if (!isNaN(size) && size > 0) {
                        this._size = size;
                        if (this.isConnected) {
                            this.shadowRoot.host.style.setProperty('--td-size', `${size}px`);
                            this._updateOverlays();
                        }
                    }
                }
                break;
            case 'minute-step': {
                const minuteStep = this._parseMinuteStep(newValue);
                this._minuteStep = minuteStep;
                this._value.minute = this._normalizeMinuteToStep(this._value.minute);
                this._updateSectors();
                this._reflectAttributes();
                this._updateOverlays();
                break;
            }
            case 'disabled':
                this._disabled = newValue !== null;
                break;
            case 'readonly':
                this._readonly = newValue !== null;
                break;
            case 'hour-display': {
                this._hourDisplay = this._normalizeDisplayMode(newValue);
                this._updateOverlays();
                break;
            }
            case 'minute-display': {
                this._minuteDisplay = this._normalizeDisplayMode(newValue);
                this._updateOverlays();
                break;
            }
            case 'aria-label':
                // Handled automatically by the browser
                break;
            case 'aria-labelledby':
                // Handled automatically by the browser
                break;
            case 'tabindex':
                // Handled automatically by the browser
                break;
        }
    }

    // ========== Helper Functions ==========

    _svgPoint(event) {
        const pt = this._svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        return pt.matrixTransform(this._svg.getScreenCTM().inverse());
    }

    _angleFromTop(x, y) {
        let a = Math.atan2(y, x) + Math.PI / 2;
        if (a < 0) a += Math.PI * 2;
        return a;
    }

    _polar(r, angle) {
        return {
            x: Math.sin(angle) * r,
            y: -Math.cos(angle) * r
        };
    }

    _normalizeDisplayMode(value) {
        if (value === null) return 'none';
        const normalized = String(value).trim().toLowerCase();
        if (normalized === 'ticks' || normalized === 'dots' || normalized === 'labels' || normalized === 'none') {
            return normalized;
        }
        return 'none';
    }

    _parseMinuteStep(value) {
        const parsed = parseInt(value, 10);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            return 1;
        }
        if (60 % parsed !== 0) {
            return 1;
        }
        return parsed;
    }

    _normalizeMinuteToStep(minute) {
        const normalizedMinute = ((minute % 60) + 60) % 60;
        return Math.round(normalizedMinute / this._minuteStep) * this._minuteStep % 60;
    }

    _createSvgNode(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }

    _clearChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    _buildTick(innerRadius, outerRadius, angle, strokeWidth, className) {
        const tick = this._createSvgNode('line');
        const start = this._polar(innerRadius, angle);
        const end = this._polar(outerRadius, angle);
        tick.setAttribute('x1', String(start.x));
        tick.setAttribute('y1', String(start.y));
        tick.setAttribute('x2', String(end.x));
        tick.setAttribute('y2', String(end.y));
        tick.setAttribute('stroke-width', String(strokeWidth));
        tick.setAttribute('class', className);
        return tick;
    }

    _buildDot(radius, angle, dotRadius, className) {
        const dot = this._createSvgNode('circle');
        const pos = this._polar(radius, angle);
        dot.setAttribute('cx', String(pos.x));
        dot.setAttribute('cy', String(pos.y));
        dot.setAttribute('r', String(dotRadius));
        dot.setAttribute('class', className);
        return dot;
    }

    _buildLabel(radius, angle, text, className) {
        const label = this._createSvgNode('text');
        const pos = this._polar(radius, angle);
        label.setAttribute('x', String(pos.x));
        label.setAttribute('y', String(pos.y));
        label.setAttribute('class', className);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('font-size', '5');
        label.textContent = String(text);
        return label;
    }

    _renderHourTicks() {
        this._clearChildren(this._hourTicks);
        for (let hour = 0; hour < 12; hour += 1) {
            const angle = (hour / 12) * Math.PI * 2;
            this._hourTicks.appendChild(this._buildTick(this.INNER_RADIUS - 5, this.INNER_RADIUS, angle, 1, 'hour-tick'));
        }
    }

    _renderMinuteTicks() {
        this._clearChildren(this._minuteTicks);
        const tickCount = 60 / this._minuteStep;
        for (let index = 0; index < tickCount; index += 1) {
            const minuteValue = index * this._minuteStep;
            const angle = (minuteValue / 60) * Math.PI * 2;
            this._minuteTicks.appendChild(this._buildTick(this.OUTER_RADIUS - 5, this.OUTER_RADIUS, angle, 0.8, 'minute-tick'));
        }
    }

    _renderHourDots() {
        this._clearChildren(this._hourTicks);
        for (let hour = 0; hour < 12; hour += 1) {
            const angle = (hour / 12) * Math.PI * 2;
            this._hourTicks.appendChild(this._buildDot(this.INNER_RADIUS - 4, angle, 1.2, 'hour-dot'));
        }
    }

    _renderMinuteDots() {
        this._clearChildren(this._minuteTicks);
        const tickCount = 60 / this._minuteStep;
        for (let index = 0; index < tickCount; index += 1) {
            const minuteValue = index * this._minuteStep;
            const angle = (minuteValue / 60) * Math.PI * 2;
            this._minuteTicks.appendChild(this._buildDot(this.OUTER_RADIUS - 3, angle, 0.7, 'minute-dot'));
        }
    }

    _renderHourLabels() {
        this._clearChildren(this._hourLabels);
        for (let hour = 0; hour < 12; hour += 1) {
            const angle = (hour / 12) * Math.PI * 2;
            this._hourLabels.appendChild(this._buildLabel(this.INNER_RADIUS - 5, angle, hour === 0 ? 12 : hour, 'hour-label'));
        }
    }

    _renderMinuteLabels() {
        this._clearChildren(this._minuteLabels);
        for (let minute = 0; minute < 60; minute += 5) {
            const angle = (minute / 60) * Math.PI * 2;
            this._minuteLabels.appendChild(this._buildLabel(this.OUTER_RADIUS - 5, angle, minute, 'minute-label'));
        }
    }

    _updateOverlays() {
        if (!this.isConnected) {
            return;
        }

        this._clearChildren(this._hourTicks);
        this._clearChildren(this._minuteTicks);
        this._clearChildren(this._hourLabels);
        this._clearChildren(this._minuteLabels);

        if (this._hourDisplay === 'ticks') {
            this._renderHourTicks();
        }
        if (this._hourDisplay === 'dots') {
            this._renderHourDots();
        }
        if (this._hourDisplay === 'labels') {
            this._renderHourLabels();
        }

        if (this._minuteDisplay === 'ticks') {
            this._renderMinuteTicks();
        }
        if (this._minuteDisplay === 'dots') {
            this._renderMinuteDots();
        }
        if (this._minuteDisplay === 'labels') {
            this._renderMinuteLabels();
        }

        this._ticksLayer.setAttribute('visibility', (this._hourDisplay === 'ticks' || this._hourDisplay === 'dots' || this._minuteDisplay === 'ticks' || this._minuteDisplay === 'dots') ? 'visible' : 'hidden');
        this._labelsLayer.setAttribute('visibility', (this._hourDisplay === 'labels' || this._minuteDisplay === 'labels') ? 'visible' : 'hidden');
    }

    _sectorPath(radius, angle) {
        if (angle <= 0.0001) return '';

        const start = { x: 0, y: -radius };
        const end = this._polar(radius, angle);
        const largeArc = angle > Math.PI ? 1 : 0;

        return `
      M 0 0
      L ${start.x} ${start.y}
      A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}
      Z
    `;
    }

    _updateSectors() {
        const hourIndex = this._value.hour % 12;
        const hourAngle = (hourIndex / 12) * Math.PI * 2;
        const minuteAngle = (this._value.minute / 60) * Math.PI * 2;

        this._hourSector.setAttribute('d', this._sectorPath(this.INNER_RADIUS, hourAngle));
        this._minuteSector.setAttribute('d', this._sectorPath(this.OUTER_RADIUS, minuteAngle));

        // Update ARIA values
        this._updateAriaValues();
    }

    _updateAriaValues() {
        this._hourSector.setAttribute('aria-valuenow', String(this._value.hour));
        this._hourSector.setAttribute('aria-valuetext', `${this._value.hour} hours`);
        this._minuteSector.setAttribute('aria-valuenow', String(this._value.minute));
        this._minuteSector.setAttribute('aria-valuetext', `${this._value.minute} minutes`);
    }

    _parseAndSetValue(valueStr) {
        // Parse "HH:MM" format
        const parts = valueStr.split(':');
        if (parts.length === 2) {
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour < 12 && minute >= 0 && minute < 60) {
                this._value.hour = hour;
                this._value.minute = this._normalizeMinuteToStep(minute);
                this._updateSectors();
                this._reflectAttributes();
            }
        }
    }

    _reflectAttributes() {
        this.setAttribute('hour', String(this._value.hour));
        this.setAttribute('minute', String(this._value.minute));
    }

    _dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true,
            cancelable: false
        });
        this.dispatchEvent(event);
    }

    // ========== Event Handlers ==========

    _onPointerDown(event) {
        if (this._disabled || this._readonly) return;

        const p = this._svgPoint(event);
        const r = Math.hypot(p.x, p.y);
        const angle = this._angleFromTop(p.x, p.y);

        if (r <= this.INNER_RADIUS) {
            this._value.hour = Math.round((angle / (Math.PI * 2)) * 12) % 12;
        } else if (r <= this.OUTER_RADIUS) {
            this._value.minute = this._normalizeMinuteToStep(Math.round((angle / (Math.PI * 2)) * 60) % 60);
        } else {
            return; // Outside dial
        }

        this._pointerCaptured = true;
        this._svg.setPointerCapture(event.pointerId);
        this._updateSectors();
        this._reflectAttributes();
        this._dispatchEvent('input', { hour: this._value.hour, minute: this._value.minute });
    }

    _onPointerMove(event) {
        if (!this._pointerCaptured || this._disabled || this._readonly) return;

        const p = this._svgPoint(event);
        const r = Math.hypot(p.x, p.y);
        const angle = this._angleFromTop(p.x, p.y);

        if (r <= this.INNER_RADIUS) {
            this._value.hour = Math.round((angle / (Math.PI * 2)) * 12) % 12;
        } else if (r <= this.OUTER_RADIUS) {
            this._value.minute = this._normalizeMinuteToStep(Math.round((angle / (Math.PI * 2)) * 60) % 60);
        }

        this._updateSectors();
        this._reflectAttributes();
        this._dispatchEvent('input', { hour: this._value.hour, minute: this._value.minute });
    }

    _onPointerUp(event) {
        if (!this._pointerCaptured) return;

        try {
            this._svg.releasePointerCapture(event.pointerId);
        } catch (e) {
            // If pointer was not captured on this element, ignore
        }

        this._pointerCaptured = false;
        this._dispatchEvent('change', { hour: this._value.hour, minute: this._value.minute });
    }

    _onPointerCancel(event) {
        if (!this._pointerCaptured) return;

        try {
            this._svg.releasePointerCapture(event.pointerId);
        } catch (e) {
            // If pointer was not captured on this element, ignore
        }

        this._pointerCaptured = false;
    }

    _onKeyDown(field, event) {
        if (this._disabled || this._readonly) return;

        let handled = false;
        let valueChanged = false;

        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowRight':
                if (field === 'hour') {
                    this._value.hour = (this._value.hour + 1) % 12;
                } else {
                    this._value.minute = (this._value.minute + this._minuteStep) % 60;
                }
                handled = true;
                valueChanged = true;
                break;

            case 'ArrowDown':
            case 'ArrowLeft':
                if (field === 'hour') {
                    this._value.hour = (this._value.hour - 1 + 12) % 12;
                } else {
                    this._value.minute = (this._value.minute - this._minuteStep + 60) % 60;
                }
                handled = true;
                valueChanged = true;
                break;

            case 'h':
            case 'H':
                // Switch to hour mode and focus
                this._hourDisc.focus();
                handled = true;
                break;

            case 'm':
            case 'M':
                // Switch to minute mode and focus
                this._minuteDisc.focus();
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();

            if (valueChanged) {
                this._updateSectors();
                this._reflectAttributes();

                // Dispatch input event for continuous feedback
                this._dispatchEvent('input', { hour: this._value.hour, minute: this._value.minute });

                // Also dispatch change event for keyboard interactions (discrete changes)
                this._dispatchEvent('change', { hour: this._value.hour, minute: this._value.minute });
            }
        }
    }

    // ========== Properties ==========

    get hour() {
        return this._value.hour;
    }

    set hour(value) {
        const hour = parseInt(value, 10);
        if (!isNaN(hour) && hour >= 0 && hour < 12) {
            this._value.hour = hour;
            this.setAttribute('hour', String(hour));
            this._updateSectors();
        }
    }

    get minute() {
        return this._value.minute;
    }

    set minute(value) {
        const minute = parseInt(value, 10);
        if (!isNaN(minute) && minute >= 0 && minute < 60) {
            this._value.minute = this._normalizeMinuteToStep(minute);
            this.setAttribute('minute', String(this._value.minute));
            this._updateSectors();
        }
    }

    get value() {
        const h = String(this._value.hour).padStart(2, '0');
        const m = String(this._value.minute).padStart(2, '0');
        return `${h}:${m}`;
    }

    set value(timeString) {
        this._parseAndSetValue(timeString);
    }

    get disabled() {
        return this._disabled;
    }

    set disabled(value) {
        this._disabled = Boolean(value);
        if (this._disabled) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }

    get readonly() {
        return this._readonly;
    }

    set readonly(value) {
        this._readonly = Boolean(value);
        if (this._readonly) {
            this.setAttribute('readonly', '');
        } else {
            this.removeAttribute('readonly');
        }
    }

    get minuteStep() {
        return this._minuteStep;
    }

    set minuteStep(value) {
        const normalizedStep = this._parseMinuteStep(value);
        this._minuteStep = normalizedStep;
        this._value.minute = this._normalizeMinuteToStep(this._value.minute);
        this.setAttribute('minute-step', String(normalizedStep));
        this._updateSectors();
        this._updateOverlays();
    }

    get hourDisplay() {
        return this._hourDisplay;
    }

    set hourDisplay(value) {
        const normalized = this._normalizeDisplayMode(value);
        this._hourDisplay = normalized;
        this.setAttribute('hour-display', normalized);
        this._updateOverlays();
    }

    get minuteDisplay() {
        return this._minuteDisplay;
    }

    set minuteDisplay(value) {
        const normalized = this._normalizeDisplayMode(value);
        this._minuteDisplay = normalized;
        this.setAttribute('minute-display', normalized);
        this._updateOverlays();
    }

    get size() {
        return this._size;
    }

    set size(value) {
        const size = parseInt(value, 10);
        if (!isNaN(size) && size > 0) {
            this._size = size;
            this.setAttribute('size', String(size));
            if (this.isConnected) {
                this.shadowRoot.host.style.setProperty('--td-size', `${size}px`);
            }
        }
    }
}

// Register the custom element
customElements.define('time-dial', TimeDial);
