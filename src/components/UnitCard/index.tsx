import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React from 'react';
import './styles.css';
import { FrameSingleUnitData } from '../../scenes/MainScene';
export type UnitCardProps = FrameSingleUnitData;
const UnitCard = ({ cargo, pos, id, cooldown, team }: UnitCardProps) => {
  const renderUnitSVG = () => {
    return <img src={`./icons/team${team}worker.svg`} />;
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
