import React from 'react';

export function ProjectTag({ name, color = 'var(--project-1)', plain = false, style }) {
  return (
    <span className={'ga-ptag' + (plain ? ' ga-ptag--plain' : '')} style={Object.assign({ '--c': color }, style)}>
      <span className="ga-ptag__sq" />
      <span className="ga-ptag__label">{name}</span>
    </span>
  );
}
