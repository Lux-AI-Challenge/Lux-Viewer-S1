import { Position, Unit } from '@lux-ai/2021-challenge/lib/es6';
import MainScene from '../MainScene';
import { getDepthByPos, mapCoordsToIsometricPixels } from '../utils';

/**
 * Add worker sprite for use by any frame
 *
 * removes an existing one if id matches
 */
export const addWorkerSprite = (
  scene: MainScene,
  x: number,
  y: number,
  team: Unit.TEAM,
  id: string,
  outline = false
) => {
  const p = mapCoordsToIsometricPixels(x, y, {
    scale: scene.overallScale,
    width: scene.mapWidth,
    height: scene.mapHeight,
  });
  const sprite = scene.add
    .sprite(p[0], p[1], 'worker-' + team + (outline ? '-outline' : ''))
    .setScale(scene.defaultScales.worker * scene.overallScale);
  sprite.setDepth(getDepthByPos(new Position(x, y)) + 2);
  if (scene.unitSprites.has(id)) {
    const { sprite } = scene.unitSprites.get(id);
    sprite.destroy();
  }
  scene.unitSprites.set(id, { sprite, originalPosition: new Position(x, y) });
  return sprite;
};

/**
 * Add cart sprite for use by any frame
 */
export const addCartSprite = (
  scene: MainScene,
  x: number,
  y: number,
  team: Unit.TEAM,
  id: string
) => {
  const p = mapCoordsToIsometricPixels(x, y, {
    scale: scene.overallScale,
    width: scene.mapWidth,
    height: scene.mapHeight,
  });
  const sprite = scene.add
    .sprite(p[0], p[1], 'cart-' + team)
    .setScale(scene.defaultScales.cart * scene.overallScale);
  sprite.setDepth(getDepthByPos(new Position(x, y)));
  scene.unitSprites.set(id, { sprite, originalPosition: new Position(x, y) });
  return sprite;
};
