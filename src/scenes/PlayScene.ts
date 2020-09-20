import { Game } from '@lux-ai/2020-challenge/lib/Game';
import { Resource } from '@lux-ai/2020-challenge/lib/Resource';
import { Unit as LUnit } from '@lux-ai/2020-challenge/lib/Unit/index';
import { Unit } from '../Lux/Units';
import replayData from './replay.json';
class TestScene extends Phaser.Scene {
	player: Phaser.GameObjects.Sprite;
	cursors: any;

	workers: Array<Phaser.GameObjects.Sprite>= [];
	luxgame: Game;

	constructor() {
    super({
			key: 'TestScene'
		})
	}
	
	preload() {
		this.load.tilemapTiledJSON('map', '/assets/tilemaps/desert.json');
		this.load.image('Desert', '/assets/tilemaps/tmw_desert_spacing.png');
		this.load.image('Grass', '/assets/tilemaps/ground_tileset.png')
		this.load.image('worker', '/assets/sprites/worker.png');
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
		const dynamicLayer = map.createBlankDynamicLayer("resources", tileset);

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
							dynamicLayer.putTileAt(n, x, y, true);
							this.luxgame.map.addResource(x, y, Resource.Types.WOOD, data.amt);
							break;
						case Resource.Types.COAL:
							dynamicLayer.putTileAt(202, x, y, true);
							this.luxgame.map.addResource(x, y, Resource.Types.COAL, data.amt);
							break;
						case Resource.Types.URANIUM:
							dynamicLayer.putTileAt(216, x, y, true);
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
			dynamicLayer.putTileAt(n, ct.x, ct.y, true);
		});

		replayData.initialUnits.forEach((unit) => {
			// new Unit(unit.x, unit.y, unit.team, unit.type);
			if (unit.type === LUnit.Type.WORKER) {
				const worker = this.luxgame.spawnWorker(unit.team, unit.x, unit.y);
				worker.id = unit.id;
			} else {
				const cart = this.luxgame.spawnCart(unit.team, unit.x, unit.y);
				cart.id = unit.id;
			}
		});
		

		// this.player = this.add.sprite(100, 100, 'player');
		this.workers = [this.add.sprite(8, 8, 'worker')]
		this.cursors = this.input.keyboard.createCursorKeys();

		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // this.cameras.main.startFollow(this.player, false);
	}

	update(time: number, delta:number) {
		// this.player.angle += 1;
		// if (this.cursors.left.isDown) {
		// 	this.player.x -= 5;
		// }
		// if (this.cursors.right.isDown) {
		// 	this.player.x += 5;
		// }
		// if (this.cursors.down.isDown) {
		// 	this.player.y += 5;
		// }
		// if (this.cursors.up.isDown) {
		// 	this.player.y -= 5;
		// }
	}
}

export default TestScene;