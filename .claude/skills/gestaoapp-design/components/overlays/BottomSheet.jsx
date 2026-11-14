import React from 'react';

function cx() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); }

export function BottomSheet({ open = true, title, closeLabel = 'Cancelar', onClose, contained = false, children, style }) {
  if (!open) return null;
  return (
    <React.Fragment>
      <div className={cx('ga-scrim', contained && 'ga-scrim--contained')} onClick={onClose} />
      <div role="dialog" aria-label={typeof title === 'string' ? title : undefined} className={cx('ga-sheet', contained && 'ga-sheet--contained')} style={style}>
        <div className="ga-sheet__grab" />
        {title || onClose ? (
          <div className="ga-sheet__head">
            <div className="ga-sheet__title">{title}</div>
            {onClose ? <button type="button" className="ga-sheet__close" onClick={onClose}>{closeLabel}</button> : null}
          </div>
        ) : null}
        <div className="ga-sheet__body">{children}</div>
      </div>
    </React.Fragment>
  );
}
