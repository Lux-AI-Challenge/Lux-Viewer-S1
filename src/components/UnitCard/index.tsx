import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';
import React, { useState } from 'react';
import './styles.css';
import { FrameSingleUnitData } from '../../scenes/MainScene';
import Team0WorkerSVG from '../../icons/team0worker.svg';
import Team1WorkerSVG from '../../icons/team1worker.svg';
import Team0CartSVG from '../../icons/team0cart.svg';
import Team1CartSVG from '../../icons/team1cart.svg';
import InfoSVG from '../../icons/info.svg';
import CloseIcon from '@material-ui/icons/Close';
import { Unit } from '@lux-ai/2021-challenge/lib/es6/Unit';
import {
  IconButton,
  LinearProgress,
  makeStyles,
  Modal,
} from '@material-ui/core';
export type UnitCardProps = FrameSingleUnitData & { turn: number };

const useStyles = makeStyles({
  progressa: {
    backgroundColor: 'orange',
  },
  progressb: {
    backgroundColor: 'blue',
  },
});
const UnitCard = ({
  cargo,
  pos,
  id,
  cooldown,
  team,
  type,
  commands,
  turn,
}: UnitCardProps) => {
  const classes = useStyles();
  const [historyPanelOpen, sethistoryPanelOpen] = useState(false);
  const renderUnitSVG = () => {
    let svg = Team1WorkerSVG;
    if (type === Unit.Type.WORKER) {
      if (team === 0) {
        svg = Team0WorkerSVG;
      }
    } else {
      svg = Team1CartSVG;
      if (team === 0) {
        svg = Team0CartSVG;
      }
    }

    return <img src={svg} />;
  };
  let maxCooldown = 4;
  if (type == Unit.Type.CART) {
    maxCooldown = 6;
  }
  const openHistoryPanel = () => {
    sethistoryPanelOpen(true);
  };
  const handleCloseHistoryPanel = () => {
    sethistoryPanelOpen(false);
  };
  return (
    <div className="UnitCard">
      <Modal
        open={historyPanelOpen}
        onClose={handleCloseHistoryPanel}
        aria-labelledby="unit-history-panel-title"
        id="unit-history-modal"
        hideBackdrop
      >
        <div id="unit-history-panel">
          <h2 id="unit-history-panel-title">Command History</h2>
          <div id="unit-history-unit-icon-wrapper">{renderUnitSVG()}</div>
          <IconButton
            aria-label="close"
            id="unit-history-close-button"
            onClick={handleCloseHistoryPanel}
          >
            <CloseIcon />
          </IconButton>
          <div id="unit-history-content">
            {commands
              .filter((command) => command.turn <= turn)
              .sort((a, b) => b.turn - a.turn)
              .map((command) => {
                const renders = command.actions.map((s, i) => {
                  return (
                    <p className="command-row" key={`${i}-${s}`}>
                      Turn: {command.turn} - {s}
                    </p>
                  );
                });
                return <div key={command.turn}>{renders}</div>;
              })}
          </div>
        </div>
      </Modal>
      <div className="unit-id">
        <strong>ID:</strong> {id}
        <IconButton
          aria-label="unit-history"
          className="unit-history-button"
          onClick={() => {
            openHistoryPanel();
          }}
        >
          <img className="unit-history-icon" src={InfoSVG}></img>
        </IconButton>
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
            {cooldown} / {maxCooldown}
          </span>
        </div>

        <LinearProgress
          className={
            (team === Unit.TEAM.A ? 'cooldown-a' : 'cooldown-b') +
            ' cooldown-bar'
          }
          variant="determinate"
          value={(cooldown * 100) / maxCooldown}
        />
      </div>
    </div>
  );
};
export default UnitCard;
