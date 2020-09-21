import 'phaser';

import MainScene from './scenes/MainScene';
// import Demo from './scenes/slider';

import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
//@ts-ignore
// window.dimensions_ai = {
//   MatchWarn: () => {
//     console.error("WARNIING");
//   }
// }

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 1280,
  height: 640,
  zoom: 1,
  render: {
    pixelArt: true,
  },
  backgroundColor: '#EDEEC9',
  scene: [MainScene],
  plugins: {
    scene: [
      {
        key: 'rexUI',
        plugin: RexUIPlugin,
        mapping: 'rexUI',
      },
    ],
  },
};
