import { Unit } from '@lux-ai/2020-challenge/lib/Unit';
import { Card, CardContent, Divider, Grid } from '@material-ui/core';
import React from 'react';
import './styles.css';
export type PlayerStatsProps = {
  team: Unit.TEAM;
  workerUnits: number;
  cartUnits: number;
  cities: Array<{
    cityid: string;
    cells: number;
    fuel: number;
  }>;
};
const PlayerStats = ({
  team,
  workerUnits,
  cartUnits,
  cities,
}: PlayerStatsProps) => {
  return (
    <div className="PlayerStats">
      <h3>Team {team} Stats</h3>
      <p>Workers: {workerUnits}</p>
      <p>Carts: {cartUnits}</p>
      <Grid className={`Cities team_${team}`}>
        {cities.map((city) => {
          return (
            <Grid item xs={3} key={city.cityid}>
              <Card className="card">
                <div className="accent"></div>
                <CardContent>
                  <p>ID: {city.cityid}</p>
                  <p>Size: {city.cells}</p>
                  <p>Light: {city.fuel}</p>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Divider />
    </div>
  );
};
export default PlayerStats;
