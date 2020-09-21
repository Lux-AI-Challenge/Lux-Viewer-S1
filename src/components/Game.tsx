import 'phaser';
import React, { useEffect } from 'react';
import MainScene, { Frame } from '../scenes/MainScene';
import { createGame } from '../game';
import PlayerStats from './PlayerStats';
import GameStats from './GameStats';
import { Button, CircularProgress, ButtonGroup } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

import Paper from '@material-ui/core/Paper';
import Slider from '@material-ui/core/Slider';
import Grid from '@material-ui/core/Grid';
import './styles.css';
import { LuxMatchConfigs } from '@lux-ai/2020-challenge/lib/types';
import { Unit } from '@lux-ai/2020-challenge/lib/Unit';

export const GameComponent = () => {
  const [isReady, setReady] = React.useState(false);
  const [game, setGame] = React.useState(null);
  const [scene, setScene] = React.useState({
    scenes: [],
  });
  const [main, setMain] = React.useState<MainScene>(null);
  const [configs, setConfigs] = React.useState<LuxMatchConfigs>(null);
  const [sliderConfigs, setSliderConfigs] = React.useState({
    step: 1,
    min: 0,
    max: 1000,
  });
  useEffect(() => {
    const game = createGame('');
    setGame(game);
  }, []);
  useEffect(() => {
    if (game) {
      setScene(game.scene);
    }
  }, [game]);
  useEffect(() => {
    if (scene) {
      if (scene.scenes.length) {
        const main: MainScene = game.scene.scenes[0];
        setMain(main);
        main.events.on('setup', () => {
          console.log(main);
          const configs = main.luxgame.configs;
          setConfigs(configs);

          setSliderConfigs({
            min: 0,
            max: configs.parameters.MAX_DAYS,
            step: 1,
          });

          setReady(true);
        });
      }
    }
  }, [scene.scenes]);
  useEffect(() => {
    if (isReady) {
      moveToTurn(0);
    }
  }, [isReady]);
  const [turn, setTurn] = React.useState(0);
  const [currentFrame, setFrame] = React.useState<Frame>(null);
  const handleChange = (event: any, newValue: number) => {
    moveToTurn(newValue);
  };
  const moveToTurn = (turn: number) => {
    setTurn(turn);
    main.renderFrame(turn);
    setFrame(main.frames[turn]);
  };
  if (isReady) {
  }
  return (
    <div className="Game">
      <div className="gameContainer">
        <h1>Lux AI Challenge</h1>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Card
              className={!isReady ? 'Loading phaser-wrapper' : 'phaser-wrapper'}
            >
              <CardContent>
                {!isReady && <CircularProgress />}
                <div id="content"></div>
                <Slider
                  value={turn}
                  onChange={handleChange}
                  aria-labelledby="continuous-slider"
                  min={sliderConfigs.min}
                  step={sliderConfigs.step}
                  max={sliderConfigs.max}
                />
                <ButtonGroup color="primary">
                  <Button
                    onClick={() => {
                      moveToTurn(turn - 1);
                    }}
                  >
                    {'<'}
                  </Button>
                  <Button
                    onClick={() => {
                      moveToTurn(turn + 1);
                    }}
                  >
                    {'>'}
                  </Button>
                </ButtonGroup>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card className="stats">
              <CardContent>
                <GameStats turn={turn} />
                {currentFrame !== null &&
                  [0, 1].map((team: Unit.TEAM) => {
                    return (
                      <PlayerStats
                        key={team}
                        workerUnits={currentFrame.teamStates[team].workers}
                        cartUnits={currentFrame.teamStates[team].carts}
                        cities={currentFrame.teamStates[team].citiesOwned.map(
                          (id) => {
                            const city = currentFrame.cityData.get(id);
                            return {
                              fuel: city.fuel,
                              cells: city.cityTilePositions.length,
                              cityid: id,
                            };
                          }
                        )}
                        team={team}
                      />
                    );
                  })}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>
      </div>
    </div>
  );
};
