import React, { useState } from 'react';
import LuxCard from '../LuxCard';
import { Frame, FrameTeamStateData } from '../../scenes/MainScene';
import './styles.css';
import { Unit } from '@lux-ai/2020-challenge/lib/es6/Unit';
import { Grid } from '@material-ui/core';
import Team0City from '../../icons/city00.svg';
import Team1City from '../../icons/city10.svg';
import Team1Worker from '../../icons/team1worker.svg';
import Team0Worker from '../../icons/team0worker.svg';
import Resources from '../../icons/Resources.svg';
import { TeamDetails } from '../../scenes/types';

const GlobalStats = ({
  currentFrame,
  teamDetails,
}: {
  currentFrame: Frame;
  teamDetails: TeamDetails;
}) => {
  const numOfCities = [0, 0];
  if (currentFrame) {
    currentFrame.cityData.forEach((val) => {
      numOfCities[val.team] += val.cityTilePositions.length;
    });
    currentFrame.teamStates[Unit.TEAM.A];
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
