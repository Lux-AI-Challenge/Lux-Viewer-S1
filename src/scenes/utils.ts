import { GameMap } from '@lux-ai/2020-challenge/lib/es6/GameMap';
import { Position } from '@lux-ai/2020-challenge/lib/es6/GameMap/position';

export const mapPosToPixels = (pos: Position): [number, number] => {
  return mapCoordsToPixels(pos.x, pos.y);
};

export const mapCoordsToPixels = (x: number, y: number): [number, number] => {
  return [x * 32 + 16, y * 32 + 16];
};

export const mapCoordsToIsometricPixels = (
  x: number,
  y: number
): [number, number] => {
  const f = 26;
  return [600 + x * f - f * y, 150 + y * f + f * x - ((x + y) * f) / 2];
};
export const mapPosToIsometricPixels = (pos: Position): [number, number] => {
  return mapCoordsToIsometricPixels(pos.x, pos.y);
};

export const mapIsometricPixelsToPosition = (
  px: number,
  py: number
): Position => {
  px -= 600;
  py -= 150;
  const f = 26;

  // TODO, why are these backward??
  let _x = (px - 2 * py) / (-2 * f);
  let _y = (2 * (py - (f * _x) / 2)) / f;
  return new Position(Math.ceil(_y), Math.ceil(_x));
};

export const hashMapCoords = (pos: Position): number => {
  // return pos.x * Math.max(map.width, map.height) + pos.y;
  return pos.x * 10e5 + pos.y;
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
