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
  //TODO 450 and 150 are hardcoded, hard to make responsive
  // px
  // py -= (scale * 1280) / 2;
  const f = 35 * 2 * map.scale;

  // TODO, why are these backward??
  let _y =
    (px - (angleFactor / (angleFactor - 1)) * py) / (-2 * f) +
    map.height / 2 -
    1;
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
