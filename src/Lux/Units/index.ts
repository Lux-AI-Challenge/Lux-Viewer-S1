import { Position } from "@lux-ai/2020-challenge/lib/GameMap/position";

import { Unit as LUnit } from '@lux-ai/2020-challenge/lib/Unit/index';
export class Unit {
  public id: string;
  public cooldown = 0;
  public type: LUnit.Type;
  public cargo: LUnit.Cargo = {
    wood: 0,
    coal: 0,
    uranium: 0,
  };
  public pos: Position;
  public team: LUnit.TEAM;
  constructor(x: number, y: number, team: LUnit.TEAM, type: LUnit.Type) {
    this.pos = new Position(x, y);
    this.team = team;
    this.type = type;
  }
  generatePixelCoords() {
    return [this.pos.x * 16 + 8, this.pos.y * 16+ 8];
  }
}