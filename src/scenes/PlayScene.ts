import { MoveAction, PillageAction, ResearchAction, SpawnWorkerAction, TransferAction } from '@lux-ai/2020-challenge/lib/Actions';
import { Game } from '@lux-ai/2020-challenge/lib/Game';
import { Resource } from '@lux-ai/2020-challenge/lib/Resource';
import { Unit as LUnit } from '@lux-ai/2020-challenge/lib/Unit/index';
import replayData from './replay.json';
class TestScene extends Phaser.Scene {
	player: Phaser.GameObjects.Sprite;
	cursors: any;

	workers: Array<Phaser.GameObjects.Sprite>= [];
	luxgame: Game;

	unitSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
	cityTilemapTiles: Map<string, Phaser.Tilemaps.Tile> = new Map();

	currentTurn = 0;

	dynamicLayer: Phaser.Tilemaps.DynamicTilemapLayer;

	game_frames: Array<{

	}>;

	constructor() {
    super({
			key: 'TestScene'
		})
	}
	
	preload() {
		this.load.tilemapTiledJSON('map', '/assets/tilemaps/desert.json');
		this.load.image('Desert', '/assets/tilemaps/tmw_desert_spacing.png');
		this.load.image('Grass', '/assets/tilemaps/ground_tileset.png')
		this.load.image('worker0', '/assets/sprites/worker0.png');
		this.load.image('worker1', '/assets/sprites/worker1.png');
		this.load.image('cart0', '/assets/sprites/cart0.png');
		this.load.image('cart1', '/assets/sprites/cart1.png');
		this.load.image('player', '/assets/sprites/mushroom.png');
	}

	create() {
		let width = replayData.map[0].length;
		let height = replayData.map.length;
		const level = [];
		this.luxgame = new Game();
		for (let y = 0; y < height; y++) {
			level.push(replayData.map[y].map((data) => {
				if (data.resource == null) {
					let p = Math.random();
					if (p > 0.7) return 2;
					else return 3;
				} else {
					return 3;
				}
			}));
		}
		let map = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16 });
		
		var tileset: Phaser.Tilemaps.Tileset = map.addTilesetImage('Grass');
		map.createStaticLayer(0, tileset, 0, 0);
		this.dynamicLayer = map.createBlankDynamicLayer("resources", tileset);

		for (let y = 0; y < height; y++) {
			level.push(replayData.map[y].map((data, x) => {
				if (data.resource !== null) {
					let p = Math.random();
					switch(data.resource) {
						case Resource.Types.WOOD:
							let n = 4;
							if (p > 0.67) {
								n = 5;
							} else if (p > 0.34) {
								n = 6;
							}
							this.dynamicLayer.putTileAt(n, x, y, true);
							this.luxgame.map.addResource(x, y, Resource.Types.WOOD, data.amt);
							break;
						case Resource.Types.COAL:
							this.dynamicLayer.putTileAt(202, x, y, true);
							this.luxgame.map.addResource(x, y, Resource.Types.COAL, data.amt);
							break;
						case Resource.Types.URANIUM:
							this.dynamicLayer.putTileAt(216, x, y, true);
							this.luxgame.map.addResource(x, y, Resource.Types.URANIUM, data.amt);
							break;
					}
				}
			}));
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
			// citytile.cityid
			const citytileData = this.dynamicLayer.putTileAt(n, ct.x, ct.y, true);
			this.cityTilemapTiles.set(citytile.getTileID(), citytileData);
		});

		replayData.initialUnits.forEach((unit) => {
			// console.log(unit);
			if (unit.type === LUnit.Type.WORKER) {
				const worker = this.luxgame.spawnWorker(unit.team, unit.x, unit.y, unit.id);
				const sprite = this.add.sprite(unit.x * 16 + 8, unit.y * 16 + 8, 'worker' + unit.team);
				this.unitSprites.set(worker.id, sprite);
			} else {
				const cart = this.luxgame.spawnCart(unit.team, unit.x, unit.y, unit.id);
				const sprite = this.add.sprite(unit.x * 16 + 8, unit.y * 16 + 8, 'cart' + unit.team);
				this.unitSprites.set(cart.id, sprite);
			}
			// console.log(this.luxgame.state.teamStates[0])
		});
		
		this.cursors = this.input.keyboard.createCursorKeys();

		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // this.cameras.main.startFollow(this.player, false);
	}

	update(time: number, delta:number) {
		if (time > this.currentTurn * 250 && this.currentTurn < 100) {
			const frame = replayData.frames[this.currentTurn];
			console.log(this.currentTurn, delta, frame);

			// first distribute all resources
			this.luxgame.map.resourcesMap.forEach((cell) => {
				this.luxgame.handleResourceRelease(cell);
			});

			frame.spawnedUnits.forEach((info) => {
				if (info.type === LUnit.Type.WORKER) {
					const worker = this.luxgame.spawnWorker(info.team, info.x, info.y, info.id);
					const sprite = this.add.sprite(info.x * 16 + 8, info.y * 16 + 8, 'worker' + info.team);
					this.unitSprites.set(worker.id, sprite);
				} else {
					const cart = this.luxgame.spawnCart(info.team, info.x, info.y, info.id);
					const sprite = this.add.sprite(info.x * 16 + 8, info.y * 16 + 8, 'cart' + info.team);
					this.unitSprites.set(cart.id, sprite);
				}
			});
			frame.spawnedCityTiles.forEach((ct) => {
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
			frame.actions[Game.ACTIONS.PILLAGE].forEach((action: PillageAction) => {
				this.luxgame.getUnit(action.team, action.unitid).giveAction(action);
			});
			frame.actions[Game.ACTIONS.RESEARCH].forEach((action: ResearchAction) => {
				const citytile = this.luxgame.map.getCell(action.x, action.y).citytile;
				citytile.giveAction(action);
			});
			frame.actions[Game.ACTIONS.TRANSFER].forEach((action: TransferAction) => {
				this.luxgame.getUnit(action.team, action.srcID).giveAction(action);
			});
			if (this.currentTurn % 20 === 0 && this.currentTurn > 0) {
				this.handleNight(this.luxgame);
			}
			const formattedMoves = this.luxgame.handleMovementActions(frame.actions.m.map((action) => {
				console.log(action.unitid, this.luxgame.getTeamsUnits(action.team))
				const unit = this.luxgame.getTeamsUnits(action.team).get(action.unitid);
				const newcell = this.luxgame.map.getCellByPos(unit.pos.translate(action.direction as Game.DIRECTIONS, 1));
				return new MoveAction(action.action as Game.ACTIONS, action.team, action.unitid, action.direction as Game.DIRECTIONS, newcell);
			}), null);
			formattedMoves.forEach((action) => {
				console.log(this.luxgame.getTeamsUnits(action.team));
				const unit = this.luxgame.getTeamsUnits(action.team).get(action.unitid);
				const oldx = unit.pos.x;
				const oldy = unit.pos.y;
				// this.luxgame.moveUnit(action.team, action.unitid, action.direction as Game.DIRECTIONS);
				let dx = action.newcell.pos.x - oldx;
				let dy = action.newcell.pos.y - oldy;
				const sprite = this.unitSprites.get(action.unitid);
				sprite.x += dx * 16;
				sprite.y += dy * 16;
			});
			formattedMoves.forEach((action) => {
				this.luxgame.getUnit(action.team, action.unitid).giveAction(action);
			});
			this.luxgame.cities.forEach((city) => {
				city.citycells.forEach((cellWithCityTile) => {
					cellWithCityTile.citytile.handleTurn(this.luxgame);
				});
			});
			const teams = [LUnit.TEAM.A, LUnit.TEAM.B];
			for (const team of teams) {
				this.luxgame.state.teamStates[team].units.forEach((unit) => {
					unit.handleTurn(this.luxgame);
				});
			}

			// now we make all units with cargo drop all resources on the city they are standing on
			for (const team of teams) {
				this.luxgame.state.teamStates[team].units.forEach((unit) => {
					this.luxgame.handleResourceDeposit(unit);
				});
			}
			this.currentTurn++;
		}		
	}
	handleNight(game: Game): void {
    game.cities.forEach((city) => {
      // if city does not have enough fuel, destroy it
      // TODO, probably add this event to replay
      if (city.fuel < city.getLightUpkeep()) {
        game.destroyCity(city.id);
      } else {
        city.fuel -= city.getLightUpkeep();
      }
    });
    game.state.teamStates[0].units.forEach((unit) => {
      // TODO: add condition for different light upkeep for units stacked on a city.
      if (!game.map.getCellByPos(unit.pos).isCityTile()) {
        if (!unit.spendFuelToSurvive()) {
					// delete unit
					this.unitSprites.get(unit.id).setVisible(false);
          game.destroyUnit(unit.team, unit.id);
        }
      }
    });
    game.state.teamStates[1].units.forEach((unit) => {
      if (!game.map.getCellByPos(unit.pos).isCityTile()) {
        if (!unit.spendFuelToSurvive()) {
					// delete unit
					this.unitSprites.get(unit.id).setVisible(false);
          game.destroyUnit(unit.team, unit.id);
        }
      }
    });
  }
}

export default TestScene;