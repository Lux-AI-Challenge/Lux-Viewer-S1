import 'phaser';
import React, { useEffect } from 'react';
import { config } from './main';
import { Button } from '@material-ui/core';
import Slider from '@material-ui/core/Slider';

export const GameComponent = () => {
  const [game, setGame] = React.useState(null);
  const [scene, setScene] = React.useState(null);
  const [main, setMain] = React.useState(null);
  useEffect(() => {
    const game = new Phaser.Game(config);
    setGame(game);
  }, []);
  useEffect(() => {
    if (game) {
      console.log(game);
      setScene(game.scene);
    }
  }, [game]);
  useEffect(() => {
    if (scene) {
      console.log(scene);
      if (scene.scenes.length) {
        const main = game.scene.scenes[0];
        console.log(main, game.scene.scenes);
        setMain(main);
      }
    }
  }, [scene]);
  const [value, setValue] = React.useState(30);
  const handleChange = (event, newValue) => {
    setValue(newValue);
    main.renderFrame(newValue);
  };
  return (
    <div>
      <h1>Phaser Game</h1>
      <div id="content"></div>
      <Slider
        value={value}
        onChange={handleChange}
        aria-labelledby="continuous-slider"
      />
      <Button>Button</Button>
    </div>
  );
};
