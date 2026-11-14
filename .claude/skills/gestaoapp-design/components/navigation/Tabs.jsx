import React from 'react';

export function Tabs({ tabs = [], value, onChange, style }) {
  return (
    <div role="tablist" className="ga-tabs" style={style}>
      {tabs.map(function (t) {
        const v = typeof t === 'string' ? t : t.value;
        const l = typeof t === 'string' ? t : t.label;
        return (
          <button key={v} role="tab" type="button" className="ga-tab" aria-selected={value === v} onClick={function () { onChange && onChange(v); }}>
            {l}{t.count != null ? <span className="ga-tab__count">{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
