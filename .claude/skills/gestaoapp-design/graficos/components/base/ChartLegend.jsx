import React from 'react';
import { formatValue } from './ChartCore.jsx';

export function ChartLegend({ items = [], hidden = [], onToggle, align = 'start', format, style }) {
  return (
    <div className={'gx-legend' + (align === 'end' ? ' gx-legend--end' : '')} style={style}>
      {items.map(function (it, i) {
        const key = it.key != null ? it.key : it.label;
        const off = hidden.indexOf(key) >= 0;
        const shape = it.dashed ? 'dashed' : (it.shape || 'square');
        const sw = <span className={'gx-legend__sw' + (shape !== 'square' ? ' gx-legend__sw--' + shape : '')} style={{ '--c': it.color }} />;
        const body = (
          <React.Fragment>
            {sw}<span className="gx-legend__label">{it.label}</span>
            {it.value != null ? <span className="gx-legend__val">{formatValue(it.value, it.format || format)}</span> : null}
          </React.Fragment>
        );
        if (onToggle) return <button type="button" key={key} className="gx-legend__item" aria-pressed={!off} onClick={function () { onToggle(key); }}>{body}</button>;
        return <span key={key} className="gx-legend__item">{body}</span>;
      })}
    </div>
  );
}

export function useLegendToggle(initial) {
  const [hidden, setHidden] = React.useState(initial || []);
  const toggle = function (k) { setHidden(function (h) { return h.indexOf(k) >= 0 ? h.filter(function (x) { return x !== k; }) : h.concat([k]); }); };
  return [hidden, toggle];
}
