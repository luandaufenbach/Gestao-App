import React from 'react';
import { formatValue, seriesColor } from '../base/ChartCore.jsx';

export function DistributionBar({ data = [], format, height = 12, legend = true, showPercent = true, ariaLabel, className, style }) {
  const [hover, setHover] = React.useState(null);
  const total = data.reduce(function (a, d) { return a + (d.value || 0); }, 0) || 1;
  const pct = function (v) { return formatValue(Math.round((v / total) * 1000) / 10, 'percent'); };
  return (
    <div className={'gx-dist' + (className ? ' ' + className : '')} style={style}>
      <div className="gx-dist__bar" style={{ '--bh': height + 'px' }} role="img" aria-label={ariaLabel || data.map(function (d) { return d.label + ' ' + pct(d.value); }).join(', ')}>
        {data.map(function (d, i) {
          return <span key={i} className="gx-dist__seg" title={d.label + ': ' + formatValue(d.value, format) + ' (' + pct(d.value) + ')'} style={{ flex: (d.value || 0) + ' 0 0', background: seriesColor(i, d.color), opacity: hover != null && hover !== i ? 0.35 : 1, animationDelay: i * 60 + 'ms' }} onPointerEnter={function () { setHover(i); }} onPointerLeave={function () { setHover(null); }} />;
        })}
      </div>
      {legend ? (
        <div className="gx-dist__legend">
          {data.map(function (d, i) {
            return (
              <div key={i} className="gx-dist__item" onPointerEnter={function () { setHover(i); }} onPointerLeave={function () { setHover(null); }}>
                <span className="gx-dist__lab"><span className="gx-legend__sw" style={{ '--c': seriesColor(i, d.color) }} />{d.label}</span>
                <span className="gx-dist__num">{formatValue(d.value, format)}{showPercent ? <small>{pct(d.value)}</small> : null}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
