import { Position } from '@lux-ai/2021-challenge/lib/es6';
import seedrandom from 'seedrandom';
import MainScene from '../MainScene';
import { mapPosToIsometricPixels } from '../utils';

export const generateClouds = (scene: MainScene) => {
  // spawn in clouds
  const map_edge_cloud_tolerance = -2;
  for (let x = -100; x < 100; x += 9) {
    for (let y = -100; y < 100; y += 9) {
      if (
        x < scene.mapWidth - map_edge_cloud_tolerance &&
        x > map_edge_cloud_tolerance &&
        y < scene.mapHeight - map_edge_cloud_tolerance &&
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
        scale: scene.overallScale,
        width: scene.mapWidth,
        height: scene.mapHeight,
      });
      const cloud = scene.add
        .sprite(isopos[0], isopos[1], cloudtype)
        .setDepth(10e5)
        .setScale(scene.overallScale * scene.defaultScales.clouds);
      scene.cloudSprites.push({ cloud, pos });
    }
  }
};
