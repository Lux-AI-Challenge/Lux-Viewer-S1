import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React from 'react';
import './styles.css';
import { FrameSingleUnitData } from '../../scenes/MainScene';
import Team0WorkerSVG from '../../icons/team0worker.svg';
import Team1WorkerSVG from '../../icons/team1worker.svg';
import { Unit } from '@lux-ai/2020-challenge/lib/es6/Unit';
export type UnitCardProps = FrameSingleUnitData;
const UnitCard = ({ cargo, pos, id, cooldown, team, type }: UnitCardProps) => {
  const renderUnitSVG = () => {
    let svg = Team1WorkerSVG;
    if (type === Unit.Type.WORKER) {
      if (team === 0) {
        svg = Team0WorkerSVG;
      }
    } else {
      svg = Team1WorkerSVG;
      if (team === 0) {
        svg = Team0WorkerSVG;
      }
    }

    return <img src={svg} />;
  };
  return (
    <div className="UnitCard">
      <div className="worker-icon-wrapper">{renderUnitSVG()}</div>
      <div className="worker-data">
        <p>ID: {id}</p>
        <p>
          Position ({pos.x}, {pos.y})
        </p>
        <p>Wood: {cargo.wood}</p>
        <p>Coal: {cargo.coal}</p>
        <p>Uranium: {cargo.uranium}</p>
        <p>Cooldown: {cooldown}</p>
      </div>
    </div>
  );
};
export default UnitCard;
