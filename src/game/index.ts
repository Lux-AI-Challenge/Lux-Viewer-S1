import 'phaser';

import MainScene, { GameCreationConfigs } from '../scenes/MainScene';

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 1280 * 2,
  height: 1280 * 2,
  zoom: 1,
  render: {
    pixelArt: false,
    transparent: true,
    antialias: true,
  },
  scene: [],
};

export const createGame = (
  gameCreationConfigs: GameCreationConfigs
): Phaser.Game => {
  let max = Math.max(
    document.documentElement.clientHeight,
    document.documentElement.clientWidth
  );
  console.log(max);
  let zoom = gameCreationConfigs.zoom;
  config.zoom = zoom;
  config.height = document.documentElement.clientHeight * (1 / zoom); // - 30;
  config.width = max * (1 / zoom); // - 30;
  const game = new Phaser.Game(config);
  console.log({ config });

  game.scene.add('MainScene', MainScene, true, gameCreationConfigs);
  return game;
};
