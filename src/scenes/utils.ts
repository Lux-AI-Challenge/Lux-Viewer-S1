import { GameMap } from '@lux-ai/2020-challenge/lib/es6/GameMap';
import { Position } from '@lux-ai/2020-challenge/lib/es6/GameMap/position';

export const mapPosToPixels = (pos: Position): [number, number] => {
  return mapCoordsToPixels(pos.x, pos.y);
};

export const mapCoordsToPixels = (x: number, y: number): [number, number] => {
  return [x * 32 * 4 + 16, y * 32 * 4 + 16];
};

const angleFactor = 2.4;

export const mapCoordsToIsometricPixels = (
  x: number,
  y: number,
  scale: number
): [number, number] => {
  const f = 35 * 2 * scale; // based on tile size
  return [
    1280 + x * f - f * y,
    1280 / 2 + y * f + f * x - ((x + y) * f) / angleFactor,
  ];
};
export const mapPosToIsometricPixels = (
  pos: Position,
  scale: number
): [number, number] => {
  return mapCoordsToIsometricPixels(pos.x, pos.y, scale);
};

export const mapIsometricPixelsToPosition = (
  px: number,
  py: number,
  scale: number
): Position => {
  //TODO 450 and 150 are hardcoded, hard to make responsive
  px -= 1280;
  py -= 1280 / 2;
  const f = 35 * 2 * scale;

  // TODO, why are these backward??
  let _y = (px - (angleFactor / (angleFactor - 1)) * py) / (-2 * f);
  let _x = px / f + _y;
  return new Position(Math.ceil(_x), Math.ceil(_y));
};

export const hashMapCoords = (pos: Position): number => {
  // return pos.x * Math.max(map.width, map.height) + pos.y;
  return pos.x * 10e5 + pos.y;
};

export const hashToMapPosition = (hash: number): Position => {
  return new Position(Math.floor(hash / 10e5), hash % 10e5);
};

export const getDepthByPos = (pos: Position): number => {
  return 5 + (pos.x * pos.y) / 1000;
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
