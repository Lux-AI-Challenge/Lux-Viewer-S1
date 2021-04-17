import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React from 'react';
import './styles.css';
import { FrameSingleUnitData } from '../../scenes/MainScene';
import Team0WorkerSVG from '../../icons/team0worker.svg';
import Team1WorkerSVG from '../../icons/team1worker.svg';
import { Unit } from '@lux-ai/2020-challenge/lib/es6/Unit';
import { LinearProgress, makeStyles } from '@material-ui/core';
export type UnitCardProps = FrameSingleUnitData;

const useStyles = makeStyles({
  progressa: {
    backgroundColor: 'orange',
  },
  progressb: {
    backgroundColor: 'blue',
  },
});
const UnitCard = ({ cargo, pos, id, cooldown, team, type }: UnitCardProps) => {
  const classes = useStyles();
  const renderUnitSVG = () => {
    let svg = Team1WorkerSVG;
    if (type === Unit.Type.WORKER) {
      if (team === 0) {
        svg = Team0WorkerSVG;
      }
    } else {
      svg = Team1WorkerSVG;
      if (team === 0) {
        svg = Team0WorkerSVG;
      }
    }

    return <img src={svg} />;
  };
  return (
    <div className="UnitCard">
      <div className="unit-id">
        <strong>ID:</strong> {id}
      </div>
      <div className="worker-icon-wrapper">{renderUnitSVG()}</div>
      <div className="worker-data">
        <p>
          <strong>Pos:</strong>{' '}
          <span>
            ({pos.x}, {pos.y})
          </span>
        </p>
        <p>
          <strong>Wood:</strong> <span>{cargo.wood}</span>
        </p>
        <p>
          <strong>Coal:</strong> <span>{cargo.coal}</span>
        </p>
        <p>
          <strong>Uranium:</strong> <span>{cargo.uranium}</span>
        </p>
      </div>
      <div className="cooldown-bar-wrapper">
        <div className="cooldown-value-wrapper">
          <span className="cooldown-title">
            <strong>Cooldown:</strong>
          </span>{' '}
          <span className="cooldown-value">
            {cooldown} / {3}
          </span>
        </div>

        <LinearProgress
          className={
            (team === Unit.TEAM.A ? 'cooldown-a' : 'cooldown-b') +
            ' cooldown-bar'
          }
          variant="determinate"
          value={20}
        />
      </div>
    </div>
  );
};
export default UnitCard;
