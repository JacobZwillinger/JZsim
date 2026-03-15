/**
 * NATO MIL-STD-2525 / APP-6 style symbol generator.
 * Creates inline SVG elements with proper affiliation frames and icon inserts.
 *
 * Frame shapes by affiliation:
 *   Friendly (BLUE) — Rectangle with rounded top
 *   Hostile  (RED)  — Diamond
 *   Neutral  (GREEN) — Square
 *   Unknown  (YELLOW) — Quatrefoil (simplified to circle)
 *
 * Icons inside the frame indicate entity type:
 *   Fighter  — Wing silhouette
 *   Bomber   — Wing + bomb
 *   Tanker   — Circle (fuel)
 *   AWACS    — Radar dish
 *   SAM      — Upward arrow
 *   Airbase  — Star
 *   Radar    — Antenna
 *   Missile  — Arrow
 */

import { Side, ModelType } from '@jzsim/core';

const NS = 'http://www.w3.org/2000/svg';

interface SymbolColors {
  fill: string;
  stroke: string;
  icon: string;
}

function getColors(side: number): SymbolColors {
  switch (side) {
    case Side.BLUE: return { fill: 'rgba(68,153,255,0.25)', stroke: '#4499ff', icon: '#4499ff' };
    case Side.RED: return { fill: 'rgba(255,68,68,0.25)', stroke: '#ff4444', icon: '#ff4444' };
    case Side.NEUTRAL: return { fill: 'rgba(68,255,68,0.18)', stroke: '#44cc44', icon: '#44cc44' };
    default: return { fill: 'rgba(255,255,68,0.18)', stroke: '#cccc44', icon: '#cccc44' };
  }
}

function createSvgElement(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

/** Draw the frame based on affiliation */
function drawFrame(svg: SVGSVGElement, side: number, colors: SymbolColors, size: number): void {
  const s = size;
  const half = s / 2;

  if (side === Side.BLUE) {
    // Friendly: rounded rectangle
    const rect = createSvgElement('rect', {
      x: '2', y: '2',
      width: String(s - 4), height: String(s - 4),
      rx: '3', ry: '3',
      fill: colors.fill,
      stroke: colors.stroke,
      'stroke-width': '1.5',
    });
    svg.appendChild(rect);
  } else if (side === Side.RED) {
    // Hostile: diamond
    const points = `${half},1 ${s - 1},${half} ${half},${s - 1} 1,${half}`;
    const diamond = createSvgElement('polygon', {
      points,
      fill: colors.fill,
      stroke: colors.stroke,
      'stroke-width': '1.5',
    });
    svg.appendChild(diamond);
  } else if (side === Side.NEUTRAL) {
    // Neutral: square
    const rect = createSvgElement('rect', {
      x: '2', y: '2',
      width: String(s - 4), height: String(s - 4),
      fill: colors.fill,
      stroke: colors.stroke,
      'stroke-width': '1.5',
    });
    svg.appendChild(rect);
  } else {
    // Unknown: circle
    const circle = createSvgElement('circle', {
      cx: String(half), cy: String(half),
      r: String(half - 2),
      fill: colors.fill,
      stroke: colors.stroke,
      'stroke-width': '1.5',
    });
    svg.appendChild(circle);
  }
}

/** Draw the icon inside the frame */
function drawIcon(svg: SVGSVGElement, modelType: number, colors: SymbolColors, size: number): void {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.3; // icon scale factor

  switch (modelType) {
    case ModelType.FIGHTER: {
      // Fighter: swept wing silhouette (upward-pointing)
      const path = createSvgElement('path', {
        d: `M${cx},${cy - s} L${cx + s},${cy + s * 0.6} L${cx},${cy + s * 0.2} L${cx - s},${cy + s * 0.6} Z`,
        fill: colors.icon,
        'fill-opacity': '0.9',
      });
      svg.appendChild(path);
      break;
    }
    case ModelType.BOMBER: {
      // Bomber: wider wing shape
      const path = createSvgElement('path', {
        d: `M${cx},${cy - s * 0.8} L${cx + s * 1.2},${cy + s * 0.4} L${cx + s * 0.5},${cy + s * 0.6} L${cx},${cy + s * 0.3} L${cx - s * 0.5},${cy + s * 0.6} L${cx - s * 1.2},${cy + s * 0.4} Z`,
        fill: colors.icon,
        'fill-opacity': '0.9',
      });
      svg.appendChild(path);
      break;
    }
    case ModelType.TANKER: {
      // Tanker: circle with horizontal line (fuel boom)
      const c = createSvgElement('circle', {
        cx: String(cx), cy: String(cy),
        r: String(s * 0.6),
        fill: 'none',
        stroke: colors.icon,
        'stroke-width': '1.5',
      });
      svg.appendChild(c);
      const line = createSvgElement('line', {
        x1: String(cx - s), y1: String(cy),
        x2: String(cx + s), y2: String(cy),
        stroke: colors.icon,
        'stroke-width': '1.5',
      });
      svg.appendChild(line);
      break;
    }
    case ModelType.TRANSPORT: {
      // Transport: circle
      const c = createSvgElement('circle', {
        cx: String(cx), cy: String(cy),
        r: String(s * 0.6),
        fill: colors.icon,
        'fill-opacity': '0.6',
      });
      svg.appendChild(c);
      break;
    }
    case ModelType.AWACS: {
      // AWACS: semicircle (radar dome) on top of line
      const arc = createSvgElement('path', {
        d: `M${cx - s},${cy} A${s},${s} 0 0,1 ${cx + s},${cy}`,
        fill: 'none',
        stroke: colors.icon,
        'stroke-width': '1.5',
      });
      svg.appendChild(arc);
      const line = createSvgElement('line', {
        x1: String(cx - s), y1: String(cy),
        x2: String(cx + s), y2: String(cy),
        stroke: colors.icon,
        'stroke-width': '1.5',
      });
      svg.appendChild(line);
      break;
    }
    case ModelType.AIRBASE: {
      // Airbase: 5-pointed star
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180;
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        points.push(`${cx + s * Math.cos(outerAngle)},${cy + s * Math.sin(outerAngle)}`);
        points.push(`${cx + s * 0.4 * Math.cos(innerAngle)},${cy + s * 0.4 * Math.sin(innerAngle)}`);
      }
      const star = createSvgElement('polygon', {
        points: points.join(' '),
        fill: colors.icon,
        'fill-opacity': '0.9',
      });
      svg.appendChild(star);
      break;
    }
    case ModelType.RADAR_SITE: {
      // Radar: antenna dish (arc + base)
      const arc = createSvgElement('path', {
        d: `M${cx - s * 0.7},${cy - s * 0.3} Q${cx},${cy - s * 1.2} ${cx + s * 0.7},${cy - s * 0.3}`,
        fill: 'none',
        stroke: colors.icon,
        'stroke-width': '1.5',
      });
      svg.appendChild(arc);
      const base = createSvgElement('line', {
        x1: String(cx), y1: String(cy - s * 0.3),
        x2: String(cx), y2: String(cy + s * 0.7),
        stroke: colors.icon,
        'stroke-width': '1.5',
      });
      svg.appendChild(base);
      break;
    }
    case ModelType.SAM_SITE: {
      // SAM: upward arrow (launch)
      const path = createSvgElement('path', {
        d: `M${cx},${cy - s} L${cx + s * 0.5},${cy} L${cx + s * 0.2},${cy} L${cx + s * 0.2},${cy + s * 0.7} L${cx - s * 0.2},${cy + s * 0.7} L${cx - s * 0.2},${cy} L${cx - s * 0.5},${cy} Z`,
        fill: colors.icon,
        'fill-opacity': '0.9',
      });
      svg.appendChild(path);
      break;
    }
    case ModelType.MISSILE: {
      // Missile: small arrow
      const path = createSvgElement('path', {
        d: `M${cx},${cy - s * 0.8} L${cx + s * 0.3},${cy + s * 0.5} L${cx},${cy + s * 0.2} L${cx - s * 0.3},${cy + s * 0.5} Z`,
        fill: colors.icon,
        'fill-opacity': '0.9',
      });
      svg.appendChild(path);
      break;
    }
    default: {
      // Unknown: dot
      const c = createSvgElement('circle', {
        cx: String(cx), cy: String(cy),
        r: String(s * 0.4),
        fill: colors.icon,
        'fill-opacity': '0.8',
      });
      svg.appendChild(c);
    }
  }
}

/**
 * Create a NATO MIL-STD-2525 style SVG symbol element.
 * @param modelType Entity model type (Fighter, Bomber, SAM, etc.)
 * @param side Entity allegiance (BLUE, RED, NEUTRAL)
 * @param size SVG dimensions in pixels (default 24)
 * @returns SVG element ready to append to DOM
 */
export function createNatoSymbol(modelType: number, side: number, size = 24): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg') as SVGSVGElement;
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.style.display = 'block';
  svg.style.overflow = 'visible';

  const colors = getColors(side);
  drawFrame(svg, side, colors, size);
  drawIcon(svg, modelType, colors, size);

  return svg;
}
