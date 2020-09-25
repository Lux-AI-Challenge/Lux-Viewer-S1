import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React from 'react';
import './styles.css';
import { FrameSingleUnitData } from '../../scenes/MainScene';
export type UnitCardProps = FrameSingleUnitData;
const UnitCard = ({ cargo, pos, id }: UnitCardProps) => {
  return (
    <Card className="UnitCard">
      <CardContent>
        <p>ID: {id}</p>
        <p>Wood: {cargo.wood}</p>
        <p>Coal: {cargo.coal}</p>
        <p>Uranium: {cargo.uranium}</p>
      </CardContent>
    </Card>
  );
};
export default UnitCard;
