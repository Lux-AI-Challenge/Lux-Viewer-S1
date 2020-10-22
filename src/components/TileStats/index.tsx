import { Unit } from '@lux-ai/2020-challenge/lib/es6/Unit';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React from 'react';
import './styles.css';
import { FrameTileData, FrameCityData } from '../../scenes/MainScene';
import UnitCard from '../UnitCard';
export type TileStatsProps = FrameTileData & { cities: FrameCityData };
const TileStats = ({ pos, units, cityTile, cities, resources }: TileStatsProps) => {
  return (
    <div className="TileStats">
      <p>
        Tile at ({pos.x}, {pos.y})
      </p>
      <div>
        {resources && `Resources: ${resources.amt} ${resources.type}`}
      </div>
      <Grid container className="UnitStats">
        {Array.from(units.values()).map((v) => {
          return (
            <Grid item className="UnitData" xs={6} key={v.id}>
              <UnitCard {...v} />
            </Grid>
          );
        })}
      </Grid>
      <Grid container className="CityStats">
        {cityTile.length > 0 && (
          <Grid item xs={12}>
            <p>City ID: {cityTile[0].cityid}</p>
            <p>Light: {cities.get(cityTile[0].cityid).fuel}</p>
            <p>Team: {cities.get(cityTile[0].cityid).team}</p>
          </Grid>
        )}
      </Grid>
      <Grid container className="CityTileStats">
        {cityTile.length > 0 && (
          <Grid item xs={12}>
            <p>City ID: {cityTile[0].cityid}</p>
            <p>Cooldown: {cityTile[0].cooldown}</p>
            <p>Team: {cityTile[0].team}</p>
          </Grid>
        )}
      </Grid>
      <Divider />
    </div>
  );
};
export default TileStats;
