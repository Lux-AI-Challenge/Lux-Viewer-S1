import { Position } from '@lux-ai/2021-challenge/lib/es6';
import MainScene from '../MainScene';
import { getDepthByPos, mapCoordsToIsometricPixels } from '../utils';

export const addNormalFloorTile = (scene: MainScene, pos: Position) => {
  const ps = mapCoordsToIsometricPixels(pos.x, pos.y, {
    scale: scene.overallScale,
    width: scene.mapWidth,
    height: scene.mapHeight,
  });

  const img = scene.add
    .image(ps[0], ps[1], 'ground')
    .setScale(scene.defaultScales.block * scene.overallScale);
  img.setDepth(getDepthByPos(pos) / 100);
  const img_overlay = scene.add
    .image(ps[0], ps[1], 'ground-night')
    .setScale(scene.defaultScales.block * scene.overallScale)
    .setAlpha(0);
  img_overlay.setDepth(getDepthByPos(pos) / 100 + 1e-1);
  return [img, img_overlay];
};
