import React from 'react';
import { LineChart } from './LineChart.jsx';

export function AreaChart(props) {
  return <LineChart area={true} {...props} />;
}
