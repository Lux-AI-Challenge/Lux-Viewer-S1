import 'phaser';

import MainScene, { GameCreationConfigs } from '../scenes/MainScene';

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 1280 * 2,
  height: 1280 * 1,
  zoom: 0.5,
  render: {
    pixelArt: false,
  },
  backgroundColor: '#34bdba',
  scene: [],
  // scale: {
  //   mode: Phaser.Scale.ENVELOP,
  //   parent: 'content',
  //   autoCenter: Phaser.Scale.CENTER_VERTICALLY,
  //   // width: 800,
  //   // height: 600,
  // },
};

export const createGame = (configs: GameCreationConfigs): Phaser.Game => {
  const game = new Phaser.Game(config);
  game.scene.add('MainScene', MainScene, true, configs);
  return game;
};
