import 'phaser';

import TestScene from './scenes/PlayScene';
// import Demo from './scenes/slider';

import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
//@ts-ignore
// window.dimensions_ai = {
//   MatchWarn: () => {
//     console.error("WARNIING");
//   }
// }

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 320,
    height: 320,
    zoom: 2,
    render: {
      pixelArt: true,
    },
    backgroundColor: "#EDEEC9",
    scene: [
      TestScene
    ],
    plugins: {
      scene: [
          {
              key: 'rexUI',
              plugin: RexUIPlugin,
              mapping: 'rexUI'
          }
      ]
  }
};

const game = new Phaser.Game(config);

