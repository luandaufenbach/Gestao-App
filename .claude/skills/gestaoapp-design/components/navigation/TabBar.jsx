import React from 'react';
import { Icon } from '../core/Icon.jsx';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function TabBar({ items = [], value, onChange, onAdd, addLabel = 'Nova tarefa', floating = false, style }) {
  const half = Math.ceil(items.length / 2);
  function render(it) {
    const active = value === it.value;
    return (
      <button key={it.value} type="button" className={cx('ga-tabbar__item', active && 'ga-tabbar__item--active')} aria-current={active ? 'page' : undefined} onClick={function () { onChange && onChange(it.value); }}>
        <Icon name={it.icon} size={20} />
        <span>{it.label}</span>
      </button>
    );
  }
  return (
    <nav className={cx('ga-tabbar', floating && 'ga-tabbar--floating')} style={style}>
      {items.slice(0, half).map(render)}
      {onAdd ? <button type="button" className="ga-tabbar__fab" aria-label={addLabel} onClick={onAdd}><Icon name="plus" size={22} strokeWidth={2.25} /></button> : null}
      {items.slice(half).map(render)}
    </nav>
  );
}
