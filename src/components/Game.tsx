import 'phaser';
import React, { useEffect } from 'react';
import MainScene from '../scenes/MainScene';
import { createGame } from '../game';
import { Button, CircularProgress, ButtonGroup } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

import Paper from '@material-ui/core/Paper';
import Slider from '@material-ui/core/Slider';
import Grid from '@material-ui/core/Grid';
import './styles.css';
import { LuxMatchConfigs } from '@lux-ai/2020-challenge/lib/types';

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
  const [turn, setTurn] = React.useState(0);
  const handleChange = (event, newValue) => {
    moveToTurn(newValue);
  };
  const moveToTurn = (turn) => {
    setTurn(turn);
    main.renderFrame(turn);
  };
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
            Turn: {turn}
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>
      </div>
    </div>
  );
};
