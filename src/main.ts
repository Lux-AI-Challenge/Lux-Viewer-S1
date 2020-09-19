import 'phaser';

import TestScene from './scenes/PlayScene';

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
    ]
};

new Phaser.Game(config);
