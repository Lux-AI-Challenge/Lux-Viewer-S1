import React from 'react';
import './styles.css';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton, Modal } from '@material-ui/core';
export type WarningsPanelProps = {
  warnings: string[];
  turn: number;
  panelOpen: boolean;
  closePanel: () => void;
};
const WarningsPanel = ({
  warnings,
  turn,
  closePanel,
  panelOpen,
}: WarningsPanelProps) => {
  return (
    <div className="WarningsModal">
      <Modal
        open={panelOpen}
        onClose={closePanel}
        aria-labelledby="warnings-panel-title"
        id="warnings-modal"
        hideBackdrop
      >
        <div id="warnings-panel">
          <h2 id="warnings-panel-title">
            {turn > 0
              ? warnings.length > 0
                ? `Warnings on previous turn ${turn - 1}`
                : `No warnings on previous turn ${turn - 1}`
              : 'No Warnings'}
          </h2>
          <IconButton
            aria-label="close"
            id="warnings-close-button"
            onClick={closePanel}
          >
            <CloseIcon />
          </IconButton>
          <div id="warnings-content">
            {warnings.map((v, i) => {
              return (
                <p className="command-row" key={`${i}`}>
                  {v}
                </p>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default WarningsPanel;
