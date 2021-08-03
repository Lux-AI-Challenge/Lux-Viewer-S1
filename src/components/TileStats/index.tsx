import React from 'react';
import Grid from '@material-ui/core/Grid';
import './styles.css';
import { FrameTileData, FrameCityData } from '../../scenes/MainScene';
import UnitCard from '../UnitCard';
import LuxCard from '../LuxCard';

import ResourceUranium from '../../icons/resource_uranium.svg';
import ResourceCoal from '../../icons/resource_coal.svg';
import ResourceWood from '../../icons/resource_wood.svg';
import { Resource } from '@lux-ai/2021-challenge/lib/es6/Resource';
import CityStatsCard from '../CityStatsCard';
import CityTileCard from '../CityTileCard';

export type TileStatsProps = Partial<FrameTileData> & {
  cities?: FrameCityData;
  empty?: boolean;
  trackUnit: (id: string) => void;
  untrackUnit: (id: string) => void;
  trackedUnitID: string;
};
const TileStats = ({
  pos,
  units,
  cityTile,
  cities,
  resources,
  empty,
  roadLevel,
  turn,
  trackedUnitID,
  untrackUnit,
  trackUnit,
}: TileStatsProps) => {
  const renderResourceSVG = () => {
    let svg = ResourceWood;
    if (resources.type === Resource.Types.URANIUM) {
      svg = ResourceUranium;
    } else if (resources.type === Resource.Types.COAL) {
      svg = ResourceCoal;
    }
    return (
      <span className="resource-icon-wrapper">
        <img className="resource-icon" src={svg} />
      </span>
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
            <div className="sub-header">
              <div className="coords-label">Coordinates</div>
              <span>
                ({pos.x}, {pos.y})
              </span>
            </div>
            <div className="subtitle">General</div>
            {resources && (
              <div className="resources">
                <span className="resource-name">{resources.type}</span>{' '}
                <span className="resource-amount">x{resources.amt}</span>
                {renderResourceSVG()}{' '}
              </div>
            )}
            {roadLevel !== undefined && (
              <div className="roadlevel">
                <p>
                  Road Level: <span>{roadLevel.toFixed(1)}/6.0</span>
                </p>
              </div>
            )}
            {cityTile.length > 0 && cities.get(cityTile[0].cityid) && (
              <>
                <div className="subtitle">City Info</div>
                <Grid container className="CityStats">
                  <CityStatsCard
                    {...cities.get(cityTile[0].cityid)}
                    cityid={cityTile[0].cityid}
                  />
                </Grid>
              </>
            )}
            {allunits.length > 0 && <div className="subtitle">Units:</div>}
            <Grid container className="UnitStats" spacing={1}>
              {allunits
                .sort((a, b) => {
                  if (a.id === trackedUnitID) {
                    return -1;
                  } else if (b.id === trackedUnitID) {
                    return 1;
                  }
                  return 0;
                })
                .map((v) => {
                  return (
                    <Grid item className="UnitData" xs={6} key={v.id}>
                      <div
                        className={
                          trackedUnitID === v.id ? 'tracked-unit-card' : ''
                        }
                        onClick={() => {
                          if (trackedUnitID === v.id) {
                            untrackUnit(v.id);
                          } else {
                            trackUnit(v.id);
                          }
                        }}
                      >
                        <UnitCard {...v} turn={turn} />
                      </div>
                    </Grid>
                  );
                })}
            </Grid>
            <Grid container>
              <Grid item xs={2}></Grid>
              {cityTile.length > 0 && (
                <Grid
                  item
                  className="CityTileData"
                  xs={8}
                  key={cityTile[0].cityid}
                >
                  <CityTileCard cityTiles={cityTile} pos={pos} />
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
