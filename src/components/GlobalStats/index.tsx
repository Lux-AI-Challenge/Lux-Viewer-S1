import React, { useState } from 'react';
import LuxCard from '../LuxCard';
import { Frame, FrameTeamStateData } from '../../scenes/MainScene';
import './styles.css';
import { Unit } from '@lux-ai/2020-challenge/lib/es6';
import { Grid } from '@material-ui/core';
import Team0City from '../../icons/city00.svg';
import Team1City from '../../icons/city10.svg';

const GlobalStats = ({ currentFrame }: { currentFrame: Frame }) => {
  return (
    <div className="GlobalStats">
      <LuxCard title="Global Stats">
        <Grid>
          <Grid item xs={6} key={0}>
            <span>
              Team 0 <img src={Team0City} width={30} />
            </span>
          </Grid>
          <Grid item xs={6} key={1}>
            <span>
              Team 1 <img src={Team1City} width={30} />
            </span>
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
