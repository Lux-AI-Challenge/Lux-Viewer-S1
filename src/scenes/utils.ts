import { GameMap } from '@lux-ai/2021-challenge/lib/es6/GameMap';
import { Position } from '@lux-ai/2021-challenge/lib/es6/GameMap/position';
import { GameObjects } from 'phaser';

const angleFactor = 2.4;

export const mapCoordsToIsometricPixels = (
  x: number,
  y: number,
  map: { scale: number; width: number; height: number }
): [number, number] => {
  const f = 35 * 2 * map.scale; // based on tile size
  return [
    0 + x * f - f * y,
    0 + (y - map.height / 2) * f + f * x - ((x + y) * f) / angleFactor,
  ];
};
export const mapPosToIsometricPixels = (
  pos: Position,
  map: { scale: number; width: number; height: number }
): [number, number] => {
  return mapCoordsToIsometricPixels(pos.x, pos.y, map);
};

export const mapIsometricPixelsToPosition = (
  px: number,
  py: number,
  map: { scale: number; width: number; height: number }
): Position => {
  const f = 35 * 2 * map.scale;
  let g = 1.5;
  if (map.width === 12) g = 0.5;
  else if (map.width === 16) g = 1;
  else if (map.width === 24) g = 1.5;
  else if (map.width === 32) g = 2;
  let _y =
    (px - (angleFactor / (angleFactor - 1)) * py) / (-2 * f) +
    map.height / 2 -
    g;
  let _x = px / f + _y;
  return new Position(Math.round(_x), Math.round(_y));
};

export const hashMapCoords = (pos: Position): number => {
  // return pos.x * Math.max(map.width, map.height) + pos.y;
  return pos.x * 10e5 + pos.y;
};

export const hashToMapPosition = (hash: number): Position => {
  return new Position(Math.floor(hash / 10e5), hash % 10e5);
};

export const getDepthByPos = (pos: Position): number => {
  return 5 + (pos.x + 0.1) * (pos.y + 0.1) * 100;
};

export const memorySizeOf = (obj: any) => {
  var bytes = 0;

  function sizeOf(obj: any) {
    if (obj !== null && obj !== undefined) {
      switch (typeof obj) {
        case 'number':
          bytes += 8;
          break;
        case 'string':
          bytes += obj.length * 2;
          break;
        case 'boolean':
          bytes += 4;
          break;
        case 'object':
          var objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === 'Object' || objClass === 'Array') {
            for (var key in obj) {
              if (!obj.hasOwnProperty(key)) continue;
              sizeOf(obj[key]);
            }
          } else bytes += obj.toString().length * 2;
          break;
      }
    }
    return bytes;
  }

  function formatByteSize(bytes: number) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + ' KiB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + ' MiB';
    else return (bytes / 1073741824).toFixed(3) + ' GiB';
  }

  return formatByteSize(sizeOf(obj));
};

export const getRoadType = (adjacency: boolean[]): string => {
  let bin = '';
  adjacency.forEach((b) => {
    bin += b ? '1' : '0';
  });
  return 'path' + bin;
};

export const getNightTransitionTween = (
  sprite: GameObjects.Image,
  speed: number,
  alpha: number
) => {
  return {
    targets: sprite,
    alpha,
    ease: 'Linear',
    duration: 1000 / speed,
    repeat: 0,
    yoyo: false,
  };
};
