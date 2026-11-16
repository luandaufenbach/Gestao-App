import * as React from 'react';
import { LineChartProps } from './LineChart';
/** Filled trend (volume over time). stacked=true shows composition of a total over time. Same props as LineChart. */
export interface AreaChartProps extends LineChartProps {}
export declare function AreaChart(props: AreaChartProps): JSX.Element;
