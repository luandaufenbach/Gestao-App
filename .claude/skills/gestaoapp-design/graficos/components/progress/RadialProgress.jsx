import React from 'react';
import { formatValue, seriesColor } from '../base/ChartCore.jsx';

export function RadialProgress({ rings = [], size = 132, thickness = 11, gap = 4, centerValue, centerLabel, legend = true, format = 'percent', ariaLabel, className, style }) {
  const [on, setOn] = React.useState(false);
  React.useEffect(function () { const t = setTimeout(function () { setOn(true); }, 40); return function () { clearTimeout(t); }; }, []);
  const c = size / 2;
  const single = rings.length === 1;
  const pctOf = function (r) { return Math.max(0, Math.min(1, (r.value || 0) / (r.max || 100))); };
  const cv = centerValue != null ? centerValue : (single ? formatValue(Math.round(pctOf(rings[0]) * 100), 'percent') : null);
  return (
    <div className={'gx-rings' + (className ? ' ' + className : '')} style={style}>
      <div className="gx-rings__fig" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={ariaLabel || rings.map(function (r) { return r.label + ' ' + Math.round(pctOf(r) * 100) + '%'; }).join(', ')}>
          {rings.map(function (r, i) {
            const rad = c - thickness / 2 - i * (thickness + gap);
            if (rad <= thickness / 2) return null;
            const C = 2 * Math.PI * rad; const col = seriesColor(i, r.color);
            return (
              <g key={i} transform={'rotate(-90 ' + c + ' ' + c + ')'}>
                <circle cx={c} cy={c} r={rad} fill="none" stroke={col} strokeOpacity={0.14} strokeWidth={thickness} />
                <circle className="gx-rings__arc" cx={c} cy={c} r={rad} fill="none" stroke={col} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - (on ? pctOf(r) : 0))} />
              </g>
            );
          })}
        </svg>
        {cv != null || centerLabel ? <div className="gx-rings__center">{cv != null ? <span className="gx-rings__cv">{cv}</span> : null}{centerLabel ? <span className="gx-rings__cl">{centerLabel}</span> : null}</div> : null}
      </div>
      {legend && !single ? (
        <div className="gx-rings__list">
          {rings.map(function (r, i) {
            return <div key={i} className="gx-rings__row"><span className="gx-legend__sw gx-legend__sw--dot" style={{ '--c': seriesColor(i, r.color) }} /><span>{r.label}{r.sub ? <small>{r.sub}</small> : null}</span><b>{r.display || formatValue(Math.round(pctOf(r) * 100), 'percent')}</b></div>;
          })}
        </div>
      ) : null}
    </div>
  );
}
