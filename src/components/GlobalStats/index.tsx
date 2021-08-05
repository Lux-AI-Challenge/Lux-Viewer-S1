import React, { useState } from 'react';
import LuxCard from '../LuxCard';
import {
  Frame,
  FrameTeamStateData,
  StaticGlobalStats,
  TurnStats,
} from '../../scenes/MainScene';
import './styles.css';
import { Unit } from '@lux-ai/2021-challenge/lib/es6/Unit';
import { Grid, IconButton } from '@material-ui/core';
import Team0City from '../../icons/city00.svg';
import Team1City from '../../icons/city10.svg';
import Team1Worker from '../../icons/team1worker.svg';
import Team0Worker from '../../icons/team0worker.svg';
import Resources from '../../icons/resources.svg';
import { TeamDetails } from '../../scenes/types';
import ResourceUranium from '../../icons/resource_uranium.svg';
import ResourceCoal from '../../icons/resource_coal.svg';
import ResourceWood from '../../icons/resource_wood.svg';
import Graph from '../Graph';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import RightAngle from '../../icons/rightangle.svg';

type GlobalStatsProps = {
  currentFrame: Frame;
  teamDetails: TeamDetails;
  staticGlobalStats: StaticGlobalStats;
  turn: number;
  accumulatedStats: Array<TurnStats>;
};

const GlobalStats = ({
  currentFrame,
  teamDetails,
  staticGlobalStats,
  turn,
  accumulatedStats,
}: GlobalStatsProps) => {
  const numOfCities = [0, 0];
  let resourceCollectionPercents = [] as Array<{
    wood: number;
    coal: number;
    uranium: number;
  }>;
  const teams = [Unit.TEAM.A, Unit.TEAM.B];
  const totalCityFuel = [0, 0];
  if (currentFrame) {
    currentFrame.cityData.forEach((val) => {
      numOfCities[val.team] += val.cityTilePositions.length;
      totalCityFuel[val.team] += val.fuel;
    });
    teams.forEach((team) => {
      resourceCollectionPercents.push({
        ...currentFrame.teamStates[team].statistics.resourcesCollected,
      });
    });
    resourceCollectionPercents.forEach((obj) => {
      obj.wood /= staticGlobalStats.totalResources.wood;
      obj.coal /= staticGlobalStats.totalResources.coal;
      obj.uranium /= staticGlobalStats.totalResources.uranium;
    });
  } else {
    return null;
  }
  const slicedAccStats = accumulatedStats.slice(0, turn + 1);
  const [caroselIndex, setCaroselIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const charts = [
    {
      title: 'City Growth',
      graph: (
        <Graph
          data={slicedAccStats.map((v, i) => {
            return {
              name: `${i}`,
              team0: v.citiesOwned[0],
              team1: v.citiesOwned[1],
            };
          })}
          xlabel="Turn #"
          ylabel="# of Cities"
        />
      ),
    },
    {
      title: 'Fuel Generation',
      graph: (
        <Graph
          data={slicedAccStats.map((v, i) => {
            return {
              name: `${i}`,
              team0: v.totalFuelGenerated[0],
              team1: v.totalFuelGenerated[1],
            };
          })}
          xlabel="Turn #"
          ylabel="Fuel Generated"
        />
      ),
    },
    {
      title: 'Research Points',
      graph: (
        <Graph
          data={slicedAccStats.map((v, i) => {
            return {
              name: `${i}`,
              team0: v.researchPoints[0],
              team1: v.researchPoints[1],
            };
          })}
          xlabel="Turn #"
          ylabel="Research Points"
        />
      ),
    },
    {
      title: 'Unit Count',
      graph: (
        <Graph
          data={slicedAccStats.map((v, i) => {
            return {
              name: `${i}`,
              team0: v.unitCounts[0],
              team1: v.unitCounts[1],
            };
          })}
          xlabel="Turn #"
          ylabel="Unit Count"
        />
      ),
    },
  ];

  const getResourceCollectedWidth = (team: number, rtype: string) => {
    const total =
      resourceCollectionPercents[0][rtype] +
      resourceCollectionPercents[1][rtype];
    if (total > 1) {
      return (100 * resourceCollectionPercents[team][rtype]) / total;
    } else {
      return 100 * resourceCollectionPercents[team][rtype];
    }
  };

  return (
    <div className={'GlobalStats '}>
      {hidden ? (
        <IconButton
          className="toggle-stats hidden"
          onClick={() => {
            setHidden(false);
          }}
        >
          <img src={RightAngle} />
        </IconButton>
      ) : (
        <IconButton
          className="toggle-stats"
          onClick={() => {
            setHidden(true);
          }}
        >
          <img src={RightAngle} />
        </IconButton>
      )}
      <div className={'stats-wrapper ' + (hidden ? 'hidden-card' : '')}>
        <LuxCard title="Global Stats">
          <Grid container className="overall">
            <Grid item xs={1} key={1000}>
              <div className="cityTilesLabel">Total CityTiles</div>
              <div className="storedFuelLabel">Total City Fuel</div>
              <div className="researchPointsLabel">Research Points</div>
            </Grid>
            <Grid item xs={5} key={0}>
              <div className="teamLabel">
                <div className="icons">
                  <img src={Team0Worker} /> Team 0
                </div>
                <div className="teamname">
                  {teamDetails[0].name}
                  {teamDetails[0].tournamentID &&
                    `, ID: ${teamDetails[0].tournamentID}`}
                </div>
                <div className="houses">{numOfCities[0]}</div>
                <div className="collection">{totalCityFuel[0]}</div>
                <div className="researchPoints">
                  {accumulatedStats[turn].researchPoints[0]}
                </div>
              </div>
            </Grid>
            <Grid item xs={1} key={1001}></Grid>
            <Grid item xs={5} key={1}>
              <div className="teamLabel">
                <div className="icons">
                  <img src={Team1Worker} /> Team 1
                </div>
                <div className="teamname">
                  {teamDetails[1].name}
                  {teamDetails[1].tournamentID &&
                    `, ID: ${teamDetails[1].tournamentID}`}
                </div>
                <div className="houses">{numOfCities[1]}</div>
                <div className="collection">{totalCityFuel[1]}</div>
                <div className="researchPoints">
                  {accumulatedStats[turn].researchPoints[1]}
                </div>
              </div>
            </Grid>
          </Grid>
          <div className="resource-graph">
            <div className="title">Map Resource Collection</div>
            <div>
              <div className="graph-legend">
                <div>
                  <img src={ResourceWood} />
                </div>
                <div>
                  <img src={ResourceCoal} />
                </div>
                <div>
                  <img src={ResourceUranium} />
                </div>
              </div>
              <div className="graph">
                {['wood', 'coal', 'uranium'].map((resourceType) => {
                  const total =
                    resourceCollectionPercents[0][resourceType] +
                    resourceCollectionPercents[1][resourceType];
                  return (
                    <div className={resourceType} key={resourceType}>
                      <div className="bgbar"></div>
                      <div
                        className="team1bar"
                        style={{
                          width: `${getResourceCollectedWidth(
                            1,
                            resourceType
                          )}%`,
                          left: `${getResourceCollectedWidth(
                            0,
                            resourceType
                          )}%`,
                        }}
                      >
                        <span
                          style={{
                            left:
                              total < 0.5
                                ? `${3 * (1 - total / 0.5)}rem`
                                : 'auto',
                          }}
                        >
                          {(
                            resourceCollectionPercents[1][resourceType] * 100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                      <div
                        className="team0bar"
                        style={{
                          width: `${getResourceCollectedWidth(
                            0,
                            resourceType
                          )}%`,
                          left: '0px',
                        }}
                      >
                        <span>
                          {(
                            resourceCollectionPercents[0][resourceType] * 100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="Carosel">
            <div className="Carosel-Control">
              <ArrowLeftIcon
                className="ArrowLeft"
                onClick={() => {
                  if (caroselIndex === 0) {
                    setCaroselIndex(charts.length - 1);
                  } else {
                    setCaroselIndex((caroselIndex - 1) % charts.length);
                  }
                }}
              />
              <div className="chart-title">{charts[caroselIndex].title}</div>
              <ArrowRightIcon
                className="ArrowRight"
                onClick={() => {
                  setCaroselIndex((caroselIndex + 1) % charts.length);
                }}
              />
            </div>
            {charts[caroselIndex].graph}
          </div>

          {/* {currentFrame !== null &&
          [0, 1].map((team) => {
            const state = currentFrame.teamStates[team as Unit.TEAM];
            let totalCityFuel = 0;
            const cityInfo = state.citiesOwned.map((id) => {
              const city = currentFrame.cityData.get(id);
              totalCityFuel += city.fuel;
              return {
                fuel: city.fuel,
                cells: city.cityTilePositions.length,
                cityid: id,
              };
            });
            return (
              <div key={team}>
                <div>Team {team}</div>
                <p>Total Cities: {state.citiesOwned.length}</p>
                <p>Total Fuel: {totalCityFuel}</p>
              </div>
            );
          })} */}
        </LuxCard>
      </div>
    </div>
  );
};
export default GlobalStats;
