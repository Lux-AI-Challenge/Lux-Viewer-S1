import React, { useEffect, useState } from 'react';
import { IconButton, Slider } from '@material-ui/core';
import ReplayButtonSVG from '../../icons/loading.svg';
import PlayButtonSVG from '../../icons/play.svg';
import PauseButtonSVG from '../../icons/pause.svg';
import ArrowsSVG from '../../icons/arrows.svg';
import UploadSVG from '../../icons/upload.svg';
import DayTimeSVG from '../../icons/daytime.svg';
import MoonSVG from '../../icons/moon.svg';
import './index.css';

export type ControllerProps = {
  turn: number;
  isReady: boolean;
  handleSliderChange: (
    event: React.ChangeEvent<{}>,
    value: number | number[]
  ) => void;
  sliderConfigs: { min: number; step: number; max: number };
  moveToTurn: Function;
  setRunning: Function;
  playbackSpeed: number;
  setPlaybackSpeed: Function;
  handleUpload: React.ChangeEventHandler<HTMLInputElement>;
  fileInput: any;
  running: boolean;
};

const Controller = ({
  turn,
  isReady,
  handleSliderChange,
  sliderConfigs,
  moveToTurn,
  setRunning,
  playbackSpeed,
  setPlaybackSpeed,
  handleUpload,
  fileInput,
  running,
}: ControllerProps) => {
  const isNightTime = turn % 40 >= 30 && turn !== 0;
  return (
    <div className="Controller">
      <div className="time-of-day">
        <img className="day-icon" src={isNightTime ? MoonSVG : DayTimeSVG} />
      </div>
      <div className="turn-label">
        <span>Turn {turn}</span>
      </div>
      <div className="time-display">
        <Slider
          className="slider"
          value={turn}
          onChange={handleSliderChange}
          aria-labelledby="continuous-slider"
          min={sliderConfigs.min}
          step={sliderConfigs.step}
          max={sliderConfigs.max}
        />
        {/* <div className="nighttime">
              <img className="night-icon" src={NightTimeSVG} />
              <span>Nighttime</span>
            </div> */}
      </div>
      <div className="replay-buttons">
        <IconButton
          aria-label="restart"
          onClick={() => {
            moveToTurn(0);
          }}
        >
          <img src={ReplayButtonSVG} />
        </IconButton>
        <IconButton
          aria-label="leftarrow"
          onClick={() => {
            setPlaybackSpeed(playbackSpeed / 2);
          }}
        >
          <img src={ArrowsSVG} />
        </IconButton>
        <IconButton
          aria-label="pause"
          className="pause-button"
          disabled={!isReady}
          onClick={() => {
            setRunning(!running);
          }}
        >
          <div className="pause-circle-2">
            <div className="pause-circle">
              {running ? (
                <img className="pause-icon" src={PauseButtonSVG} />
              ) : (
                <img className="play-icon" src={PlayButtonSVG} />
              )}
            </div>
          </div>
        </IconButton>
        <IconButton
          aria-label="rightarrow"
          onClick={() => {
            setPlaybackSpeed(playbackSpeed * 2);
          }}
        >
          <img className="right-arrow-icon" src={ArrowsSVG} />
        </IconButton>
        <div className="speed-display">{playbackSpeed}x</div>

        <input
          accept=".json, .luxr"
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
          ref={fileInput}
        />
        {/* <IconButton
          aria-label="upload"
          onClick={() => {
            fileInput.current.click();
          }}
        >
          <img className="upload-icon" src={UploadSVG} />
        </IconButton> */}
      </div>
    </div>
  );
};

export default Controller;
