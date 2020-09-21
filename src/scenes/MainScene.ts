import { LuxMatchState } from '@lux-ai/2020-challenge/lib/types';
import { LuxDesignLogic } from '@lux-ai/2020-challenge/lib/logic';
import { Game } from '@lux-ai/2020-challenge/lib/Game';
import { Resource } from '@lux-ai/2020-challenge/lib/Resource';
import { Unit as LUnit, Worker } from '@lux-ai/2020-challenge/lib/Unit/index';
import replayData from './replay.json';
import { mapCoordsToPixels, mapPosToPixels, memorySizeOf } from './utils';
import { Position } from '@lux-ai/2020-challenge/lib/GameMap/position';

interface Frame {
  resourceData: Array<{
    type: Resource.Types;
    amt: number;
    pos: Position;
  }>;
  unitData: FrameUnitData;
  cityData: FrameCityData;
  cityTileData: FrameCityTileData;
}
type FrameUnitData = Array<{
  pos: Position;
  team: LUnit.TEAM;
  cargo: LUnit.Cargo;
  type: LUnit.Type;
  cooldown: number;
  id: string;
}>;

type FrameCityTileData = Array<{
  pos: Position;
  team: LUnit.TEAM;
  cityid: string;
  tileid: string;
  cooldown: number;
}>;

type FrameCityData = Map<
  string,
  {
    cityTilePositions: Array<Position>;
    fuel: number;
    team: LUnit.TEAM;
  }
>;

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
      debug: false,
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
      key: 'MainScene',
    });
  }

  preload() {
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/desert.json');
    this.load.image('Desert', 'assets/tilemaps/tmw_desert_spacing.png');
    this.load.image('Grass', 'assets/tilemaps/ground_tileset.png');
    this.load.image('worker0', 'assets/sprites/worker0.png');
    this.load.image('worker1', 'assets/sprites/worker1.png');
    this.load.image('cart0', 'assets/sprites/cart0.png');
    this.load.image('cart1', 'assets/sprites/cart1.png');
    this.load.image('player', 'assets/sprites/mushroom.png');
  }

  /**
   * Creates a snapshot of the game state
   * @param game
   */
  createFrame(game: Game): Frame {
    const unitData: FrameUnitData = [];
    [
      ...Array.from(game.getTeamsUnits(LUnit.TEAM.A).values()),
      ...Array.from(game.getTeamsUnits(LUnit.TEAM.B).values()),
    ].forEach((unit) => {
      unitData.push({
        team: unit.team,
        type: unit.type,
        cooldown: unit.cooldown,
        cargo: unit.cargo,
        id: unit.id,
        pos: unit.pos,
      });
    });

    const cityData: FrameCityData = new Map();
    const cityTileData: FrameCityTileData = [];
    game.cities.forEach((city) => {
      cityData.set(city.id, {
        cityTilePositions: city.citycells.map((cell) => cell.pos),
        fuel: city.fuel,
        team: city.team,
      });
      city.citycells.forEach((cell) => {
        const ct = cell.citytile;
        cityTileData.push({
          pos: ct.pos,
          team: ct.team,
          cityid: ct.cityid,
          tileid: ct.getTileID(),
          cooldown: ct.cooldown,
        });
      });
    });
    const resourceData: Array<any> = [];

    game.map.resources.forEach((cell) => {
      // resourceMap
      resourceData.push({
        type: cell.resource.type,
        amt: cell.resource.amount,
        pos: cell.pos,
      });
    });
    return {
      resourceData,
      unitData,
      cityData,
      cityTileData,
    };
  }

  rexUI: any;

  public turn = 0;

  create() {
    const COLOR_PRIMARY = 0x4e342e;
    const COLOR_LIGHT = 0x7b5e57;
    const COLOR_DARK = 0x260e04;
    var turnDisplay = this.add
      .text(20, 600 - 26 / 2, '')
      .setFontSize(26)
      .setColor('#333')
      .setFontFamily('Verdana');

    const valuechangeCallback = (value: number) => {
      this.turn = Math.floor(value * 200);
      turnDisplay.text = 'Turn: ' + this.turn;
      this.renderFrame(this.turn);
    };
    this.rexUI.add
      .slider({
        x: 420,
        y: 605,
        width: 500,
        height: 20,
        orientation: 'x',
        track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 8, COLOR_DARK),
        thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 16, COLOR_LIGHT),
        valuechangeCallback: valuechangeCallback,
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
                this.luxgame.map.addResource(
                  x,
                  y,
                  Resource.Types.WOOD,
                  data.amt
                );
                break;
              case Resource.Types.COAL:
                this.luxgame.map.addResource(
                  x,
                  y,
                  Resource.Types.COAL,
                  data.amt
                );
                break;
              case Resource.Types.URANIUM:
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
    });

    replayData.initialUnits.forEach((unit) => {
      if (unit.type === LUnit.Type.WORKER) {
        const worker = this.luxgame.spawnWorker(
          unit.team,
          unit.x,
          unit.y,
          unit.id
        );
        Worker.globalIdCount++;
      } else {
        const cart = this.luxgame.spawnCart(unit.team, unit.x, unit.y, unit.id);
        Worker.globalIdCount++;
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // load the initial state from replay
    this.pseudomatch.configs.preLoadedGame = this.luxgame;
    LuxDesignLogic.initialize(this.pseudomatch).then(() => {
      this.generateGameFrames().then(() => {
        this.renderFrame(0);
      });
    });
  }

  addResourceTile(type: Resource.Types, x: number, y: number, amt: number) {
    const p = Math.random();
    switch (type) {
      case Resource.Types.WOOD:
        let n = 4;
        if (p > 0.67) {
          n = 5;
        } else if (p > 0.34) {
          n = 6;
        }

        this.dynamicLayer.putTileAt(n, x, y, true);
        break;
      case Resource.Types.COAL:
        this.dynamicLayer.putTileAt(202, x, y, true);
        break;
      case Resource.Types.URANIUM:
        this.dynamicLayer.putTileAt(216, x, y, true);
        break;
    }
  }

  addWorkerSprite(x: number, y: number, team: LUnit.TEAM, id: string) {
    const p = mapCoordsToPixels(x, y);
    const sprite = this.add.sprite(p[0], p[1], 'worker' + team).setScale(1.5);
    this.unitSprites.set(id, sprite);
    return sprite;
  }

  addCartSprite(x: number, y: number, team: LUnit.TEAM, id: string) {
    const p = mapCoordsToPixels(x, y);
    const sprite = this.add.sprite(p[0], p[1], 'cart' + team).setScale(1.5);
    this.unitSprites.set(id, sprite);
    return sprite;
  }

  renderFrame(turn: number) {
    const f = this.frames[turn];
    if (!f) {
      return;
    }
    let visibleUnits: Set<string> = new Set();
    let visibleCityTiles: Set<string> = new Set();
    f.unitData.forEach((data) => {
      const id = data.id;
      const sprite = this.unitSprites.get(id);
      sprite.setVisible(true);
      const p = mapPosToPixels(data.pos);
      sprite.x = p[0];
      sprite.y = p[1];
      visibleUnits.add(id);
    });
    f.cityTileData.forEach((data) => {
      const citytileData = this.dynamicLayer.putTileAt(
        7,
        data.pos.x,
        data.pos.y,
        true
      );
      this.cityTilemapTiles.set(data.tileid, citytileData);
      visibleCityTiles.add(data.tileid);
    });
    this.unitSprites.forEach((sprite, key) => {
      if (!visibleUnits.has(key)) {
        sprite.setVisible(false);
      }
    });
    this.cityTilemapTiles.forEach((tile, key) => {
      if (!visibleCityTiles.has(key)) {
        this.dynamicLayer.removeTileAt(tile.x, tile.y);
      }
    });

    this.frames[0].resourceData.forEach((data) => {
      this.dynamicLayer.removeTileAt(data.pos.x, data.pos.y);
    });
    f.resourceData.forEach((data) => {
      this.addResourceTile(data.type, data.pos.x, data.pos.y, data.amt);
    });
  }

  async generateGameFrames() {
    while (this.currentTurn <= this.luxgame.configs.parameters.MAX_DAYS) {
      const commands = replayData.allCommands[this.currentTurn];
      const state: LuxMatchState = this.pseudomatch.state;
      const game = state.game;

      await LuxDesignLogic.update(this.pseudomatch, commands);

      [
        ...Array.from(game.getTeamsUnits(LUnit.TEAM.A).values()),
        ...Array.from(game.getTeamsUnits(LUnit.TEAM.B).values()),
      ].forEach((unit) => {
        if (this.unitSprites.has(unit.id)) {
          // const sprite = this.unitSprites.get(unit.id);
          // const p = mapPosToPixels(unit.pos);
          // this.tweens.add({
          //   targets: sprite,
          //   x: p[0],
          //   y: p[1],
          //   ease: 'Linear',
          //   duration: 100,
          //   repeat: 0,
          //   yoyo: false,
          // });
        } else {
          if (unit.type === LUnit.Type.WORKER) {
            this.addWorkerSprite(
              unit.pos.x,
              unit.pos.y,
              unit.team,
              unit.id
            ).setVisible(false);
          } else {
            this.addCartSprite(
              unit.pos.x,
              unit.pos.y,
              unit.team,
              unit.id
            ).setVisible(false);
          }
        }
      });

      const frame = this.createFrame(this.pseudomatch.state.game);
      // console.log(
      //   { turn: this.currentTurn },
      //   'frame size',
      //   memorySizeOf(frame)
      // );
      this.frames.push(frame);
      this.currentTurn++;
    }
  }
  update(time: number, delta: number) {}
}

export default TestScene;
