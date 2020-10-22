import 'phaser';
import { GameObjects } from 'phaser';
// import Phaser, { Game, Scene } from 'phaser';
import IsoPlugin from 'phaser3-plugin-isometric';

export class IsoInteractionExample extends Phaser.Scene {
  constructor() {
    super({
      key: 'IsoInteractionExample',
      mapAdd: { isoPlugin: 'iso' },
    });
  }

  preload() {
    this.load.image('tile', 'assets/tile.png');
    this.load.scenePlugin({
      key: 'IsoPlugin',
      url: IsoPlugin,
      sceneKey: 'iso',
    });
  }

  create() {
    //@ts-ignore
    this.isoGroup = this.add.group();
    //@ts-ignore
    this.iso.projector.origin.setTo(0.5, 0.3);

    // Add some tiles to our scene
    this.spawnTiles();
    this.input.on('pointermove', (pointer) => {
      let px = pointer.position.x;
      let py = pointer.position.y;
      let y = Math.round((px - 2 * py + 200) / -76);
      let x = Math.round((px - 200 + 38 * y) / 38);
      const tile = this.tiles.get(x * 16 + y);
      if (tile) {
        if (this.activeTile == null) {
          this.originalTileY = tile.y;
          this.activeTile = tile;
          this.activeTile.setTint(0x86bfda);
          this.activeTile.setY(this.originalTileY - 5);
        } else if (this.activeTile !== tile) {
          this.activeTile.setY(this.originalTileY);
          this.activeTile.clearTint();
          this.originalTileY = tile.y;
          this.activeTile = tile;
          this.activeTile.setTint(0x86bfda);
          this.activeTile.setY(this.originalTileY - 5);
        }
      } else {
        if (this.activeTile) {
          this.activeTile.setY(this.originalTileY);
          this.activeTile.clearTint();
        }
        this.activeTile = null;
      }
    });
  }

  originalTileY: number = 0;
  activeTile: GameObjects.Image = null;
  tiles: Map<number, GameObjects.Image> = new Map();
  spawnTiles() {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        let tile: GameObjects.Image = this.add.image(
          200 + x * 38 - (38 * y) / 1,
          200 + y * 38 + (38 * x) / 1 - ((x + y) * 38) / 2,
          'tile'
        );
        this.tiles.set(x * 16 + y, tile);
      }
    }
    // for (let xx = 0; xx < 256; xx += 38) {
    //   for (let yy = 0; yy < 256; yy += 38) {
    //     //@ts-ignore
    //     //@ts-ignore
    //     let tile: GameObjects.Image = this.add.image(
    //       xx + 200 - yy / 3,
    //       200 + yy + xx / 3,
    //       'tile'
    //     );
    //     tile.setInteractive();

    //     tile.on('pointerover', function () {
    //       this.setTint(0x86bfda);
    //       // this.setX(tile. + 5);
    //       // this.setZ(100);
    //       // this.setY(tile.y - 5);
    //       let x = xx;
    //       let y = yy;
    //       console.log(x, y);
    //     });

    //     tile.on('pointerout', function () {
    //       this.clearTint();
    //       // this.setZ(0);
    //       // this.setY(tile.y + 5);
    //     });
    //   }
    // }
  }
}
