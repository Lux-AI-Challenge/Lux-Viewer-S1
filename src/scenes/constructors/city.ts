import MainScene, { FrameSingleCityTileData } from '../MainScene';
import {
  getDepthByPos,
  getNightTransitionTween,
  hashMapCoords,
  mapPosToIsometricPixels,
} from '../utils';
import seedrandom from 'seedrandom';
import { Position } from '@lux-ai/2021-challenge/lib/es6';

export const addCityTile = (
  scene: MainScene,
  data: FrameSingleCityTileData,
  tilesWithUnits: Set<number>,
  turn = 0
) => {
  const p = mapPosToIsometricPixels(data.pos, {
    scale: scene.overallScale,
    width: scene.mapWidth,
    height: scene.mapHeight,
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

  // handle determining alpha for night version

  let [startAlpha, endAlpha] = scene.determineNightTransitionAlphas(turn);

  const img = scene.add
    .image(p[0], p[1], cityTileType)
    .setDepth(getDepthByPos(data.pos))
    .setScale(scene.defaultScales.city * scene.overallScale);
  let ny = img.y;
  let nx = img.x;
  const img_overlay = scene.add
    .image(p[0], p[1], cityTileType + 'night')
    .setDepth(getDepthByPos(data.pos) + 1e-1)
    .setScale(scene.defaultScales.city * scene.overallScale)
    .setAlpha(startAlpha);
  scene.tweens.add(getNightTransitionTween(img_overlay, scene.speed, endAlpha));

  switch (data.team + variant) {
    case '00':
    case '01':
      ny = img.y - 80 * scene.defaultScales.city * scene.overallScale;
      nx = img.x + 10 * scene.defaultScales.city * scene.overallScale;
      break;
    case '02':
    case '03':
      ny = img.y - 120 * scene.defaultScales.city * scene.overallScale;
      nx = img.x + 10 * scene.defaultScales.city * scene.overallScale;
      break;
    case '10':
    case '11':
      ny = img.y - 100 * scene.defaultScales.city * scene.overallScale;
      break;
    case '12':
    case '13':
      ny = img.y - 140 * scene.defaultScales.city * scene.overallScale;
      break;
  }
  img.setY(ny);
  img.setX(nx);
  img_overlay.setY(ny);
  img_overlay.setX(nx);

  return [img, img_overlay];
};
