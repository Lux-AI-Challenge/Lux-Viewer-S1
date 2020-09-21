import 'phaser';

import MainScene from '../scenes/MainScene';

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 640,
  height: 640,
  zoom: 1,
  render: {
    pixelArt: true,
  },
  backgroundColor: '#EDEEC9',
  scene: [],
  // scale: {
  //   mode: Phaser.Scale.ENVELOP,
  //   parent: 'content',
  //   autoCenter: Phaser.Scale.CENTER_VERTICALLY,
  //   // width: 800,
  //   // height: 600,
  // },
};

export const createGame = (replayData: Object): Phaser.Game => {
  const game = new Phaser.Game(config);
  game.scene.add('MainScene', MainScene, true, { replayData });
  return game;
};
