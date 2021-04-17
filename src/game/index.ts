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
  let max = Math.max(
    document.documentElement.clientHeight,
    document.documentElement.clientWidth
  );
  console.log(max);
  config.height = document.documentElement.clientHeight * 2 - 30;
  config.width = max * 2 - 30;
  const game = new Phaser.Game(config);
  console.log({ config });

  game.scene.add('MainScene', MainScene, true, gameCreationConfigs);
  return game;
};
