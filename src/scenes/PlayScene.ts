import { LuxMatchState } from '@lux-ai/2020-challenge/lib/types';
import { LuxDesignLogic } from '@lux-ai/2020-challenge/lib/logic';
import { Game } from '@lux-ai/2020-challenge/lib/Game';
import { Resource } from '@lux-ai/2020-challenge/lib/Resource';
import { Unit as LUnit } from '@lux-ai/2020-challenge/lib/Unit/index';
import replayData from './replay.json';
import { mapCoordsToPixels, mapPosToPixels } from './utils';

interface Frame {
  visibleUnits: Set<string>;
  visibleCityTiles: Set<string>;
}

class TestScene extends Phaser.Scene {
  player: Phaser.GameObjects.Sprite;
  cursors: any;

  workers: Array<Phaser.GameObjects.Sprite> = [];
  luxgame: Game;

  unitSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  cityTilemapTiles: Map<string, Phaser.Tilemaps.Tile> = new Map();

  currentTurn = 0;

  dynamicLayer: Phaser.Tilemaps.DynamicTilemapLayer;

  frames: Array<Frame> = [];

  pseudomatch: any = {
    state: {},
    configs: {
      storeReplay: false,
    },
    throw: () => {},
    sendAll: () => {},
    send: () => {},
    log: {
      detail: () => {},
    },
    agents: [],
  };

  constructor() {
    super({
      key: 'TestScene',
    });
  }

  preload() {
    this.load.tilemapTiledJSON('map', '/assets/tilemaps/desert.json');
    this.load.image('Desert', '/assets/tilemaps/tmw_desert_spacing.png');
    this.load.image('Grass', '/assets/tilemaps/ground_tileset.png');
    this.load.image('worker0', '/assets/sprites/worker0.png');
    this.load.image('worker1', '/assets/sprites/worker1.png');
    this.load.image('cart0', '/assets/sprites/cart0.png');
    this.load.image('cart1', '/assets/sprites/cart1.png');
    this.load.image('player', '/assets/sprites/mushroom.png');
  }

  createFrame(game: Game): Frame {
    const unitsVisible: Set<string> = new Set();
    [
      ...Array.from(game.getTeamsUnits(LUnit.TEAM.A).values()),
      ...Array.from(game.getTeamsUnits(LUnit.TEAM.B).values()),
    ].forEach((unit) => {
      unitsVisible.add(unit.id);
    });
    const cityTilesVisible: Set<string> = new Set();
    game.cities.forEach((city) => {
      city.citycells.forEach((cell) => {
        const ct = cell.citytile;
        cityTilesVisible.add(ct.getTileID());
      });
    });
    return {
      visibleUnits: unitsVisible,
      visibleCityTiles: cityTilesVisible,
    };
  }

  rexUI: any;

  public turn = 0;

  create() {
    const COLOR_PRIMARY = 0x4e342e;
    const COLOR_LIGHT = 0x7b5e57;
    const COLOR_DARK = 0x260e04;
    var turnDisplay = this.add.text(20, 600 - 26 / 2, '').setFontSize(26);
    this.rexUI.add
      .slider({
        x: 340,
        y: 600,
        width: 300,
        height: 20,
        orientation: 'x',
        track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 8, COLOR_DARK),
        thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 16, COLOR_LIGHT),
        valuechangeCallback: function (value: number) {
          this.turn = Math.floor(value * 200);
          turnDisplay.text = 'Turn: ' + this.turn;
        },
        space: {
          top: 4,
          bottom: 4,
        },
        input: 'drag', // 'drag'|'click'
      })
      .layout();
    this.luxgame = new Game();
    let width = replayData.map[0].length;
    let height = replayData.map.length;
    const level = [];
    // generate the ground
    for (let y = 0; y < height; y++) {
      level.push(
        replayData.map[y].map((data) => {
          if (data.resource == null) {
            let p = Math.random();
            if (p > 0.7) return 2;
            else return 3;
          } else {
            return 3;
          }
        })
      );
    }
    let map = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16 });
    var tileset: Phaser.Tilemaps.Tileset = map.addTilesetImage('Grass');
    map.createStaticLayer(0, tileset, 0, 0).setScale(2);
    this.dynamicLayer = map
      .createBlankDynamicLayer('resources', tileset)
      .setScale(2);

    for (let y = 0; y < height; y++) {
      level.push(
        replayData.map[y].map((data, x) => {
          if (data.resource !== null) {
            let p = Math.random();
            switch (data.resource) {
              case Resource.Types.WOOD:
                let n = 4;
                if (p > 0.67) {
                  n = 5;
                } else if (p > 0.34) {
                  n = 6;
                }
                this.dynamicLayer.putTileAt(n, x, y, true);
                this.luxgame.map.addResource(
                  x,
                  y,
                  Resource.Types.WOOD,
                  data.amt
                );
                break;
              case Resource.Types.COAL:
                this.dynamicLayer.putTileAt(202, x, y, true);
                this.luxgame.map.addResource(
                  x,
                  y,
                  Resource.Types.COAL,
                  data.amt
                );
                break;
              case Resource.Types.URANIUM:
                this.dynamicLayer.putTileAt(216, x, y, true);
                this.luxgame.map.addResource(
                  x,
                  y,
                  Resource.Types.URANIUM,
                  data.amt
                );
                break;
            }
          }
        })
      );
    }

    replayData.initialCityTiles.forEach((ct) => {
      let p = Math.random();
      let n = 7;
      if (p > 0.67) {
        n = 8;
      } else if (p > 0.34) {
        n = 9;
      }
      const citytile = this.luxgame.spawnCityTile(ct.team, ct.x, ct.y);
      const citytileData = this.dynamicLayer.putTileAt(n, ct.x, ct.y, true);
      this.cityTilemapTiles.set(citytile.getTileID(), citytileData);
    });

    replayData.initialUnits.forEach((unit) => {
      if (unit.type === LUnit.Type.WORKER) {
        const worker = this.luxgame.spawnWorker(
          unit.team,
          unit.x,
          unit.y,
          unit.id
        );
        this.addWorkerSprite(unit.x, unit.y, unit.team, worker.id);
      } else {
        const cart = this.luxgame.spawnCart(unit.team, unit.x, unit.y, unit.id);
        this.addCartSprite(unit.x, unit.y, unit.team, cart.id);
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // load the initial state from replay
    this.pseudomatch.configs.preLoadedGame = this.luxgame;
    LuxDesignLogic.initialize(this.pseudomatch);

    // create initial frame
    const frame = this.createFrame(this.luxgame);
    this.frames.push(frame);
  }

  addWorkerSprite(x: number, y: number, team: LUnit.TEAM, id: string) {
    const p = mapCoordsToPixels(x, y);
    const sprite = this.add.sprite(p[0], p[1], 'worker' + team).setScale(1.5);
    this.unitSprites.set(id, sprite);
  }

  addCartSprite(x: number, y: number, team: LUnit.TEAM, id: string) {
    const p = mapCoordsToPixels(x, y);
    const sprite = this.add.sprite(p[0], p[1], 'cart' + team).setScale(1.5);
    this.unitSprites.set(id, sprite);
  }

  update(time: number, delta: number) {
    if (this.currentTurn >= 100) {
      return;
    }
    if (time > (this.currentTurn - 1) * 250 + 200) {
      const frame = this.frames[this.frames.length - 1];
      this.unitSprites.forEach((_, key) => {
        if (
          !frame.visibleUnits.has(key) &&
          this.unitSprites.get(key).alpha > 0
        ) {
          console.log('gone', key);
          this.tweens.add({
            targets: this.unitSprites.get(key),
            alpha: 0,
            ease: 'Easeout',
            duration: 300,
            repeat: 0,
            yoyo: false,
          });
        }
      });

      this.cityTilemapTiles.forEach((tile, key) => {
        if (!frame.visibleCityTiles.has(key)) {
          tile.setVisible(false);
        }
      });
    }
    if (time > this.currentTurn * 250) {
      // console.log(time);
      const commands = replayData.allCommands[this.currentTurn];
      const state: LuxMatchState = this.pseudomatch.state;
      const game = state.game;
      console.log(this.currentTurn);
      LuxDesignLogic.update(this.pseudomatch, commands);

      // render units
      const unitsVisible: Set<string> = new Set();
      [
        ...Array.from(game.getTeamsUnits(LUnit.TEAM.A).values()),
        ...Array.from(game.getTeamsUnits(LUnit.TEAM.B).values()),
      ].forEach((unit) => {
        // unitsVisible.add(unit.id);
        if (this.unitSprites.has(unit.id)) {
          const sprite = this.unitSprites.get(unit.id);
          const p = mapPosToPixels(unit.pos);
          this.tweens.add({
            targets: sprite,
            x: p[0],
            y: p[1],
            ease: 'Linear',
            duration: 100,
            repeat: 0,
            yoyo: false,
          });
        } else {
          if (unit.type === LUnit.Type.WORKER) {
            this.addWorkerSprite(unit.pos.x, unit.pos.y, unit.team, unit.id);
          } else {
            this.addCartSprite(unit.pos.x, unit.pos.y, unit.team, unit.id);
          }
        }
      });

      // render cities
      const cityTilesVisible: Set<string> = new Set();
      game.cities.forEach((city) => {
        city.citycells.forEach((cell) => {
          const ct = cell.citytile;
          // cityTilesVisible.add(ct.getTileID());
          if (this.cityTilemapTiles.has(ct.getTileID())) {
          } else {
            let p = Math.random();
            let n = 7;
            if (p > 0.67) {
              n = 8;
            } else if (p > 0.34) {
              n = 9;
            }
            const citytileData = this.dynamicLayer.putTileAt(
              n,
              ct.pos.x,
              ct.pos.y,
              true
            );
            this.cityTilemapTiles.set(ct.getTileID(), citytileData);
          }
        });
      });

      const frame = this.createFrame(this.pseudomatch.state.game);
      this.frames.push(frame);
      this.currentTurn++;
    }
  }
}

export default TestScene;
