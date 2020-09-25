import { LuxMatchState } from '@lux-ai/2020-challenge/lib/types';
import { LuxDesignLogic } from '@lux-ai/2020-challenge/lib/logic';
import { Game } from '@lux-ai/2020-challenge/lib/Game';
import { Resource } from '@lux-ai/2020-challenge/lib/Resource';
import { Unit as LUnit, Worker } from '@lux-ai/2020-challenge/lib/Unit/index';

import {
  hashMapCoords,
  mapCoordsToPixels,
  mapPosToPixels,
  memorySizeOf,
} from './utils';
import { Position } from '@lux-ai/2020-challenge/lib/GameMap/position';

export interface Frame {
  resourceData: Array<{
    type: Resource.Types;
    amt: number;
    pos: Position;
  }>;
  teamStates: FrameTeamStateData;
  unitData: FrameUnitData;
  cityData: FrameCityData;
  cityTileData: FrameCityTileData;
}

type FrameTeamStateData = {
  [x in LUnit.TEAM]: {
    workers: number;
    carts: number;
    /** array of city ids this team owns */
    citiesOwned: Array<string>;
    researchPoints: number;
  };
};
type FrameUnitData = Map<string, FrameSingleUnitData>;
export interface FrameSingleUnitData {
  pos: Position;
  team: LUnit.TEAM;
  cargo: LUnit.Cargo;
  type: LUnit.Type;
  cooldown: number;
  id: string;
}

type FrameCityTileData = Array<{
  pos: Position;
  team: LUnit.TEAM;
  cityid: string;
  tileid: string;
  cooldown: number;
}>;

export type FrameCityData = Map<
  string,
  {
    cityTilePositions: Array<Position>;
    fuel: number;
    team: LUnit.TEAM;
  }
>;

export type GameCreationConfigs = {
  replayData: object;
  handleUnitClicked: HandleUnitClicked;
  handleTileClicked: HandleTileClicked;
};

type HandleUnitClicked = (unit: FrameSingleUnitData) => void;
export type FrameTileData = {
  pos: Position;
  units: Map<string, FrameSingleUnitData>;
  cityTile: FrameCityTileData;
};
type HandleTileClicked = (data: FrameTileData) => void;

class MainScene extends Phaser.Scene {
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

  map: Phaser.Tilemaps.Tilemap;

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
    console.log('{PRE');
  }

  private onTileClicked(v: Position) {
    const f = this.frames[this.turn];
    const unitDataAtXY: FrameUnitData = new Map();
    const cityTile: FrameCityTileData = [];
    f.unitData.forEach((unit) => {
      if (unit.pos.x === v.x && unit.pos.y === v.y) {
        unitDataAtXY.set(unit.id, unit);
      }
    });
    f.cityTileData.forEach((ct) => {
      if (ct.pos.x === v.x && ct.pos.y === v.y) {
        cityTile.push(ct);
      }
    });
    const clickedPos = new Position(v.x, v.y);
    this.handleTileClicked({
      pos: clickedPos,
      units: unitDataAtXY,
      cityTile: cityTile,
    });
    this.currentSelectedTilePos = clickedPos;
  }

  loadReplayData(replayData: any): void {
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
    this.map = this.make.tilemap({
      data: level,
      tileWidth: 16,
      tileHeight: 16,
    });
    const tileset: Phaser.Tilemaps.Tileset = this.map.addTilesetImage('Grass');
    this.map.createStaticLayer(0, tileset, 0, 0).setScale(2);
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (d: { worldX: number; worldY: number }) => {
        const v = this.map.worldToTileXY(d.worldX, d.worldY);
        this.onTileClicked(new Position(v.x, v.y));
      }
    );
    this.dynamicLayer = this.map
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
      this.luxgame.spawnCityTile(ct.team, ct.x, ct.y);
    });
    replayData.initialUnits.forEach((unit) => {
      if (unit.type === LUnit.Type.WORKER) {
        const worker = this.luxgame.spawnWorker(
          unit.team,
          unit.x,
          unit.y,
          unit.id
        );
      } else {
        this.luxgame.spawnCart(unit.team, unit.x, unit.y, unit.id);
      }
    });

    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    // load the initial state from replay
    this.pseudomatch.configs.preLoadedGame = this.luxgame;
    setTimeout(() => {
      LuxDesignLogic.initialize(this.pseudomatch).then(() => {
        this.generateGameFrames(replayData).then(() => {
          this.renderFrame(0);
          // this.events.emit('setup');
          this.game.events.emit('setup');
        });
      });
    }, 1000);
  }

  /**
   * Creates a snapshot of the game state
   * @param game
   */
  createFrame(game: Game): Frame {
    const teamStates: FrameTeamStateData = {
      [LUnit.TEAM.A]: {
        workers: 0,
        carts: 0,
        citiesOwned: [],
        researchPoints: game.state.teamStates[0].researchPoints,
      },
      [LUnit.TEAM.B]: {
        workers: 0,
        carts: 0,
        citiesOwned: [],
        researchPoints: game.state.teamStates[1].researchPoints,
      },
    };
    const teams = [LUnit.TEAM.A, LUnit.TEAM.B];
    for (const team of teams) {
      game.getTeamsUnits(team).forEach((unit) => {
        if (unit.type === LUnit.Type.WORKER) {
          teamStates[team].workers++;
        } else {
          teamStates[team].carts++;
        }
      });
    }

    const unitData: FrameUnitData = new Map();
    [
      ...Array.from(game.getTeamsUnits(LUnit.TEAM.A).values()),
      ...Array.from(game.getTeamsUnits(LUnit.TEAM.B).values()),
    ].forEach((unit) => {
      unitData.set(unit.id, {
        team: unit.team,
        type: unit.type,
        cooldown: unit.cooldown,
        cargo: { ...unit.cargo },
        id: unit.id,
        pos: unit.pos,
      });
    });

    const cityData: FrameCityData = new Map();
    const cityTileData: FrameCityTileData = [];
    game.cities.forEach((city) => {
      teamStates[city.team].citiesOwned.push(city.id);
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
      teamStates,
    };
  }

  public turn = 0;

  public handleUnitClicked: HandleUnitClicked;
  public handleTileClicked: HandleTileClicked;

  public currentSelectedTilePos: Position = null;

  create(configs: GameCreationConfigs) {
    this.loadReplayData(configs.replayData);
    this.handleUnitClicked = configs.handleUnitClicked;
    this.handleTileClicked = configs.handleTileClicked;
    this.events.emit('created');
  }

  addResourceTile(type: Resource.Types, x: number, y: number, amt: number) {
    switch (type) {
      case Resource.Types.WOOD:
        this.dynamicLayer.putTileAt(5, x, y, true);
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
    this.turn = turn;
    const f = this.frames[turn];
    if (!f) {
      return;
    }

    let visibleUnits: Set<string> = new Set();
    let visibleCityTiles: Set<number> = new Set();
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
      visibleCityTiles.add(
        hashMapCoords(data.pos, this.pseudomatch.state.game.map)
      );
    });
    this.unitSprites.forEach((sprite, key) => {
      if (!visibleUnits.has(key)) {
        sprite.setVisible(false);
      }
    });
    this.cityTilemapTiles.forEach((tile, key) => {
      if (
        !visibleCityTiles.has(
          hashMapCoords(
            new Position(tile.x, tile.y),
            this.pseudomatch.state.game.map
          )
        )
      ) {
        this.dynamicLayer.removeTileAt(tile.x, tile.y);
      }
    });

    this.frames[0].resourceData.forEach((data) => {
      if (
        visibleCityTiles.has(
          hashMapCoords(data.pos, this.pseudomatch.state.game.map)
        )
      ) {
        return;
      }
      this.dynamicLayer.removeTileAt(data.pos.x, data.pos.y);
    });
    f.resourceData.forEach((data) => {
      this.addResourceTile(data.type, data.pos.x, data.pos.y, data.amt);
    });

    if (this.currentSelectedTilePos !== null) {
      this.onTileClicked(this.currentSelectedTilePos);
    }
  }

  async generateGameFrames(replayData) {
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

export default MainScene;
