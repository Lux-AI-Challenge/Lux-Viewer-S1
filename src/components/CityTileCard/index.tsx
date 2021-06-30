import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React from 'react';
import './styles.css';
import {
  FrameCityData,
  FrameCityTileData,
  FrameSingleUnitData,
} from '../../scenes/MainScene';
import Team0CitySVG from '../../icons/city00.svg';
import Team1CitySVG from '../../icons/city10.svg';
import Team0CartSVG from '../../icons/team0cart.svg';
import Team1CartSVG from '../../icons/team1cart.svg';
import { Unit } from '@lux-ai/2021-challenge/lib/es6/Unit';
import { LinearProgress, makeStyles } from '@material-ui/core';
import { Position } from '@lux-ai/2021-challenge/lib/es6/GameMap/position';
export type CityTileCardProps = { cityTiles: FrameCityTileData; pos: Position };

const useStyles = makeStyles({
  progressa: {
    backgroundColor: 'orange',
  },
  progressb: {
    backgroundColor: 'blue',
  },
});
const CityTileCard = ({ cityTiles, pos }: CityTileCardProps) => {
  let cityTile = cityTiles[0];
  for (const ct of cityTiles) {
    if (ct.pos.x === pos.x && ct.pos.y === pos.y) {
      cityTile = ct;
      break;
    }
  }
  const classes = useStyles();
  const renderUnitSVG = () => {
    let svg = Team1CitySVG;
    if (cityTile.team === 0) {
      svg = Team0CitySVG;
    }
    return <img src={svg} />;
  };
  const maxCooldown = 10;
  return (
    <div className="CityTileCard">
      <div className="unit-id">
        <strong>ID:</strong> N/A
      </div>
      <div className="worker-icon-wrapper">{renderUnitSVG()}</div>
      <div className="worker-data">
        <p>
          <strong>ID of City:</strong> <span>{cityTile.cityid}</span>
        </p>
        <br />
        <br />
        <br />
        <br />
      </div>
      <div className="cooldown-bar-wrapper">
        <div className="cooldown-value-wrapper">
          <span className="cooldown-title">
            <strong>Cooldown:</strong>
          </span>{' '}
          <span className="cooldown-value">
            {cityTile.cooldown} / {maxCooldown}
          </span>
        </div>

        <LinearProgress
          className={
            (cityTile.team === Unit.TEAM.A ? 'cooldown-a' : 'cooldown-b') +
            ' cooldown-bar'
          }
          variant="determinate"
          value={(cityTile.cooldown * 100) / maxCooldown}
        />
      </div>
    </div>
  );
};
export default CityTileCard;
