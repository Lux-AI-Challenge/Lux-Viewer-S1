import { LuxMatchState } from '@lux-ai/2021-challenge/lib/es6/types';
import { LuxDesignLogic } from '@lux-ai/2021-challenge/lib/es6/logic';
import { Game } from '@lux-ai/2021-challenge/lib/es6/Game';
import { Resource } from '@lux-ai/2021-challenge/lib/es6/Resource';
import { Unit as LUnit } from '@lux-ai/2021-challenge/lib/es6/Unit/index';

import {
  getDepthByPos,
  getRoadType,
  hashMapCoords,
  mapCoordsToIsometricPixels,
  mapIsometricPixelsToPosition,
  mapPosToIsometricPixels,
} from './utils';
import { Position } from '@lux-ai/2021-challenge/lib/es6/GameMap/position';
import { GameObjects } from 'phaser';
import seedrandom from 'seedrandom';
import {
  TEAM_A_COLOR,
  TEAM_A_COLOR_STR,
  TEAM_B_COLOR,
  TEAM_B_COLOR_STR,
} from './types';
import { Cell } from '@lux-ai/2021-challenge/lib/es6/GameMap/cell';

type CommandsArray = Array<{
  command: string;
  agentID: number;
}>;

export interface Frame {
  // map from hashed position to resource data
  resourceData: Map<
    number,
    {
      type: Resource.Types;
      amt: number;
      pos: Position;
    }
  >;
  roadLevels: number[][];
  teamStates: FrameTeamStateData;
  unitData: FrameUnitData;
  cityData: FrameCityData;
  cityTileData: FrameCityTileData;
  annotations: CommandsArray;
  errors: string[];
}

export type FrameTeamStateData = {
  [x in LUnit.TEAM]: {
    workers: number;
    carts: number;
    /** array of city ids this team owns */
    citiesOwned: Array<string>;
    researchPoints: number;
    statistics: {
      fuelGenerated: number;
      resourcesCollected: {
        [x in Resource.Types]: number;
      };
    };
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
  commands: Array<{ turn: number; actions: string[] }>;
}

export type FrameCityTileData = Array<FrameSingleCityTileData>;

export type FrameSingleCityTileData = {
  pos: Position;
  team: LUnit.TEAM;
  cityid: string;
  tileid: string;
  cooldown: number;
};

export type FrameCityData = Map<string, FrameSingleCityData>;
export type FrameSingleCityData = {
  cityTilePositions: Array<Position>;
  fuel: number;
  team: LUnit.TEAM;
  upkeep: number;
};

export type GameCreationConfigs = {
  replayData: object;
  handleUnitClicked: HandleUnitClicked;
  handleTileClicked: HandleTileClicked;
  zoom: number;
};

type HandleUnitClicked = (unit: FrameSingleUnitData) => void;
export type FrameTileData = {
  pos: Position;
  units: Map<string, FrameSingleUnitData>;
  cityTile: FrameCityTileData;
  roadLevel: number;
  resources: {
    type: Resource.Types;
    amt: number;
  };
  turn: number;
};
type HandleTileClicked = (data: FrameTileData) => void;

export interface StaticGlobalStats {
  totalResources: {
    wood: number;
    coal: number;
    uranium: number;
  };
}

export interface TurnStats {
  citiesOwned: {
    [x in LUnit.TEAM]: number;
  };
  totalFuelGenerated: {
    [x in LUnit.TEAM]: number;
  };
  researchPoints: {
    [x in LUnit.TEAM]: number;
  };
}

class MainScene extends Phaser.Scene {
  player: Phaser.GameObjects.Sprite;
  cursors: any;

  globalStats: StaticGlobalStats = {
    totalResources: {
      wood: 0,
      coal: 0,
      uranium: 0,
    },
  };
  workers: Array<Phaser.GameObjects.Sprite> = [];
  luxgame: Game;

  graphics: Phaser.GameObjects.Graphics;

  // All unit sprites rendered throughout match
  unitSprites: Map<
    string,
    { sprite: Phaser.GameObjects.Sprite; originalPosition: Position }
  > = new Map();

  cityTilemapTiles: Map<string, Phaser.Tilemaps.Tile> = new Map();

  currentTurn = 0;

  dynamicLayer: Phaser.Tilemaps.DynamicTilemapLayer;

  frames: Array<Frame> = [];

  /** To allow dimensions to run a match */
  pseudomatch: any = {
    state: {},
    configs: {
      storeReplay: false,
      storeReplayDirectory: '/',
      runProfiler: false,
      debug: false,
      seed: undefined,
    },
    throw: (id: number, err: any) => {
      this.currentTurnErrors.push(`Team ${id} - ${err}`);
    },
    sendAll: () => {},
    send: () => {},
    log: {
      detail: () => {},
      warn: (m: string) => {
        this.currentTurnErrors.push(m);
      },
    },
    agents: [],
  };

  currentTurnErrors: Array<string> = [];

  map: Phaser.Tilemaps.Tilemap;
  floorImageTiles: Map<number, GameObjects.Image> = new Map();

  activeImageTile: GameObjects.Image = null;
  originalTileY = 0;

  hoverImageTile: GameObjects.Image = null;
  originalHoverImageTileY = 0;

  /** Overall zoom of replayer */
  overallScale = 1;

  /** relative scales for each of these svgs */
  defaultScales = {
    city: 0.4,
    tree: 0.6,
    worker: 0.16,
    cart: 0.6,
    block: 0.44,
    tree0: 0.3,
    tree1: 0.33,
    uranium: 0.43,
    clouds: 0.7,
    road: 0.44,
    coal: 0.35,
  };

  /** playback speed */
  speed = 1;

  /** debug mode on or off */
  debug = true;

  /** accumulated stats generated by viewer */
  accumulatedStats: Array<TurnStats> = [];

  constructor() {
    super({
      key: 'MainScene',
    });
  }

  preload() {
    let base = 'assets';
    // @ts-ignore;
    if (window.kaggle) {
      console.log('Loading assets from unpkg');
      // base = 'https://2021vis.lux-ai.org/assets';
      base = 'https://unpkg.com/lux-viewer-2021@latest/dist/assets';
    }
    this.load.image('worker0', `${base}/sprites/worker0w.svg`);
    this.load.image('worker1', `${base}/sprites/worker1w.svg`);
    this.load.image('cart0', `${base}/sprites/carts/cart0e.svg`);
    this.load.image('cart1', `${base}/sprites/carts/cart1e.svg`);

    this.load.svg('block1', `${base}/ground.svg`);

    // generate 15 binary values 0001 to 1111 and load the path tiles
    for (let i = 1; i <= 15; i++) {
      let str = i.toString(2);
      // pad if necessary
      if (str.length < 4) {
        let a = str.length;
        for (let j = 0; j < 4 - a; j++) {
          str = '0' + str;
        }
      }
      this.load.svg(`path${str}`, `${base}/sprites/paths/path${str}.svg`);
    }
    this.load.svg(`path0000`, `${base}/sprites/paths/path1111.svg`);

    this.load.svg('tree1', `${base}/sprites/tree1.svg`);
    this.load.svg('tree0', `${base}/sprites/tree0.svg`);
    // city naming scheme
    // city<team><variant><transparent? t : ''><night? night : ''>
    const cityenums = ['00', '01', '02', '03', '10', '11', '12', '13'];
    for (const v of cityenums) {
      this.load.svg(`city${v}`, `${base}/sprites/city${v}.svg`);
      this.load.svg(`city${v}night`, `${base}/sprites/city${v}night.svg`);
      if (v[1] === '2' || v[1] === '3') {
        // load transparent versions
        this.load.svg(`city${v}t`, `${base}/sprites/city${v}t.svg`);
        this.load.svg(`city${v}tnight`, `${base}/sprites/city${v}tnight.svg`);
      }
    }

    this.load.image('coal', `${base}/sprites/coal.svg`);
    this.load.svg('uranium', `${base}/sprites/uranium.svg`);

    this.load.svg('cloud0', `${base}/sprites/cloud0.svg`);
    this.load.svg('cloud1', `${base}/sprites/cloud1.svg`);
    this.load.svg('cloud2', `${base}/sprites/cloud2.svg`);
  }

  /**
   * Handle when a tile is clicked
   */
  private onTileClicked(v: Position) {
    const f = this.frames[this.turn];
    const unitDataAtXY: FrameUnitData = new Map();
    const cityTile: FrameCityTileData = [];

    // TODO: can be slow if we iterate entire unit list
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
    const resourceAtXY = f.resourceData.get(hashMapCoords(v));
    const clickedPos = new Position(v.x, v.y);
    this.handleTileClicked({
      pos: clickedPos,
      units: unitDataAtXY,
      cityTile: cityTile,
      resources: resourceAtXY,
      roadLevel: f.roadLevels[v.y] ? f.roadLevels[v.y][v.x] : undefined,
      turn: this.turn,
    });
    this.currentSelectedTilePos = clickedPos;
  }

  mapWidth: number = -1;
  mapHeight: number = -1;

  /**
   * Load replay data into game
   * and generate all relevant frames
   */
  async loadReplayData(replayData: any): Promise<void> {
    this.pseudomatch.configs.seed = replayData.seed;
    this.pseudomatch.configs.mapType = replayData.mapType;
    this.pseudomatch.configs.width = replayData.width;
    this.pseudomatch.configs.height = replayData.height;

    // use design to initialize "fake game"
    await LuxDesignLogic.initialize(this.pseudomatch);

    this.luxgame = this.pseudomatch.state.game;
    let width = this.luxgame.map.width;
    let height = this.luxgame.map.height;
    this.graphics = this.add.graphics({ x: 0, y: 0 });
    this.mapWidth = width;
    this.mapHeight = height;

    for (let y = 0; y < height; y++) {
      let row = this.luxgame.map.getRow(y);
      row.forEach((cell) => {
        const img = this.addNormalFloorTile(cell.pos);
        this.floorImageTiles.set(
          hashMapCoords(new Position(cell.pos.x, cell.pos.y)),
          img
        );
        if (cell.hasResource()) {
          this.globalStats.totalResources[cell.resource.type] +=
            cell.resource.amount;
        }
      });
    }

    // add handler for clicking tiles
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (d: { worldX: number; worldY: number }) => {
        const pos = mapIsometricPixelsToPosition(d.worldX, d.worldY, {
          scale: this.overallScale,
          width: this.mapWidth,
          height: this.mapHeight,
        });
        const imageTile = this.floorImageTiles.get(hashMapCoords(pos));
        if (imageTile) {
          if (this.activeImageTile == null) {
            this.originalTileY = imageTile.y;
            this.activeImageTile = imageTile;
            this.activeImageTile.setTint(0x86bfda);
            this.activeImageTile.setY(
              this.originalTileY - 15 * this.overallScale
            );
          } else if (this.activeImageTile !== imageTile) {
            this.activeImageTile.setY(this.originalTileY);
            this.activeImageTile.clearTint();
            this.originalTileY = imageTile.y;
            this.activeImageTile = imageTile;
            this.activeImageTile.setTint(0x86bfda);
            this.activeImageTile.setY(
              this.originalTileY - 15 * this.overallScale
            );
          }
        } else {
          if (this.activeImageTile) {
            this.activeImageTile.setY(this.originalTileY);
            this.activeImageTile.clearTint();
          }
          this.activeImageTile = null;
        }
        this.onTileClicked(pos);
      }
    );

    // add handler for moving cursor around isometric map
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer) => {
      let px = pointer.worldX;
      let py = pointer.worldY;
      const pos = mapIsometricPixelsToPosition(px, py, {
        scale: this.overallScale,
        width: this.mapWidth,
        height: this.mapHeight,
      });
      const imageTile = this.floorImageTiles.get(hashMapCoords(pos));
      if (imageTile) {
        if (this.hoverImageTile == null) {
          this.originalHoverImageTileY = imageTile.y;
          this.hoverImageTile = imageTile;
          this.hoverImageTile.setTint(0x86bfda);
        } else if (this.hoverImageTile !== imageTile) {
          if (this.activeImageTile != this.hoverImageTile) {
            this.hoverImageTile.clearTint();
          }
          this.originalHoverImageTileY = imageTile.y;
          this.hoverImageTile = imageTile;
          this.hoverImageTile.setTint(0x86bfda);
        }
      } else {
        if (this.hoverImageTile) {
          this.hoverImageTile.setY(this.originalHoverImageTileY);
          this.hoverImageTile.clearTint();
        }
        this.hoverImageTile = null;
      }
    });

    // spawn in clouds
    const map_edge_cloud_tolerance = -2;
    for (let x = -100; x < 100; x += 9) {
      for (let y = -100; y < 100; y += 9) {
        if (
          x < this.mapWidth - map_edge_cloud_tolerance &&
          x > map_edge_cloud_tolerance &&
          y < this.mapHeight - map_edge_cloud_tolerance &&
          y > map_edge_cloud_tolerance
        ) {
          continue;
        }
        const s = seedrandom('' + x * 10e5 + y);
        let cloudtype = 'cloud';
        const p = s();
        if (p < 0.33) {
          cloudtype += '0';
        } else if (p < 0.66) {
          cloudtype += '1';
        } else {
          cloudtype += '2';
        }
        const pos = new Position(x + s() * 5 - 2.5, y + s() * 5 - 2.5);
        const isopos = mapPosToIsometricPixels(pos, {
          scale: this.overallScale,
          width: this.mapWidth,
          height: this.mapHeight,
        });
        const cloud = this.add
          .sprite(isopos[0], isopos[1], cloudtype)
          .setDepth(10e5)
          .setScale(this.overallScale * this.defaultScales.clouds);
        this.cloudSprites.push({ cloud, pos });
      }
    }

    this.generateGameFrames(replayData).then(() => {
      this.renderFrame(0);
      this.game.events.emit('setup');
      this.cameras.main.centerOnX(0);
      this.cameras.main.centerOnY(0);
      this.moveCamera(0, 0);
    });
  }

  /**
   * Creates a snapshot of the game state
   * @param game
   */
  createFrame(game: Game, annotations: CommandsArray): Frame {
    const teamStates: FrameTeamStateData = {
      [LUnit.TEAM.A]: {
        workers: 0,
        carts: 0,
        citiesOwned: [],
        researchPoints: game.state.teamStates[0].researchPoints,
        statistics: {
          fuelGenerated: 0,
          resourcesCollected: {
            wood: 0,
            coal: 0,
            uranium: 0,
          },
        },
      },
      [LUnit.TEAM.B]: {
        workers: 0,
        carts: 0,
        citiesOwned: [],
        researchPoints: game.state.teamStates[1].researchPoints,
        statistics: {
          fuelGenerated: 0,
          resourcesCollected: {
            wood: 0,
            coal: 0,
            uranium: 0,
          },
        },
      },
    };
    const teams = [LUnit.TEAM.A, LUnit.TEAM.B];
    for (const team of teams) {
      teamStates[team].statistics.fuelGenerated +=
        game.stats.teamStats[team].fuelGenerated;
      teamStates[team].statistics.resourcesCollected.wood =
        game.stats.teamStats[team].resourcesCollected.wood;
      teamStates[team].statistics.resourcesCollected.coal =
        game.stats.teamStats[team].resourcesCollected.coal;
      teamStates[team].statistics.resourcesCollected.uranium =
        game.stats.teamStats[team].resourcesCollected.uranium;

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
      const actions = this.unitActionsByUnitID.get(unit.id);
      unitData.set(unit.id, {
        team: unit.team,
        type: unit.type,
        cooldown: unit.cooldown,
        cargo: { ...unit.cargo },
        id: unit.id,
        pos: unit.pos,
        commands: actions ? actions : [],
      });
      // if (this.currentTurn === 10) {
      //   console.log(unitData);
      // }
    });

    const cityData: FrameCityData = new Map();
    const cityTileData: FrameCityTileData = [];
    game.cities.forEach((city) => {
      teamStates[city.team].citiesOwned.push(city.id);
      cityData.set(city.id, {
        cityTilePositions: city.citycells.map((cell) => cell.pos),
        fuel: city.fuel,
        team: city.team,
        upkeep: city.getLightUpkeep(),
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
    const resourceData: Map<number, any> = new Map();

    game.map.resources.forEach((cell) => {
      // resourceMap
      resourceData.set(hashMapCoords(cell.pos), {
        type: cell.resource.type,
        amt: cell.resource.amount,
        pos: cell.pos,
      });
    });

    let roadLevels: number[][] = [];
    for (let y = 0; y < game.map.height; y++) {
      let row = game.map.getRow(y);
      roadLevels.push([]);
      row.forEach((cell, x) => {
        roadLevels[y][x] = cell.road;
      });
    }
    let errorscopy = [...this.currentTurnErrors];
    this.currentTurnErrors = [];

    return {
      resourceData,
      unitData,
      cityData,
      cityTileData,
      teamStates,
      annotations,
      roadLevels,
      errors: errorscopy,
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

  /**
   * Paint in a resource tile to the current rendered frame
   */
  addResourceTile(type: Resource.Types, x: number, y: number) {
    const p = mapCoordsToIsometricPixels(x, y, {
      scale: this.overallScale,
      width: this.mapWidth,
      height: this.mapHeight,
    });
    switch (type) {
      case Resource.Types.WOOD: {
        let treeType = 0;
        let tscale = this.defaultScales.tree0;
        const s = seedrandom('' + x * 10e5 + y);
        let scaleFactor = 140;
        if (s() < 0.5) {
          treeType = 1;
          tscale = this.defaultScales.tree1;
          scaleFactor = 120;
        }
        const img = this.add
          .image(
            p[0] + 20 * tscale * this.overallScale,
            p[1] - scaleFactor * tscale * this.overallScale,
            'tree' + treeType
          )
          .setDepth(getDepthByPos(new Position(x, y)))
          .setScale(tscale * this.overallScale);
        return img;
      }
      case Resource.Types.COAL: {
        const img = this.add
          .image(
            p[0],
            p[1] - 60 * this.defaultScales.coal * this.overallScale,
            'coal'
          )
          .setDepth(getDepthByPos(new Position(x, y)))
          .setScale(this.defaultScales.coal * this.overallScale);
        return img;
      }
      case Resource.Types.URANIUM: {
        const img = this.add
          .image(
            p[0] - 22 * this.defaultScales.uranium * this.overallScale,
            p[1] - 62 * this.defaultScales.uranium * this.overallScale,
            'uranium'
          )
          .setDepth(getDepthByPos(new Position(x, y)))
          .setScale(this.defaultScales.uranium * this.overallScale);
        return img;
      }
    }
  }

  addCityTile(
    data: FrameSingleCityTileData,
    tilesWithUnits: Set<number>,
    night = false
  ) {
    const p = mapPosToIsometricPixels(data.pos, {
      scale: this.overallScale,
      width: this.mapWidth,
      height: this.mapHeight,
    });
    let cityTileType = 'city' + data.team;

    const s = seedrandom('' + data.pos.x * 10e3 + data.pos.y);
    let variant = '0';
    const rngp = s();
    if (rngp < 0.125) {
      variant = '2';
    } else if (rngp < 0.5) {
      variant = '1';
    } else if (rngp < 0.625) {
      variant = '3';
    }
    cityTileType += variant;
    // make tile transparent if there's a unit behind it and its a tall building (type 2 or 3)
    if (
      (variant === '2' || variant === '3') &&
      tilesWithUnits.has(
        hashMapCoords(new Position(data.pos.x - 1, data.pos.y - 1))
      )
    ) {
      cityTileType += 't';
    }
    if (night) {
      cityTileType += 'night';
    }
    const img = this.add
      .image(p[0], p[1], cityTileType)
      .setDepth(getDepthByPos(data.pos))
      .setScale(this.defaultScales.city * this.overallScale);

    switch (data.team + variant) {
      case '00':
      case '01':
        img.setY(img.y - 80 * this.defaultScales.city * this.overallScale);
        img.setX(img.x + 10 * this.defaultScales.city * this.overallScale);
        break;
      case '02':
      case '03':
        img.setY(img.y - 120 * this.defaultScales.city * this.overallScale);
        img.setX(img.x + 10 * this.defaultScales.city * this.overallScale);
        break;
      case '10':
      case '11':
        img.setY(img.y - 100 * this.defaultScales.city * this.overallScale);
        break;
      case '12':
      case '13':
        img.setY(img.y - 140 * this.defaultScales.city * this.overallScale);
        break;
    }

    return img;
  }

  addNormalFloorTile(pos: Position) {
    const ps = mapCoordsToIsometricPixels(pos.x, pos.y, {
      scale: this.overallScale,
      width: this.mapWidth,
      height: this.mapHeight,
    });

    const img = this.add
      .image(ps[0], ps[1], 'block1')
      .setScale(this.defaultScales.block * this.overallScale);
    img.setDepth(getDepthByPos(pos) / 100);
    return img;
  }

  /**
   * Add worker sprite for use by any frame
   */
  addWorkerSprite(x: number, y: number, team: LUnit.TEAM, id: string) {
    const p = mapCoordsToIsometricPixels(x, y, {
      scale: this.overallScale,
      width: this.mapWidth,
      height: this.mapHeight,
    });
    const sprite = this.add
      .sprite(p[0], p[1], 'worker' + team)
      .setScale(this.defaultScales.worker * this.overallScale);
    sprite.setDepth(getDepthByPos(new Position(x, y)));
    this.unitSprites.set(id, { sprite, originalPosition: new Position(x, y) });
    return sprite;
  }

  /**
   * Add cart sprite for use by any frame
   */
  addCartSprite(x: number, y: number, team: LUnit.TEAM, id: string) {
    const p = mapCoordsToIsometricPixels(x, y, {
      scale: this.overallScale,
      width: this.mapWidth,
      height: this.mapHeight,
    });
    const sprite = this.add
      .sprite(p[0], p[1], 'cart' + team)
      .setScale(this.defaultScales.cart * this.overallScale);
    sprite.setDepth(getDepthByPos(new Position(x, y)));
    this.unitSprites.set(id, { sprite, originalPosition: new Position(x, y) });
    return sprite;
  }

  currentRenderedFramesImgs: Array<GameObjects.Image> = [];
  currentRenderedFramesRoads: Array<{
    img: GameObjects.Image;
    pos: Position;
  }> = [];
  currentRenderedFramesText: Array<GameObjects.Text> = [];
  cloudSprites: Array<{ cloud: GameObjects.Sprite; pos: Position }> = [];

  renderFrame(turn: number) {
    this.turn = turn;
    const f = this.frames[turn];
    if (!f) {
      return;
    }
    console.log(`Errors on turn ${turn}`, f.errors);

    const dayLength = this.luxgame.configs.parameters.DAY_LENGTH;
    const cycleLength =
      dayLength + this.luxgame.configs.parameters.NIGHT_LENGTH;
    const isnight = turn % cycleLength >= dayLength;

    // destroy any old rendered images
    this.currentRenderedFramesImgs.forEach((img) => {
      img.destroy();
    });
    this.currentRenderedFramesText.forEach((txt) => {
      txt.destroy();
    });
    this.currentRenderedFramesRoads.forEach(({ img, pos }) => {
      img.destroy();
      let hash = hashMapCoords(pos);
      // let oldimg = this.floorImageTiles.get(hash);
      let img2 = this.addNormalFloorTile(pos);
      let old = this.floorImageTiles.get(hash);
      old.destroy();
      this.floorImageTiles.set(hash, img2);
    });

    // find all standing cities
    let visibleCityTiles: Set<number> = new Set();
    f.cityTileData.forEach((data) => {
      visibleCityTiles.add(hashMapCoords(data.pos));
    });

    // render roads
    f.roadLevels.forEach((row, y) => {
      row.forEach((level, x) => {
        if (level < 1e-1) return;

        let pos = new Position(x, y);
        let hash = hashMapCoords(pos);

        // if (visibleCityTiles.has(hash)) return;

        let oldimg = this.floorImageTiles.get(hash);
        oldimg.destroy();
        const p = mapPosToIsometricPixels(pos, {
          scale: this.overallScale,
          width: this.mapWidth,
          height: this.mapHeight,
        });

        // determine road to render by adjacency
        let adjacency = [false, false, false, false];

        let dirs = [
          Game.DIRECTIONS.NORTH,
          Game.DIRECTIONS.EAST,
          Game.DIRECTIONS.SOUTH,
          Game.DIRECTIONS.WEST,
        ];
        dirs.forEach((dir, i) => {
          let newpos = pos.translate(dir, 1);
          if (
            f.roadLevels[newpos.y] !== undefined &&
            f.roadLevels[newpos.y][newpos.x] > 0
          ) {
            adjacency[i] = true;
          }
        });

        // add the img_base because we use transparency on the roads and need something behind it
        const img_base = this.add
          .image(p[0], p[1], 'block1')
          .setDepth(getDepthByPos(pos) / 100 + 0.5 / 1e7)
          .setScale(this.defaultScales.block * this.overallScale);
        const img = this.add
          .image(p[0], p[1], getRoadType(adjacency))
          .setDepth(getDepthByPos(pos) / 100 + 1 / 1e7)
          .setScale(this.defaultScales.road * this.overallScale)
          .setAlpha(Math.ceil(level) / 6);
        this.currentRenderedFramesRoads.push({ img, pos: pos });
        this.currentRenderedFramesRoads.push({ img: img_base, pos: pos });
        this.floorImageTiles.set(hash, img);
      });
    });

    // render clouds to the appropriate size
    this.cloudSprites.forEach(({ cloud, pos }) => {
      cloud.setScale(this.overallScale * this.defaultScales.clouds);
      const p = mapPosToIsometricPixels(pos, {
        scale: this.overallScale,
        width: this.mapWidth,
        height: this.mapHeight,
      });
      cloud.setX(p[0]);
      cloud.setY(p[1]);
    });

    let visibleUnits: Set<string> = new Set();
    let unitPosToCount: Map<number, number> = new Map();
    let tilesWithUnits: Set<number> = new Set();

    // find tiles with units and count units per tile
    f.unitData.forEach((data) => {
      visibleUnits.add(data.id);
      const hash = hashMapCoords(data.pos);
      if (tilesWithUnits.has(hash)) {
        if (unitPosToCount.has(hash)) {
          unitPosToCount.set(hash, unitPosToCount.get(hash) + 1);
        } else {
          unitPosToCount.set(hash, 2);
        }
      }
      tilesWithUnits.add(hash);
    });

    const tilesWithResources: Set<number> = new Set();
    // paint in all resource tiles
    f.resourceData.forEach((data) => {
      const img = this.addResourceTile(data.type, data.pos.x, data.pos.y);
      this.currentRenderedFramesImgs.push(img);
      tilesWithResources.add(hashMapCoords(data.pos));
    });

    // iterate over all units in this frame / turn
    f.unitData.forEach((data) => {
      const id = data.id;
      const { sprite } = this.unitSprites.get(id);

      sprite.setVisible(true);
      const p = mapPosToIsometricPixels(data.pos, {
        scale: this.overallScale,
        width: this.mapWidth,
        height: this.mapHeight,
      });

      // translate unit position depending on if there's a resource or city there
      let newx = p[0] - 45 * this.defaultScales.worker * this.overallScale;
      let newy = p[1] - 140 * this.defaultScales.worker * this.overallScale;
      if (visibleCityTiles.has(hashMapCoords(data.pos))) {
        newy = p[1] - 20 * this.defaultScales.worker * this.overallScale;
      } else if (tilesWithResources.has(hashMapCoords(data.pos))) {
        newy = p[1] - 60 * this.defaultScales.worker * this.overallScale;
      }

      // create smooth movement
      this.tweens.add({
        targets: sprite,
        x: newx,
        y: newy,
        ease: 'Linear',
        duration: 340 / this.speed,
        repeat: 0,
        yoyo: false,
      });

      if (data.type === LUnit.Type.WORKER) {
        // add 1/10e5 to place this in front of cities
        sprite
          .setDepth(getDepthByPos(data.pos) + 1 / 10e5)
          .setScale(this.defaultScales.worker * this.overallScale);
      } else {
        sprite
          .setDepth(getDepthByPos(data.pos) + 1 / 10e5)
          .setScale(this.defaultScales.cart * this.overallScale);
      }
    });

    // iterate over all live city tiles and draw in unit counts
    this.graphics.clear();
    this.graphics.lineStyle(3 * this.overallScale, 0x323d34, 1);
    this.graphics.fillStyle(0xe7ded1, 1);
    f.cityTileData.forEach((data) => {
      const img = this.addCityTile(data, tilesWithUnits, isnight);
      this.currentRenderedFramesImgs.push(img);
      const hash = hashMapCoords(data.pos);
      if (unitPosToCount.has(hash)) {
        let c = unitPosToCount.get(hash);
        const p = mapPosToIsometricPixels(data.pos, {
          scale: this.overallScale,
          width: this.mapWidth,
          height: this.mapHeight,
        });
        this.graphics
          .fillCircle(
            p[0] + 16 * this.overallScale,
            p[1] - 20 * this.overallScale,
            18 * this.overallScale
          )
          .setDepth(getDepthByPos(data.pos) + 1);
        this.graphics
          .strokeCircle(
            p[0] + 16 * this.overallScale,
            p[1] - 20 * this.overallScale,
            18 * this.overallScale
          )
          .setDepth(getDepthByPos(data.pos) + 1);

        const text = this.make
          .text({
            x: p[0] + 9 * this.overallScale,
            y: p[1] - 33 * this.overallScale,
            text: `${c}`,
            style: {
              fontSize: `${24 * this.overallScale}px`,
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              color: '#323D34',
              // @ts-ignore
              fontWeight: 'bold',
            },
          })
          .setDepth(getDepthByPos(data.pos) + 1e8);
        this.currentRenderedFramesText.push(text);
      }
    });

    this.unitSprites.forEach(({ sprite, originalPosition }, key) => {
      if (!visibleUnits.has(key)) {
        sprite.setVisible(false);
        const p = mapPosToIsometricPixels(originalPosition, {
          scale: this.overallScale,
          width: this.mapWidth,
          height: this.mapHeight,
        });
        sprite.x = p[0];
        sprite.y = p[1] - 18;
      }
    });

    if (this.currentSelectedTilePos !== null) {
      this.onTileClicked(this.currentSelectedTilePos);
    }

    // add annotations
    if (this.debug) {
      f.annotations.forEach((cmd) => {
        const strs = cmd.command.split(' ');
        switch (strs[0]) {
          case Game.ACTIONS.DEBUG_ANNOTATE_CIRCLE: {
            if (strs.length === 3) {
              let x = parseInt(strs[1]);
              let y = parseInt(strs[2]);
              if (isNaN(x) || isNaN(y)) {
                return;
              }
              const p = mapCoordsToIsometricPixels(x, y, {
                scale: this.overallScale,
                width: this.mapWidth,
                height: this.mapHeight,
              });
              if (cmd.agentID === LUnit.TEAM.A) {
                this.graphics.lineStyle(7 * this.overallScale, TEAM_A_COLOR, 1);
              } else {
                this.graphics.lineStyle(7 * this.overallScale, TEAM_B_COLOR, 1);
              }
              this.graphics
                .strokeCircle(
                  p[0] + 0 * this.overallScale,
                  p[1] - 16 * this.overallScale,
                  34 * this.overallScale
                )
                .setDepth(getDepthByPos(new Position(x, y)) + 1);
            }
            break;
          }
          case Game.ACTIONS.DEBUG_ANNOTATE_X:
            if (strs.length === 3) {
              let x = parseInt(strs[1]);
              let y = parseInt(strs[2]);
              if (isNaN(x) || isNaN(y)) {
                return;
              }
              const p = mapCoordsToIsometricPixels(x, y, {
                scale: this.overallScale,
                width: this.mapWidth,
                height: this.mapHeight,
              });
              if (cmd.agentID === LUnit.TEAM.A) {
                this.graphics.lineStyle(7 * this.overallScale, TEAM_A_COLOR, 1);
              } else {
                this.graphics.lineStyle(7 * this.overallScale, TEAM_B_COLOR, 1);
              }
              this.graphics
                .lineBetween(
                  p[0] - 28 * this.overallScale,
                  p[1] - 46 * this.overallScale,
                  p[0] + 32 * this.overallScale,
                  p[1] + 14 * this.overallScale
                )
                .setDepth(getDepthByPos(new Position(x, y)) + 1);
              this.graphics
                .lineBetween(
                  p[0] + 28 * this.overallScale,
                  p[1] - 46 * this.overallScale,
                  p[0] - 32 * this.overallScale,
                  p[1] + 14 * this.overallScale
                )
                .setDepth(getDepthByPos(new Position(x, y)) + 1);
            }
            break;
          case Game.ACTIONS.DEBUG_ANNOTATE_LINE: {
            if (strs.length === 5) {
              let x1 = parseInt(strs[1]);
              let y1 = parseInt(strs[2]);
              let x2 = parseInt(strs[3]);
              let y2 = parseInt(strs[4]);
              if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
                return;
              }
              const p = mapCoordsToIsometricPixels(x1, y1, {
                scale: this.overallScale,
                width: this.mapWidth,
                height: this.mapHeight,
              });
              const p2 = mapCoordsToIsometricPixels(x2, y2, {
                scale: this.overallScale,
                width: this.mapWidth,
                height: this.mapHeight,
              });

              if (cmd.agentID === LUnit.TEAM.A) {
                this.graphics.lineStyle(7 * this.overallScale, TEAM_A_COLOR, 1);
              } else {
                this.graphics.lineStyle(7 * this.overallScale, TEAM_B_COLOR, 1);
              }
              this.graphics
                .lineBetween(
                  p[0] - 0 * this.overallScale,
                  p[1] - 28 * this.overallScale,
                  p2[0] + 0 * this.overallScale,
                  p2[1] - 14 * this.overallScale
                )
                .setDepth(10e5);
            }
            break;
          }
          // case Game.ACTIONS.DEBUG_ANNOTATE_SIDETEXT: {
          //   if (strs.length > 1) {
          //     const message = cmd.command.split(' ').slice(1).join(" ");
          //   }
          // }
          case Game.ACTIONS.DEBUG_ANNOTATE_TEXT: {
            if (strs.length > 3) {
              let x = parseInt(strs[1]);
              let y = parseInt(strs[2]);
              const message = cmd.command
                .split(' ')
                .slice(3, 4)
                .join(' ')
                .split("'")[1];
              let fontsize = parseInt(strs[strs.length - 1]);
              if (isNaN(x) || isNaN(y) || isNaN(fontsize)) {
                return;
              }
              const p = mapCoordsToIsometricPixels(x, y, {
                scale: this.overallScale,
                width: this.mapWidth,
                height: this.mapHeight,
              });

              let ypos = p[1] - 15 * this.overallScale;
              let color = TEAM_B_COLOR_STR;
              if (cmd.agentID === LUnit.TEAM.A) {
                ypos = p[1] - 35 * this.overallScale;
                color = TEAM_A_COLOR_STR;
              }
              const textobj = this.add
                .text(
                  p[0] -
                    ((fontsize + 2) / 2) *
                      this.overallScale *
                      (message.length / 2),
                  ypos,
                  message,
                  {
                    fontSize: `${fontsize * this.overallScale}px`,
                  }
                )
                .setDepth(10e5)
                .setColor(color);
              this.currentRenderedFramesText.push(textobj);
              // this.graphics
              //   .lineBetween(
              //     p[0] - 0 * this.overallScale,
              //     p[1] - 28 * this.overallScale,
              //     p2[0] + 0 * this.overallScale,
              //     p2[1] - 14 * this.overallScale
              //   )
              //   .setDepth(10e5);
            }
            break;
          }
          default:
            return true;
        }
      });
    }
  }

  // map unit id to all their actions
  unitActionsByUnitID: Map<string, Array<{ turn: number; actions: string[] }>> =
    new Map();
  // id city tiles by <city_id_pos_hash>
  cityTileActionsByPosition: Map<
    string,
    Array<{ turn: number; actions: string[] }>
  > = new Map();
  async generateGameFrames(replayData) {
    while (this.currentTurn <= this.luxgame.configs.parameters.MAX_DAYS) {
      const commands = replayData.allCommands[
        this.currentTurn
      ] as CommandsArray;
      if (commands === undefined) {
        // we are done with match
        return;
      }
      const state: LuxMatchState = this.pseudomatch.state;
      const game = state.game;

      let annotations = [] as CommandsArray;
      let unannotated = commands.filter((cmd) => {
        const strs = cmd.command.split(' ');
        if (strs.length === 0) return false;
        switch (strs[0]) {
          case Game.ACTIONS.BUILD_CART:
          case Game.ACTIONS.RESEARCH:
          case Game.ACTIONS.BUILD_WORKER:
            if (strs.length < 3) break;
            let x = parseInt(strs[1]);
            let y = parseInt(strs[2]);
            if (isNaN(x) || isNaN(y)) break;
            const hash = hashMapCoords(new Position(x, y));
            const cell = game.map.getCell(x, y);
            if (cell.isCityTile()) {
              const cityTile = cell.citytile;
              const cityid = cityTile.cityid;
              const citytileid = `${cityid}_${hash}`;
              if (this.cityTileActionsByPosition.has(citytileid)) {
                const curr = this.cityTileActionsByPosition.get(citytileid);
                // cityTileActionsByPosition.set(citytileid, [
                //   ...cityTileActionsByPosition.get(citytileid),
                //   cmd.command,
                // ]);
                if (curr[curr.length - 1].turn === this.currentTurn) {
                  curr[curr.length - 1].actions.push(cmd.command);
                } else {
                  curr.push({ turn: this.currentTurn, actions: [cmd.command] });
                }
              } else {
                this.cityTileActionsByPosition.set(citytileid, [
                  { turn: this.currentTurn, actions: [cmd.command] },
                ]);
              }
            }
            break;
          case Game.ACTIONS.BUILD_CITY:
          case Game.ACTIONS.MOVE:
          case Game.ACTIONS.TRANSFER:
          case Game.ACTIONS.PILLAGE:
            if (strs.length < 2) break;
            // note, this may not actually be a unit id if agent sent a bad command
            if (this.unitActionsByUnitID.has(strs[1])) {
              const curr = this.unitActionsByUnitID.get(strs[1]);
              if (curr[curr.length - 1].turn === this.currentTurn) {
                curr[curr.length - 1].actions.push(cmd.command);
              } else {
                curr.push({ turn: this.currentTurn, actions: [cmd.command] });
              }
            } else {
              this.unitActionsByUnitID.set(strs[1], [
                { turn: this.currentTurn, actions: [cmd.command] },
              ]);
            }
            break;
        }

        // filter in/out annotation commands
        switch (strs[0]) {
          case Game.ACTIONS.DEBUG_ANNOTATE_CIRCLE:
          case Game.ACTIONS.DEBUG_ANNOTATE_X:
          case Game.ACTIONS.DEBUG_ANNOTATE_LINE:
          case Game.ACTIONS.DEBUG_ANNOTATE_SIDETEXT:
          case Game.ACTIONS.DEBUG_ANNOTATE_TEXT:
            annotations.push(cmd);
            return false;
          default:
            return true;
        }
      });
      await LuxDesignLogic.update(this.pseudomatch, unannotated);

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

      const frame = this.createFrame(this.pseudomatch.state.game, annotations);

      let stats: TurnStats = {
        citiesOwned: [0, 0],
        totalFuelGenerated: [
          game.stats.teamStats[0].fuelGenerated,
          game.stats.teamStats[1].fuelGenerated,
        ],
        researchPoints: [
          game.state.teamStates[0].researchPoints,
          game.state.teamStates[1].researchPoints,
        ],
      };
      game.cities.forEach((city) => {
        stats.citiesOwned[city.team] += city.citycells.length;
      });

      this.accumulatedStats.push(stats);

      // console.log(
      //   { turn: this.currentTurn },
      //   'frame size',
      //   memorySizeOf(frame)
      // );
      this.frames.push(frame);
      this.currentTurn++;
    }
  }

  lastPointerPosition = null;

  update(time: number, delta: number) {
    const panvelocity = 32 * Math.sqrt(this.overallScale);
    const wkey = this.input.keyboard.addKey('W');
    if (wkey.isDown) {
      this.moveCamera(0, -panvelocity);
    }
    const skey = this.input.keyboard.addKey('S');
    if (skey.isDown) {
      this.moveCamera(0, panvelocity);
    }
    const akey = this.input.keyboard.addKey('A');
    if (akey.isDown) {
      this.moveCamera(-panvelocity, 0);
    }
    const dkey = this.input.keyboard.addKey('D');
    if (dkey.isDown) {
      this.moveCamera(panvelocity, 0);
    }
    if (this.game.input.activePointer.isDown) {
      if (this.lastPointerPosition != null) {
        let dx = this.lastPointerPosition.x - this.game.input.activePointer.x;
        let dy = this.lastPointerPosition.y - this.game.input.activePointer.y;
        this.moveCamera(dx, dy);
      }
      this.lastPointerPosition = {
        x: this.game.input.activePointer.x,
        y: this.game.input.activePointer.y,
      };
    } else {
      this.lastPointerPosition = null;
    }
  }

  moveCamera(dx: number, dy: number) {
    let yBounds = [-640 - 640 * this.overallScale, 640 * this.overallScale];
    let xBounds = [-2560 - 640 * this.overallScale, 640 * this.overallScale];
    if (
      this.cameras.main.scrollX <= xBounds[1] &&
      this.cameras.main.scrollX >= xBounds[0]
    ) {
      this.cameras.main.scrollX += dx;
    } else if (this.cameras.main.scrollX < xBounds[0] && dx > 0) {
      this.cameras.main.scrollX += dx;
    } else if (this.cameras.main.scrollX > xBounds[1] && dx < 0) {
      this.cameras.main.scrollX += dx;
    }

    if (
      this.cameras.main.scrollY <= yBounds[1] &&
      this.cameras.main.scrollY >= yBounds[0]
    ) {
      this.cameras.main.scrollY += dy;
    } else if (this.cameras.main.scrollY < yBounds[0] && dy > 0) {
      this.cameras.main.scrollY += dy;
    } else if (this.cameras.main.scrollY > yBounds[1] && dy < 0) {
      this.cameras.main.scrollY += dy;
    }

    if (this.cameras.main.scrollX < xBounds[0]) {
      this.cameras.main.scrollX = xBounds[0];
    }
    if (this.cameras.main.scrollY < yBounds[0]) {
      this.cameras.main.scrollY = yBounds[0];
    }
    if (this.cameras.main.scrollY > yBounds[1]) {
      this.cameras.main.scrollY = yBounds[1];
    }
  }
}

export default MainScene;
