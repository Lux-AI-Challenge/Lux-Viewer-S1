import Divider from '@material-ui/core/Divider'
import React from 'react';
import './styles.css';
export type PlayerStatsProps = {
  turn: number;
};
const PlayerStats = ({ turn }: PlayerStatsProps) => {
  return (
    <div className="GameStats">
      <p>Turn {turn} </p>
      <Divider />
    </div>
  );
};
export default PlayerStats;
