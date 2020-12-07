import React, { useState } from 'react';
import LuxCard from '../LuxCard';
import { Frame, FrameTeamStateData } from '../../scenes/MainScene';
import './styles.css';
import { Unit } from '@lux-ai/2020-challenge/lib/es6';
const GlobalStats = ({ currentFrame }: { currentFrame: Frame }) => {
  // .teamStates[team].citiesOwned.map(
  //     (id) => {
  //       const city = currentFrame.cityData.get(id);
  //       return {
  //         fuel: city.fuel,
  //         cells: city.cityTilePositions.length,
  //         cityid: id,
  //       };
  //     }
  //   )}
  // const [teamStates, setTeamStates] = useState(null);
  // if (currentFrame) {
  //   setTeamStates(currentFrame.teamStates);
  // }
  return (
    <div className="GlobalStats">
      <LuxCard title="Global Stats">
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
