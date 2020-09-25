import { GameMap } from '@lux-ai/2020-challenge';
import { Position } from '@lux-ai/2020-challenge/lib/GameMap/position';

export const mapPosToPixels = (pos: Position): [number, number] => {
  return mapCoordsToPixels(pos.x, pos.y);
};

export const mapCoordsToPixels = (x: number, y: number): [number, number] => {
  return [x * 32 + 16, y * 32 + 16];
};

export const hashMapCoords = (pos: Position, map: GameMap): number => {
  // return pos.x * Math.max(map.width, map.height) + pos.y;
  if (map.width > map.height) {
    return pos.x * map.width + pos.y;
  } else {
    return pos.y * map.height + pos.x;
  }
}

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
