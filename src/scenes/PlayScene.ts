import { LuxMatchState } from '@lux-ai/2020-challenge/lib/types';
import { LuxDesignLogic } from '@lux-ai/2020-challenge/lib/logic';
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

	pseudomatch: any = {
		state: {},
		configs: {
			storeReplay: false,
		},
		throw: () => {},
		sendAll: () => {},
		send: () =>{},
		log: {
			detail: () => {},
		},
		agents: [],
	}

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
		this.luxgame = new Game();
		let width = replayData.map[0].length;
		let height = replayData.map.length;
		const level = [];
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
			const citytileData = this.dynamicLayer.putTileAt(n, ct.x, ct.y, true);
			this.cityTilemapTiles.set(citytile.getTileID(), citytileData);
		});

		replayData.initialUnits.forEach((unit) => {
			if (unit.type === LUnit.Type.WORKER) {
				const worker = this.luxgame.spawnWorker(unit.team, unit.x, unit.y, unit.id);
				const sprite = this.add.sprite(unit.x * 16 + 8, unit.y * 16 + 8, 'worker' + unit.team);
				this.unitSprites.set(worker.id, sprite);
			} else {
				const cart = this.luxgame.spawnCart(unit.team, unit.x, unit.y, unit.id);
				const sprite = this.add.sprite(unit.x * 16 + 8, unit.y * 16 + 8, 'cart' + unit.team);
				this.unitSprites.set(cart.id, sprite);
			}
		});
		
		this.cursors = this.input.keyboard.createCursorKeys();

		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

		this.pseudomatch.configs.preLoadedGame = this.luxgame;
		LuxDesignLogic.initialize(this.pseudomatch);
		console.log(this.pseudomatch.state.game);
	}

	update(time: number, delta:number) {
		if (time > this.currentTurn * 250 && this.currentTurn < 100) {
			const commands = replayData.allCommands[this.currentTurn];
			const state: LuxMatchState = this.pseudomatch.state;
			const game = state.game;
			console.log(this.currentTurn);
			LuxDesignLogic.update(this.pseudomatch, commands);

			
			// render units
			const unitsVisible: Set<string> = new Set();
			[
				...Array.from(game.getTeamsUnits(LUnit.TEAM.A).values()),
				...Array.from(game.getTeamsUnits(LUnit.TEAM.B).values())
			]
			.forEach((unit) => {
				unitsVisible.add(unit.id);
				if (this.unitSprites.has(unit.id)) {
					const sprite = this.unitSprites.get(unit.id)
					// sprite.x = unit.pos.x * 16 + 8;
					// sprite.y = unit.pos.y * 16 + 8;
					this.tweens.add({
						targets: sprite,
						x: unit.pos.x * 16 + 8,
						y: unit.pos.y * 16 + 8,
						ease: 'Linear',
						duration: 100,
						repeat: 0,
						yoyo: false
					});
				} else {
					if (unit.type === LUnit.Type.WORKER) {
						const sprite = this.add.sprite(unit.pos.x * 16 + 8, unit.pos.y * 16 + 8, 'worker' + unit.team);
						this.unitSprites.set(unit.id, sprite);
					} else {
						const sprite = this.add.sprite(unit.pos.x * 16 + 8, unit.pos.y * 16 + 8, 'cart' + unit.team);
						this.unitSprites.set(unit.id, sprite);
					}
				}
			});
			this.unitSprites.forEach((unit, key) => {
				if (!unitsVisible.has(key)) {
					console.log(`Unit ${key} died`);
					if (parseInt(key.split("_")[1]) > 3) {
						this.currentTurn = 1000;
					}
					this.tweens.add({
						targets: this.unitSprites.get(key),
						alpha: 0,
						ease: 'Easeout',
						duration: 300,
						repeat: 0,
						yoyo: false
					});
				}
			});
			// render cities
			const cityTilesVisible: Set<string> = new Set();
			game.cities.forEach((city) => {
				city.citycells.forEach((cell) => {
					const ct = cell.citytile;
					cityTilesVisible.add(ct.getTileID());
					if (this.cityTilemapTiles.has(ct.getTileID())) {

					} else {
						let p = Math.random();
						let n = 7;
						if (p > 0.67) {
							n = 8;
						} else if (p > 0.34) {
							n = 9;
						}
						const citytileData = this.dynamicLayer.putTileAt(n, ct.pos.x, ct.pos.y, true);
						this.cityTilemapTiles.set(ct.getTileID(), citytileData);
					}
				});
			});
			this.cityTilemapTiles.forEach((tile, key) => {
				if (!cityTilesVisible.has(key)) {
					tile.setVisible(false);
				}
			});
			console.log(this.pseudomatch.state.game);
			this.currentTurn++;
		}		
	}

}

export default TestScene;