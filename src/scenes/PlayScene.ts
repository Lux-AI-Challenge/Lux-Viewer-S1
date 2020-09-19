import replayData from './replay.json';
class TestScene extends Phaser.Scene {
	player: Phaser.GameObjects.Sprite;
	cursors: any;

	workers: Array<Phaser.GameObjects.Sprite>= [];

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
		
		// let worker:Phaser.Tilemaps.Tileset = this.make.tilemap({ key: 'map' });
		var tileset: Phaser.Tilemaps.Tileset = map.addTilesetImage('Grass');
		// var tileset2: Phaser.Tilemaps.Tileset = map.addTilesetImage('Desert');
		const staticLayer = map.createStaticLayer(0, tileset, 0, 0);
		const dynamicLayer = map.createBlankDynamicLayer("resources", tileset);

		for (let y = 0; y < height; y++) {
			level.push(replayData.map[y].map((data, x) => {
				if (data.resource !== null) {
					let p = Math.random();
					switch(data.resource) {
						case "wood":
							let n = 4;
							if (p > 0.67) {
								n = 5;
							} else if (p > 0.34) {
								n = 6;
							}
							dynamicLayer.putTileAt(n, x, y, true);
							break;
						case "coal":
							dynamicLayer.putTileAt(202, x, y, true);
							break;
						case "uranium":
							dynamicLayer.putTileAt(216, x, y, true);
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