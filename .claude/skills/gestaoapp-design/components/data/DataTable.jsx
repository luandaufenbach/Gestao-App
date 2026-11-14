import React from 'react';

export function DataTable({ columns = [], rows = [], rowKey, onRowClick, compact = false, style }) {
  return (
    <div className="ga-table-wrap" style={style}>
      <table className={'ga-table' + (onRowClick ? ' ga-table--clickable' : '') + (compact ? ' ga-table--compact' : '')}>
        <thead>
          <tr>{columns.map(function (c) { return <th key={c.key} style={{ width: c.width, textAlign: c.align || 'left' }}>{c.header}</th>; })}</tr>
        </thead>
        <tbody>
          {rows.map(function (r, i) {
            return (
              <tr key={rowKey ? r[rowKey] : i} onClick={onRowClick ? function () { onRowClick(r); } : undefined}>
                {columns.map(function (c) { return <td key={c.key} style={{ textAlign: c.align || 'left' }}>{c.render ? c.render(r) : r[c.key]}</td>; })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
