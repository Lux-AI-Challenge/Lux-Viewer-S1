import { Unit } from '@lux-ai/2020-challenge/lib/es6/Unit';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React from 'react';
import './styles.css';
import { FrameTileData, FrameCityData } from '../../scenes/MainScene';
import UnitCard from '../UnitCard';
import LuxCard from '../LuxCard';
export type TileStatsProps = Partial<FrameTileData> & {
  cities?: FrameCityData;
  empty?: boolean;
};
const TileStats = ({
  pos,
  units,
  cityTile,
  cities,
  resources,
  empty,
}: TileStatsProps) => {
  const renderResourceSVG = () => {
    return (
      <img
        className="resource-icon"
        src={`./icons/resource_${resources.type}.svg`}
      />
    );
  };
  const allunits = units ? Array.from(units.values()) : [];
  return (
    <div className="TileStats">
      <LuxCard title="Tile Properties">
        {empty ? (
          ''
        ) : (
          <>
            <p className="sub-header">
              Tile at ({pos.x}, {pos.y})
            </p>
            <div className="resources">
              {resources && (
                <>
                  Resources: {renderResourceSVG()}{' '}
                  <span className="resource-amount">{resources.amt}</span>
                </>
              )}
            </div>
            {allunits.length > 0 && <div className="sub-header">Units:</div>}
            <Grid container className="UnitStats">
              {allunits.map((v) => {
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
          </>
        )}
      </LuxCard>
    </div>
  );
};
export default TileStats;
