import React, { useState } from 'react';
import LuxCard from '../LuxCard';
import {
  Frame,
  FrameTeamStateData,
  StaticGlobalStats,
} from '../../scenes/MainScene';
import './styles.css';
import { Unit } from '@lux-ai/2020-challenge/lib/es6/Unit';
import { Grid } from '@material-ui/core';
import Team0City from '../../icons/city00.svg';
import Team1City from '../../icons/city10.svg';
import Team1Worker from '../../icons/team1worker.svg';
import Team0Worker from '../../icons/team0worker.svg';
import Resources from '../../icons/Resources.svg';
import { TeamDetails } from '../../scenes/types';
import ResourceUranium from '../../icons/resource_uranium.svg';
import ResourceCoal from '../../icons/resource_uranium.svg';
import ResourceWood from '../../icons/resource_wood.svg';

const GlobalStats = ({
  currentFrame,
  teamDetails,
  staticGlobalStats,
}: {
  currentFrame: Frame;
  teamDetails: TeamDetails;
  staticGlobalStats: StaticGlobalStats;
}) => {
  const numOfCities = [0, 0];
  let resourceCollectionPercents = [] as Array<{
    wood: number;
    coal: number;
    uranium: number;
  }>;
  const teams = [Unit.TEAM.A, Unit.TEAM.B];
  if (currentFrame) {
    currentFrame.cityData.forEach((val) => {
      numOfCities[val.team] += val.cityTilePositions.length;
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
  return (
    <div className="GlobalStats">
      <LuxCard title="Global Stats">
        <Grid container>
          <Grid item xs={2} key={1000}></Grid>
          <Grid item xs={5} key={0}>
            <div className="teamLabel">
              <div className="icons">
                Team 0 <img src={Team0Worker} height={34} />
              </div>
              <div>
                Name: {teamDetails[0].name}
                {teamDetails[0].tournamentID &&
                  `, ID: ${teamDetails[0].tournamentID}`}
              </div>
              <div className="houses">
                <img src={Team0City} height={44} /> {numOfCities[0]}
              </div>
              <div className="collection">
                <img src={Resources} height={32} /> {numOfCities[0]}
              </div>
            </div>
          </Grid>
          <Grid item xs={5} key={1}>
            <div className="teamLabel">
              <div className="icons">
                Team 1 <img src={Team1Worker} height={34} />
              </div>
              <div>
                Name: {teamDetails[1].name}
                {teamDetails[1].tournamentID &&
                  `, ID: ${teamDetails[1].tournamentID}`}
              </div>
              <div className="houses">
                <img src={Team1City} height={44} /> {numOfCities[1]}
              </div>
              <div className="collection">
                <img src={Resources} height={32} /> {numOfCities[0]}
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
                console.log(resourceCollectionPercents);
                return (
                  <div className={resourceType} key={resourceType}>
                    <div className="bgbar"></div>
                    <div
                      className="team1bar"
                      style={{
                        width: `${
                          resourceCollectionPercents[1][resourceType] * 100
                        }%`,
                        left: `${
                          resourceCollectionPercents[0][resourceType] * 100
                        }%`,
                      }}
                    >
                      <span>
                        {(
                          resourceCollectionPercents[1][resourceType] * 100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div
                      className="team0bar"
                      style={{
                        width: `${
                          resourceCollectionPercents[0][resourceType] * 100
                        }%`,
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
        {currentFrame !== null &&
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
          })}
      </LuxCard>
    </div>
  );
};
export default GlobalStats;
