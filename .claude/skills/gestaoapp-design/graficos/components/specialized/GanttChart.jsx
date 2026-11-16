import React from 'react';
import { seriesColor } from '../base/ChartCore.jsx';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DAY = 86400000;
function toD(s) { const p = String(s).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
function fmt(t) { const d = new Date(t); return d.getUTCDate() + ' ' + MESES[d.getUTCMonth()]; }

export function GanttChart({ start, end, rows = [], today, labelWidth = 180, rowHeight = 44, tickDays = 7, minWidth = 640, onSelect, ariaLabel, className, style }) {
  const s0 = toD(start), s1 = toD(end) + DAY;
  const span = s1 - s0;
  const L = function (t) { return ((t - s0) / span) * 100; };
  const ticks = []; for (let t = s0; t < s1; t += tickDays * DAY) ticks.push(t);
  const td = today ? toD(today) + DAY / 2 : null;
  return (
    <div className={'gx-gantt' + (className ? ' ' + className : '')} style={Object.assign({ '--lw': labelWidth + 'px', '--rh': rowHeight + 'px', '--minw': minWidth + 'px' }, style)} role="table" aria-label={ariaLabel || 'Cronograma'}>
      <div className="gx-gantt__inner">
        <div className="gx-gantt__head" role="row">
          <div className="gx-gantt__corner" role="columnheader">Projeto</div>
          <div className="gx-gantt__scale">
            {ticks.map(function (t) { return <span key={t} className="gx-gantt__tick" style={{ left: L(t) + '%' }}>{td != null && Math.abs(t - td) < 3.5 * DAY ? '' : fmt(t)}</span>; })}
            {td != null && td >= s0 && td <= s1 ? <span className="gx-gantt__today" style={{ left: L(td) + '%' }}><span>Hoje</span></span> : null}
          </div>
        </div>
        {rows.map(function (r, i) {
          const c = seriesColor(i, r.color);
          const a = toD(r.start), b = r.milestone ? a : toD(r.end) + DAY;
          const left = Math.max(0, L(a)), right = Math.min(100, L(b));
          const prog = r.progress != null ? Math.max(0, Math.min(100, r.progress)) : null;
          return (
            <div key={i} className={'gx-gantt__row' + (onSelect ? ' gx-gantt__row--click' : '')} role="row" onClick={onSelect ? function () { onSelect(r); } : undefined}>
              <div className="gx-gantt__label" role="rowheader">
                <span className="gx-gantt__sq" style={{ background: c }} />
                <span className="gx-gantt__name"><span>{r.label}</span><small>{r.sub || (fmt(a) + (r.milestone ? '' : ' – ' + fmt(b - DAY)))}</small></span>
              </div>
              <div className="gx-gantt__lane" role="cell">
                {ticks.map(function (t) { return <span key={t} className="gx-gantt__grid" style={{ left: L(t) + '%' }} />; })}
                {td != null && td >= s0 && td <= s1 ? <span className="gx-gantt__today" style={{ left: L(td) + '%' }} /> : null}
                {r.milestone ? <span className="gx-gantt__ms" style={{ left: L(a + DAY / 2) + '%', background: c }} title={r.label + ' · ' + fmt(a)} /> : (
                  <span className="gx-gantt__bar" title={r.label + ' · ' + fmt(a) + ' – ' + fmt(b - DAY) + (prog != null ? ' · ' + prog + '%' : '')} style={{ left: left + '%', width: Math.max(0.8, right - left) + '%', background: 'color-mix(in oklab, ' + c + ' 20%, var(--chart-surface))', animationDelay: i * 60 + 'ms' }}>
                    {prog != null ? <span className="gx-gantt__prog" style={{ width: prog + '%', background: c }} /> : null}
                    {prog != null ? <span className="gx-gantt__pct" style={{ color: prog > 85 ? '#fff' : 'var(--chart-value)' }}>{prog}%</span> : null}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
