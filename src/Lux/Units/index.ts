export class Unit {
  public id: string;
  public cooldown = 0;
  public cargo: Unit.Cargo = {
    wood: 0,
    coal: 0,
    uranium: 0,
  };
  public pos: Position;
}