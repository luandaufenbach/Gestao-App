import React from 'react';
import { useMeasure, niceTicks, formatValue, seriesColor, barPath, textWidth, tickStep, tickCount, bandIndex, ChartTooltip, SrTable, WrapLabel } from '../base/ChartCore.jsx';

export function ColumnChart({ data = [], xKey = 'label', series = [{ key: 'value', label: 'Valor' }], mode = 'grouped', height = 240, yFormat, xFormat, highlight, showValues = false, hidden = [], references = [], maxBarWidth = 36, radius = 6, tooltip = true, onSelect, ariaLabel, className, style }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = React.useState(null);
  const n = data.length;
  const vis = [];
  series.forEach(function (s, si) { if (hidden.indexOf(s.key) < 0) vis.push({ s: s, color: seriesColor(si, s.color) }); });
  const k = vis.length || 1;
  let lo = 0, hi = 0;
  data.forEach(function (d) {
    if (mode === 'stacked') {
      let p = 0, q = 0; vis.forEach(function (v) { const x = d[v.s.key] || 0; if (x >= 0) p += x; else q += x; });
      hi = Math.max(hi, p); lo = Math.min(lo, q);
    } else vis.forEach(function (v) { const x = d[v.s.key] || 0; hi = Math.max(hi, x); lo = Math.min(lo, x); });
  });
  references.forEach(function (r) { hi = Math.max(hi, r.value); });
  const ticks = niceTicks(lo, hi || 1, tickCount(height));
  const yMin = ticks[0], yMax = ticks[ticks.length - 1];
  const labelW = Math.max.apply(null, ticks.map(function (t) { return textWidth(formatValue(t, yFormat)); }));
  const m = { t: showValues ? 20 : 12, r: 8, b: 28, l: Math.ceil(labelW) + 12 };
  const iw = Math.max(10, width - m.l - m.r), ih = Math.max(10, height - m.t - m.b);
  const bw = iw / Math.max(1, n);
  const groupW = Math.min(bw * (k > 1 ? 0.78 : 0.62), maxBarWidth * (mode === 'stacked' ? 1 : k));
  const gap = mode === 'grouped' && k > 1 ? 3 : 0;
  const barW = mode === 'stacked' ? groupW : (groupW - gap * (k - 1)) / k;
  const Y = function (v) { return m.t + ih - ((v - yMin) / ((yMax - yMin) || 1)) * ih; };
  const y0 = Y(0);
  const step = tickStep(n, iw, 44);
  const isHl = function (d, i) { return typeof highlight === 'function' ? highlight(d, i) : highlight === i; };
  const lab = function (i) { const v = data[i][xKey]; return xFormat ? xFormat(v, i) : v; };

  const bars = [];
  data.forEach(function (d, i) {
    const gx = m.l + i * bw + (bw - groupW) / 2;
    let pos = 0, neg = 0;
    let topIdx = -1;
    if (mode === 'stacked') vis.forEach(function (v, j) { if ((d[v.s.key] || 0) > 0) topIdx = j; });
    vis.forEach(function (v, j) {
      const val = d[v.s.key];
      if (val == null || val === 0) return;
      let x, yA, yB, dir;
      if (mode === 'stacked') {
        x = gx;
        if (val > 0) { yA = Y(pos + val); yB = Y(pos); pos += val; dir = j === topIdx ? 'up' : 'none'; }
        else { yA = Y(neg); yB = Y(neg + val); neg += val; dir = 'down'; }
      } else {
        x = gx + j * (barW + gap);
        if (val > 0) { yA = Y(val); yB = y0; dir = 'up'; } else { yA = y0; yB = Y(val); dir = 'down'; }
      }
      const hl = isHl(d, i) && k === 1;
      bars.push({ key: i + '-' + j, i: i, d: barPath(x, yA, barW, Math.max(1, yB - yA), radius, dir), fill: hl ? 'var(--chart-highlight)' : (d.color && k === 1 ? d.color : v.color), neg: val < 0, cx: x + barW / 2, top: val > 0 ? yA : yB, val: val, single: mode !== 'stacked' });
    });
    if (showValues && (mode === 'stacked' || k === 1)) {
      const tot = mode === 'stacked' ? pos : (d[vis[0] && vis[0].s.key] || 0);
      bars.push({ key: 'v' + i, i: i, label: formatValue(tot, yFormat), cx: gx + groupW / 2, y: Y(tot) - 6 });
    }
  });

  let tip = null;
  if (tooltip && hover != null) {
    const d = data[hover];
    let tot = 0; vis.forEach(function (v) { tot += d[v.s.key] || 0; });
    tip = <ChartTooltip x={m.l + hover * bw + bw / 2} y={m.t + ih / 2} width={width} height={height} title={lab(hover)}
      rows={vis.map(function (v) { return { color: isHl(d, hover) && k === 1 ? 'var(--chart-highlight)' : v.color, label: v.s.label, value: formatValue(d[v.s.key], v.s.format || yFormat) }; })}
      footer={mode === 'stacked' && k > 1 ? 'Total: ' + formatValue(tot, yFormat) : null} />;
  }

  return (
    <div ref={ref} className={'gx-chart' + (hover != null ? ' gx-dim' : '') + (className ? ' ' + className : '')} style={style}>
      <svg className="gx-svg" width={width} height={height} role="img" aria-label={ariaLabel || series.map(function (s) { return s.label; }).join(', ')}
        onPointerMove={function (e) { setHover(bandIndex(e, m.l, iw, n)); }} onPointerLeave={function () { setHover(null); }}
        onClick={onSelect ? function () { if (hover != null) onSelect(data[hover], hover); } : undefined} style={onSelect ? { cursor: 'pointer' } : null}>
        {ticks.map(function (t) { return <g key={t}><line x1={m.l} x2={width - m.r} y1={Y(t)} y2={Y(t)} className={t === 0 ? 'gx-base' : 'gx-grid'} /><text x={m.l - 10} y={Y(t)} dy="0.32em" textAnchor="end" className="gx-tick">{formatValue(t, yFormat)}</text></g>; })}
        {hover != null ? <rect className="gx-band" x={m.l + hover * bw + 2} y={m.t - 6} width={bw - 4} height={ih + 6} rx={8} /> : null}
        {bars.map(function (b) {
          if (b.label != null) return <text key={b.key} x={b.cx} y={b.y} textAnchor="middle" className="gx-val">{b.label}</text>;
          return <path key={b.key} d={b.d} fill={b.fill} className={'gx-bar' + (b.neg ? ' gx-bar--neg' : '') + (hover === b.i ? ' is-on' : '')} style={{ animationDelay: Math.min(b.i * 30, 300) + 'ms' }} />;
        })}
        {references.map(function (r, i) { return <g key={'r' + i}><line x1={m.l} x2={width - m.r} y1={Y(r.value)} y2={Y(r.value)} className={'gx-ref' + (r.tone ? ' gx-ref--' + r.tone : '')} />{r.label ? <text x={width - m.r} y={Y(r.value) - 6} textAnchor="end" className="gx-ref-label">{r.label}</text> : null}</g>; })}
        {data.map(function (d, i) { return i % step === 0 ? <WrapLabel key={i} x={m.l + i * bw + bw / 2} y={height - 8} maxWidth={bw * step - 4} text={lab(i)} className="gx-tick" style={isHl(d, i) ? { fill: 'var(--chart-value)', fontWeight: 600 } : null} /> : null; })}
      </svg>
      {tip}
      <SrTable caption={ariaLabel} head={[''].concat(vis.map(function (v) { return v.s.label; }))} rows={data.map(function (d, i) { return [lab(i)].concat(vis.map(function (v) { return formatValue(d[v.s.key], yFormat); })); })} />
    </div>
  );
}
