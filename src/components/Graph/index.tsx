import React from 'react';
import './styles.css';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Label,
} from 'recharts';
import { TEAM_A_COLOR_STR, TEAM_B_COLOR_STR } from '../../scenes/types';
export type GraphProps = {
  data: Array<{ name: string; team0: number; team1: number }>;
  ylabel: string;
  xlabel: string;
};
const Graph = ({ data, ylabel, xlabel }: GraphProps) => {
  return (
    <div className="Graph">
      <ResponsiveContainer width={'100%'} height={220}>
        <LineChart
          // width={200}
          onClick={() => {}}
          // height={150}
          data={data}
          margin={{ top: 15, right: 20, left: 0, bottom: 15 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name">
            <Label
              value={xlabel}
              offset={0}
              position="insideBottom"
              color={'#323D34'}
            />
          </XAxis>
          <YAxis
            label={{ value: ylabel, angle: -90, position: 'insideLeft' }}
          ></YAxis>
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="team0"
            name="Team 0"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
            stroke={TEAM_A_COLOR_STR}
          />
          <Line
            type="monotone"
            dataKey="team1"
            name="Team 1"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
            stroke={TEAM_B_COLOR_STR}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
export default Graph;
