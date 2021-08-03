import { LuxMatchState } from '@lux-ai/2021-challenge/lib/es6/types';
import { LuxDesignLogic } from '@lux-ai/2021-challenge/lib/es6/logic';
import { Game } from '@lux-ai/2021-challenge/lib/es6/Game';
import { Resource } from '@lux-ai/2021-challenge/lib/es6/Resource';
import { Unit as LUnit, Unit } from '@lux-ai/2021-challenge/lib/es6/Unit/index';

import {
  getDepthByPos,
  getNightTransitionTween,
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
import { generateClouds } from './constructors/clouds';
import { addCartSprite, addWorkerSprite } from './constructors/units';
import { addCityTile } from './constructors/city';
import { addResourceTile } from './constructors/resource';
import { addNormalFloorTile } from './constructors/floors';

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
  handleTileClicked: HandleTileClicked;
  handleUnitTracked: (id: string) => void;
  zoom: number;
};

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
type HandleTileClicked = (data?: FrameTileData) => void;

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
  floorImageTiles: Map<
    number,
    {
      source: GameObjects.Image;
      overlay: GameObjects.Image;
      roadOverlay: GameObjects.Image;
    }
  > = new Map();

  activeImageTile: GameObjects.Image = null;
  originalTileY = 0;

  hoverImageTile: GameObjects.Image = null;
  originalHoverImageTileY = 0;

  /** Overall zoom of replayer */
  overallScale = 1;

  /** relative scales for each of these svgs */
  defaultScales = {
    city: 0.4,
    worker: 0.496,
    cart: 0.56,
    block: 0.44,
    tree0: 0.43,
    tree1: 0.43,
    uranium: 0.5,
    clouds: 0.7,
    coal: 0.43,
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
    this.load.image('worker-0', `${base}/sprites/worker0w.svg`);
    this.load.image('worker-0-outline', `${base}/sprites/worker0w-outline.svg`);
    this.load.image('worker-1', `${base}/sprites/worker1w.svg`);
    this.load.image('worker-1-outline', `${base}/sprites/worker1w-outline.svg`);
    this.load.image('cart-0', `${base}/sprites/carts/cart0w.svg`);
    this.load.image('cart-1', `${base}/sprites/carts/cart1w.svg`);
    this.load.image(
      'cart-0-outline',
      `${base}/sprites/carts/cart0w-outline.svg`
    );
    this.load.image(
      'cart-1-outline',
      `${base}/sprites/carts/cart1w-outline.svg`
    );

    this.load.svg('ground', `${base}/ground.svg`);
    this.load.svg('ground-night', `${base}/groundnight.svg`);
    this.load.svg('ground-outline', `${base}/ground-outline.svg`);

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
      this.load.svg(`path${str}`, `${base}/sprites/paths/day/path${str}.svg`);
      // this.load.svg(
      //   `path${str}-night`,
      //   `${base}/sprites/paths/night/path${str}.svg`
      // );
    }
    this.load.svg(`path0000`, `${base}/sprites/paths/day/path1111.svg`);
    // this.load.svg(`path0000-night`, `${base}/sprites/paths/night/path1111.svg`);

    this.load.svg('tree1', `${base}/sprites/tree1.svg`);
    this.load.svg('tree0', `${base}/sprites/tree0.svg`);
    this.load.svg('tree1-night', `${base}/sprites/tree1night.svg`);
    this.load.svg('tree0-night', `${base}/sprites/tree0night.svg`);
    // city naming scheme
    // city<team><variant><transparent? t : ''><night? night : ''>
    const cityenums = ['00', '01', '02', '03', '10', '11', '12', '13'];
    for (const v of cityenums) {
      this.load.svg(`city${v}`, `${base}/sprites/cities/city${v}.svg`);
      this.load.svg(
        `city${v}night`,
        `${base}/sprites/cities/city${v}night.svg`
      );
      if (v[1] === '2' || v[1] === '3') {
        // load transparent versions
        this.load.svg(`city${v}t`, `${base}/sprites/cities/city${v}t.svg`);
        this.load.svg(
          `city${v}tnight`,
          `${base}/sprites/cities/city${v}tnight.svg`
        );
      }
    }

    this.load.image('coal', `${base}/sprites/coal.svg`);
    this.load.svg('uranium', `${base}/sprites/uranium.svg`);
    this.load.image('coal-night', `${base}/sprites/coalnight.svg`);
    this.load.svg('uranium-night', `${base}/sprites/uraniumnight.svg`);

    this.load.svg('cloud0', `${base}/sprites/cloud0.svg`);
    this.load.svg('cloud1', `${base}/sprites/cloud1.svg`);
    this.load.svg('cloud2', `${base}/sprites/cloud2.svg`);
  }

  currentTrackedUnitID: string = null;
  /**
   * track a unit by id
   * highlights the unit as well as pseudo clicking that unit each turn
   */
  trackUnit(id: string) {
    this.currentTrackedUnitID = id;
    const { sprite } = this.unitSprites.get(id);
    const keyInfo = sprite.texture.key.split('-');
    if (keyInfo.length <= 2) {
      const newkey = keyInfo.join('-') + '-outline';
      sprite.setTexture(newkey);
    }
    this.toggleOutlineClickedTile();
    this.handleUnitTracked(id);
  }
  /**
   * untrack units if tracking any.
   * @param trackTileUnderneath - default false. if true, will auto track tile under untracked unit
   */
  untrackUnit(trackTileUnderneath = false) {
    if (this.currentTrackedUnitID) {
      const { sprite } = this.unitSprites.get(this.currentTrackedUnitID);
      const keyInfo = sprite.texture.key.split('-');
      if (keyInfo.length > 2) {
        sprite.setTexture(keyInfo.slice(0, 2).join('-'));
      }
      this.currentTrackedUnitID = null;
      this.handleUnitTracked(null);
    }
    if (trackTileUnderneath) {
      if (this.currentSelectedTilePos) {
        this.toggleOutlineClickedTile(
          this.floorImageTiles.get(hashMapCoords(this.currentSelectedTilePos))
            .source
        );
      }
    }
  }

  /**
   * Handle when a tile is clicked
   */
  private onTileClicked(v: Position, allowUnitTrack = true) {
    if (v === null) {
      this.handleTileClicked();
      this.currentSelectedTilePos = null;
      this.untrackUnit();
      return;
    }
    const f = this.frames[this.turn];
    const unitDataAtXY: FrameUnitData = new Map();
    const cityTile: FrameCityTileData = [];
    // TODO: can be slow if we iterate entire unit list
    let clickedTileHasTrackedUnit = false;
    let firstUnitID = null;
    f.unitData.forEach((unit) => {
      if (unit.pos.x === v.x && unit.pos.y === v.y) {
        if (!firstUnitID) {
          firstUnitID = unit.id;
        }
        if (unit.id === this.currentTrackedUnitID) {
          clickedTileHasTrackedUnit = true;
        }
        unitDataAtXY.set(unit.id, unit);
      }
    });
    if (!clickedTileHasTrackedUnit && allowUnitTrack) {
      this.untrackUnit();
      if (firstUnitID) {
        // track first unit found if clicked tile does not have a currently tracked unit
        this.trackUnit(firstUnitID);
      }
    }

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
   * render an outline around a clicked tile if imageTile is not null and valid
   */
  toggleOutlineClickedTile(imageTile?: Phaser.GameObjects.Image) {
    if (imageTile && !this.currentTrackedUnitID) {
      if (this.activeImageTile == null) {
        this.originalTileY = imageTile.y;
        this.activeImageTile = imageTile;
        // this.activeImageTile.setTint(0x86bfda);
        // this.activeImageTile.setY(
        //   this.originalTileY - 15 * this.overallScale
        // );
        this.activeImageTile.setTexture('ground-outline');
      } else if (this.activeImageTile !== imageTile) {
        this.activeImageTile.setY(this.originalTileY);
        // this.activeImageTile.clearTint();
        this.activeImageTile.setTexture('ground');
        this.originalTileY = imageTile.y;
        this.activeImageTile = imageTile;
        // this.activeImageTile.setTint(0x86bfda);
        // this.activeImageTile.setY(
        //   this.originalTileY - 15 * this.overallScale
        // );
        this.activeImageTile.setTexture('ground-outline');
      }
    } else {
      if (this.activeImageTile) {
        this.activeImageTile.setY(this.originalTileY);
        // this.activeImageTile.clearTint();
        this.activeImageTile.setTexture('ground');
      }
      this.activeImageTile = null;
    }
  }

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
        const [img, img_overlay, roadOverlay] = addNormalFloorTile(
          this,
          cell.pos
        );
        this.floorImageTiles.set(
          hashMapCoords(new Position(cell.pos.x, cell.pos.y)),
          { source: img, overlay: img_overlay, roadOverlay }
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
        if (
          pos.x < 0 ||
          pos.y < 0 ||
          pos.x >= this.mapWidth ||
          pos.y >= this.mapHeight
        ) {
          // off map
          this.onTileClicked(null);
          this.toggleOutlineClickedTile(undefined);
        } else {
          this.onTileClicked(pos);
          const imageTile = this.floorImageTiles.get(hashMapCoords(pos)).source;
          // outline tile if it exists and we aren't tracking a unit
          this.toggleOutlineClickedTile(imageTile);
        }
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
      if (
        pos.x < 0 ||
        pos.y < 0 ||
        pos.x >= this.mapWidth ||
        pos.y >= this.mapHeight
      ) {
        // out of map
        if (
          this.hoverImageTile &&
          this.activeImageTile !== this.hoverImageTile
        ) {
          this.hoverImageTile.setY(this.originalHoverImageTileY);
          this.hoverImageTile.setTexture('ground');
        }
        this.hoverImageTile = null;
      } else {
        // TODO: make outline just a outline svg?
        const imageTile = this.floorImageTiles.get(hashMapCoords(pos)).source;
        if (imageTile) {
          if (this.hoverImageTile == null) {
            this.originalHoverImageTileY = imageTile.y;
            this.hoverImageTile = imageTile;
            this.hoverImageTile.setTexture('ground-outline');
          } else if (this.hoverImageTile !== imageTile) {
            if (this.activeImageTile != this.hoverImageTile) {
              this.hoverImageTile.setTexture('ground');
            }
            this.originalHoverImageTileY = imageTile.y;
            this.hoverImageTile = imageTile;
            this.hoverImageTile.setTexture('ground-outline');
          }
        } else {
          if (this.hoverImageTile) {
            this.hoverImageTile.setY(this.originalHoverImageTileY);
            this.hoverImageTile.setTexture('ground');
          }
          this.hoverImageTile = null;
        }
      }
    });

    // generateClouds(this);

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
        roadLevels[y][x] = cell.getRoad();
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

  public handleTileClicked: HandleTileClicked;
  public handleTileHover: HandleTileClicked;
  public handleUnitTracked: (id: string) => void;

  public currentSelectedTilePos: Position = null;

  create(configs: GameCreationConfigs) {
    this.loadReplayData(configs.replayData);
    this.handleTileClicked = configs.handleTileClicked;
    this.handleUnitTracked = configs.handleUnitTracked;
    this.events.emit('created');
  }

  determineNightTransitionAlphas(turn): [number, number] {
    const dayLength = this.luxgame.configs.parameters.DAY_LENGTH;
    const cycleLength =
      dayLength + this.luxgame.configs.parameters.NIGHT_LENGTH;
    if (
      turn % cycleLength >= dayLength - 5 &&
      turn % cycleLength < cycleLength - 1
    ) {
      return [
        Math.max(((turn % cycleLength) - dayLength + 4) / 6, 0),
        ((turn % cycleLength) - dayLength + 5) / 6,
      ];
    } else if (turn % cycleLength >= cycleLength - 1) {
      return [1, 5 / 6];
    } else if (turn % cycleLength <= 5 && turn > 5) {
      return [
        Math.min(1 - ((turn % cycleLength) + 1) / 6, 1),
        1 - ((turn % cycleLength) + 2) / 6,
      ];
    }
    return [0, 0];
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

    // find all standing cities
    let visibleCityTiles: Set<number> = new Set();
    f.cityTileData.forEach((data) => {
      visibleCityTiles.add(hashMapCoords(data.pos));
    });

    // render night textures and transitions if necessary
    let [startAlpha, endAlpha] = this.determineNightTransitionAlphas(turn);
    this.floorImageTiles.forEach((value) => {
      value.overlay.setAlpha(startAlpha);
      // value.source.setAlpha(1 - startAlpha);
      // this.tweens.add(getNightTransitionTween(value.source, this.speed, 1 - startAlpha));
      this.tweens.add(
        getNightTransitionTween(value.overlay, this.speed, endAlpha)
      );
    });

    // render roads
    // TODO: dont render, just replace textures with road textures
    f.roadLevels.forEach((row, y) => {
      row.forEach((level, x) => {
        let pos = new Position(x, y);
        let hash = hashMapCoords(pos);

        if (visibleCityTiles.has(hash)) level = 0;

        let { roadOverlay } = this.floorImageTiles.get(hash);

        // // determine road to render by adjacency
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
        // const img_base = this.add
        //   .image(p[0], p[1], 'ground')
        //   .setDepth(getDepthByPos(pos) / 100 + 0.5 / 1e7)
        //   .setScale(this.defaultScales.block * this.overallScale);
        // const img = this.add
        //   .image(p[0], p[1], getRoadType(adjacency))
        //   .setDepth(getDepthByPos(pos) / 100 + 1 / 1e7)
        //   .setScale(this.defaultScales.road * this.overallScale)
        //   .setAlpha(Math.ceil(level) / 6);
        roadOverlay.setTexture(getRoadType(adjacency));
        roadOverlay.setAlpha(Math.ceil(level) / 6);

        // this.currentRenderedFramesRoads.push({ img, pos: pos });
        // this.currentRenderedFramesRoads.push({ img: img_base, pos: pos });
        // this.floorImageTiles.set(hash, { source, overlay, roadOverlay });
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
      const [img, img_overlay] = addResourceTile(
        this,
        data.type,
        data.pos.x,
        data.pos.y
      );
      this.currentRenderedFramesImgs.push(img);
      this.currentRenderedFramesImgs.push(img_overlay);
      tilesWithResources.add(hashMapCoords(data.pos));
      img_overlay.setAlpha(startAlpha);
      this.tweens.add(
        getNightTransitionTween(img_overlay, this.speed, endAlpha)
      );
    });

    // iterate over all units in this frame / turn
    f.unitData.forEach((data) => {
      const id = data.id;

      if (this.currentTrackedUnitID === id) {
        // if this unit is being tracked, track it by clicking its tile and
        this.onTileClicked(data.pos);
      }
      const { sprite } = this.unitSprites.get(id);

      sprite.setVisible(true);
      const p = mapPosToIsometricPixels(data.pos, {
        scale: this.overallScale,
        width: this.mapWidth,
        height: this.mapHeight,
      });

      // translate unit position depending on if there's a resource or city there
      let newx = p[0] - 10 * this.defaultScales.worker * this.overallScale;
      if (data.type === Unit.Type.CART) {
        newx = p[0];
      }
      let newy = p[1] - 60 * this.defaultScales.worker * this.overallScale;
      if (visibleCityTiles.has(hashMapCoords(data.pos))) {
        newy = p[1] - 20 * this.defaultScales.worker * this.overallScale;
      } else if (tilesWithResources.has(hashMapCoords(data.pos))) {
        newy = p[1] - 20 * this.defaultScales.worker * this.overallScale;
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
          .setDepth(getDepthByPos(data.pos) + 5e-1)
          .setScale(this.defaultScales.worker * this.overallScale);
      } else {
        sprite
          .setDepth(getDepthByPos(data.pos) + 5e-1)
          .setScale(this.defaultScales.cart * this.overallScale);
      }
    });
    if (
      this.currentTrackedUnitID &&
      !f.unitData.has(this.currentTrackedUnitID)
    ) {
      // untrack units if they disappear from board
      this.untrackUnit();
    }

    // iterate over all live city tiles and draw in unit counts
    this.graphics.clear();
    this.graphics.lineStyle(3 * this.overallScale, 0x323d34, 1);
    this.graphics.fillStyle(0xe7ded1, 1);
    f.cityTileData.forEach((data) => {
      const [img, img_overlay] = addCityTile(this, data, tilesWithUnits, turn);
      this.currentRenderedFramesImgs.push(img);
      this.currentRenderedFramesImgs.push(img_overlay);
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

    if (this.currentSelectedTilePos !== null && !this.currentTrackedUnitID) {
      this.onTileClicked(this.currentSelectedTilePos, false);
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
    while (this.currentTurn <= this.luxgame.configs.parameters.MAX_DAYS + 1) {
      const commands = replayData.allCommands[
        this.currentTurn
      ] as CommandsArray;
      const state: LuxMatchState = this.pseudomatch.state;
      const game = state.game;
      // generate start of turn 0
      const frame = this.createFrame(this.pseudomatch.state.game, []);
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
      this.frames.push(frame);
      if (commands === undefined) {
        // we are done with match
        return;
      }

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
                  curr.push({
                    turn: this.currentTurn,
                    actions: [cmd.command],
                  });
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
                curr.push({
                  turn: this.currentTurn,
                  actions: [cmd.command],
                });
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
          // skip
        } else {
          if (unit.type === LUnit.Type.WORKER) {
            addWorkerSprite(
              this,
              unit.pos.x,
              unit.pos.y,
              unit.team,
              unit.id
            ).setVisible(false);
          } else {
            addCartSprite(
              this,
              unit.pos.x,
              unit.pos.y,
              unit.team,
              unit.id
            ).setVisible(false);
          }
        }
      });

      // const frame = this.createFrame(this.pseudomatch.state.game, annotations);

      // let stats: TurnStats = {
      //   citiesOwned: [0, 0],
      //   totalFuelGenerated: [
      //     game.stats.teamStats[0].fuelGenerated,
      //     game.stats.teamStats[1].fuelGenerated,
      //   ],
      //   researchPoints: [
      //     game.state.teamStates[0].researchPoints,
      //     game.state.teamStates[1].researchPoints,
      //   ],
      // };
      // game.cities.forEach((city) => {
      //   stats.citiesOwned[city.team] += city.citycells.length;
      // });

      // this.accumulatedStats.push(stats);

      // // console.log(
      // //   { turn: this.currentTurn },
      // //   'frame size',
      // //   memorySizeOf(frame)
      // // );
      // this.frames.push(frame);
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
