import { Position, Resource } from '@lux-ai/2021-challenge/lib/es6';
import MainScene from '../MainScene';
import { getDepthByPos, mapCoordsToIsometricPixels } from '../utils';
import seedrandom from 'seedrandom';
/**
 * Paint in a resource tile to the current rendered frame
 */
export const addResourceTile = (
  scene: MainScene,
  type: Resource.Types,
  x: number,
  y: number
) => {
  const p = mapCoordsToIsometricPixels(x, y, {
    scale: scene.overallScale,
    width: scene.mapWidth,
    height: scene.mapHeight,
  });
  switch (type) {
    case Resource.Types.WOOD: {
      let treeType = 0;
      let tscale = scene.defaultScales.tree0;
      const s = seedrandom('' + x * 10e5 + y);
      let scaleFactor = 90;
      if (s() < 0.5) {
        treeType = 1;
        tscale = scene.defaultScales.tree1;
        scaleFactor = 90;
      }
      const img = scene.add
        .image(
          p[0] + 20 * tscale * scene.overallScale,
          p[1] - scaleFactor * tscale * scene.overallScale,
          'tree' + treeType
        )
        .setDepth(getDepthByPos(new Position(x, y)))
        .setScale(tscale * scene.overallScale);
      const img_overlay = scene.add
        .image(
          p[0] + 20 * tscale * scene.overallScale,
          p[1] - scaleFactor * tscale * scene.overallScale,
          'tree' + treeType + '-night'
        )
        .setDepth(getDepthByPos(new Position(x, y)))
        .setScale(tscale * scene.overallScale);
      return [img, img_overlay];
    }
    case Resource.Types.COAL: {
      const img = scene.add
        .image(
          p[0],
          p[1] - 60 * scene.defaultScales.coal * scene.overallScale,
          'coal'
        )
        .setDepth(getDepthByPos(new Position(x, y)))
        .setScale(scene.defaultScales.coal * scene.overallScale);
      const img_overlay = scene.add
        .image(
          p[0],
          p[1] - 60 * scene.defaultScales.coal * scene.overallScale,
          'coal-night'
        )
        .setDepth(getDepthByPos(new Position(x, y)))
        .setScale(scene.defaultScales.coal * scene.overallScale);
      return [img, img_overlay];
    }
    case Resource.Types.URANIUM: {
      const img = scene.add
        .image(
          p[0] - 22 * scene.defaultScales.uranium * scene.overallScale,
          p[1] - 62 * scene.defaultScales.uranium * scene.overallScale,
          'uranium'
        )
        .setDepth(getDepthByPos(new Position(x, y)))
        .setScale(scene.defaultScales.uranium * scene.overallScale);
      const img_overlay = scene.add
        .image(
          p[0] - 22 * scene.defaultScales.uranium * scene.overallScale,
          p[1] - 62 * scene.defaultScales.uranium * scene.overallScale,
          'uranium-night'
        )
        .setDepth(getDepthByPos(new Position(x, y)))
        .setScale(scene.defaultScales.uranium * scene.overallScale);
      return [img, img_overlay];
    }
  }
};
