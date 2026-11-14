import React from 'react';

export function BarChart({ data = [], max, height = 140, legend = true, legendLabels, style }) {
  const m = max || Math.max.apply(null, data.map(function (d) { return Math.max(d.value || 0, d.planned || 0); }).concat([1]));
  const L = legendLabels || { done: 'Concluídas', today: 'Hoje', planned: 'Planejadas' };
  return (
    <div className="ga-bars" style={style}>
      <div className="ga-bars__plot" style={{ '--h': height + 'px' }}>
        {data.map(function (d, i) {
          return (
            <div className="ga-bars__col" key={i} title={d.label + ': ' + d.value + (d.planned ? ' / ' + d.planned : '')}>
              <div className="ga-bars__stack">
                {d.planned ? <div className="ga-bars__planned" style={{ height: (d.planned / m) * 100 + '%' }} /> : null}
                <div className={'ga-bars__done' + (d.highlight ? ' ga-bars__done--hl' : '')} style={{ height: Math.max(4, (d.value / m) * 100) + '%' }} />
              </div>
              <span className={'ga-bars__label' + (d.highlight ? ' ga-bars__label--hl' : '')}>{d.label}</span>
            </div>
          );
        })}
      </div>
      {legend ? (
        <div className="ga-legend">
          <span className="ga-legend__item"><span className="ga-legend__sw" style={{ '--c': 'var(--brand-primary)' }} />{L.done}</span>
          <span className="ga-legend__item"><span className="ga-legend__sw" style={{ '--c': 'var(--accent)' }} />{L.today}</span>
          <span className="ga-legend__item"><span className="ga-legend__sw" style={{ '--c': 'var(--ink-100)' }} />{L.planned}</span>
        </div>
      ) : null}
    </div>
  );
}
