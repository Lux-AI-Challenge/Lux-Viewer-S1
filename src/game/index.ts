import 'phaser';

import MainScene, { GameCreationConfigs } from '../scenes/MainScene';

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 1280 * 2,
  height: 1280 * 2,
  zoom: 0.5,
  render: {
    pixelArt: false,
  },
  backgroundColor: '#00AFBD',
  scene: [],
};

export const createGame = (
  gameCreationConfigs: GameCreationConfigs
): Phaser.Game => {
  let max = Math.max(window.innerHeight, window.innerWidth);
  config.height = max * 2;
  config.width = max * 2;
  const game = new Phaser.Game(config);

  game.scene.add('MainScene', MainScene, true, gameCreationConfigs);
  return game;
};
