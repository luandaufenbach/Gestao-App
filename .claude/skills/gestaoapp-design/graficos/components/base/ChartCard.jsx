import React from 'react';
import { TrendDelta } from './TrendDelta.jsx';
import { ChartLegend } from './ChartLegend.jsx';
import { formatValue } from './ChartCore.jsx';

function Skeleton({ height }) {
  const hs = [46, 70, 58, 84, 62, 92, 74, 55, 80, 66];
  return <div className="gx-skel" style={{ height: height }} aria-busy="true" aria-label="Carregando gráfico">{hs.map(function (h, i) { return <span key={i} style={{ height: h + '%' }} />; })}</div>;
}

export function ChartCard({ title, subtitle, actions, value, valueFormat, delta, deltaFormat = 'percent', deltaInvert = false, comparison, legend, hidden, onToggleLegend, footer, state = 'ready', height = 220, emptyTitle = 'Sem dados para este período', emptyText = 'Ajuste os filtros ou escolha outro intervalo.', errorText = 'Não foi possível carregar os dados.', onRetry, flush = false, className, style, children }) {
  let body = children;
  if (state === 'loading') body = <Skeleton height={height} />;
  else if (state === 'empty') body = <div className="gx-state gx-state--empty" style={{ height: height }}><div className="gx-state__t">{emptyTitle}</div>{emptyText}</div>;
  else if (state === 'error') body = <div className="gx-state gx-state--error" style={{ height: height }}><div className="gx-state__t">{errorText}</div>{onRetry ? <button type="button" className="gx-btn" onClick={onRetry}>Tentar novamente</button> : 'Tente novamente em instantes.'}</div>;
  return (
    <section className={'gx-card' + (flush ? ' gx-card--flush' : '') + (className ? ' ' + className : '')} style={style} aria-label={typeof title === 'string' ? title : undefined}>
      {title || actions ? (
        <div className="gx-card__head">
          <div className="gx-card__titles">
            {title ? <h3 className="gx-card__title" style={{ margin: 0 }}>{title}</h3> : null}
            {subtitle ? <div className="gx-card__sub">{subtitle}</div> : null}
          </div>
          {actions ? <div className="gx-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      {value != null && state === 'ready' ? (
        <div className="gx-card__kpi">
          <span className="gx-card__value">{typeof value === 'number' ? formatValue(value, valueFormat) : value}</span>
          {delta != null ? <TrendDelta value={delta} format={deltaFormat} invert={deltaInvert} label={comparison} /> : null}
          {comparison ? <span className="gx-card__cmp">{comparison}</span> : null}
        </div>
      ) : null}
      {legend && legend.length && state === 'ready' ? <div className="gx-card__legend"><ChartLegend items={legend} hidden={hidden} onToggle={onToggleLegend} /></div> : null}
      <div className="gx-card__body">{body}</div>
      {footer ? <div className="gx-card__foot" style={flush ? { margin: 0, padding: '12px 20px' } : null}>{footer}</div> : null}
    </section>
  );
}
