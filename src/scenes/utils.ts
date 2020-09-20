import { Position } from '@lux-ai/2020-challenge';

export const mapPosToPixels = (pos: Position): [number, number] => {
  return mapCoordsToPixels(pos.x, pos.y);
};

export const mapCoordsToPixels = (x: number, y: number): [number, number] => {
  return [x * 32 + 16, y * 32 + 16];
};
