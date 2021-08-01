import 'phaser';
import React, { KeyboardEvent, useEffect, useState } from 'react';
import MainScene, { Frame, FrameTileData } from '../scenes/MainScene';
import { createGame } from '../game';
import {
  Button,
  Switch,
  FormControlLabel,
  createMuiTheme,
  ThemeProvider,
  FormGroup,
} from '@material-ui/core';
import './styles.css';
import { LuxMatchConfigs, Game } from '@lux-ai/2021-challenge/lib/es6';
import TileStats from './TileStats';
import { hashToMapPosition, mapCoordsToIsometricPixels } from '../scenes/utils';
import GlobalStats from './GlobalStats';
import Controller from './Controller';
import ZoomInOut from './ZoomInOut';
import UploadSVG from '../icons/upload.svg';
import { parseReplayData } from '../utils/replays';
import clientConfigs from './configs.json';
export type GameComponentProps = {
  // replayData?: any;
};

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#fea201',
    },
    secondary: {
      main: '#3686FF',
    },
  },
});

export const GameComponent = () => {
  const [notifWindowOpen, setNotifWindowOpen] = useState(false);
  const [replayData, setReplayData] = useState(null);
  const [notifMsg, setNotifMsg] = useState('');
  const [running, setRunning] = useState(false);
  const [useKaggleReplay, setUseKaggleReplay] = useState(true);
  const [playbackSpeed, _setPlaybackSpeed] = useState(1);
  const setPlaybackSpeed = (speed: number) => {
    if (speed >= 0.5 && speed <= 32) {
      _setPlaybackSpeed(speed);
      main.speed = speed;
    }
  };
  const url = new URL(window.location.href);
  const searchlist = url.search.slice(1).split('&');
  let scale =
    searchlist.length > 0 && searchlist[0].split('=')[0] === 'scale'
      ? parseFloat(searchlist[0].split('=')[1])
      : 1.5;
  if (isNaN(scale)) {
    scale = 1.5;
  }
  let zoom = 1 / scale;
  let scaleSize = scale / 10;
  const [visualScale, _setVisualScale] = useState(scale / 4);
  const setVisualScale = (scale: number) => {
    if (scale >= scaleSize && scale <= 2) {
      _setVisualScale(scale);
    }
  };
  const [isReady, setReady] = useState(false);
  const [selectedTileData, setTileData] = useState<FrameTileData>(null);
  const [trackedUnitID, setTrackedUnitID] = useState<string>(null);
  const [game, setGame] = useState<Phaser.Game>(null);
  const [main, setMain] = useState<MainScene>(null);
  const [configs, setConfigs] = useState<LuxMatchConfigs>(null);
  const [sliderConfigs, setSliderConfigs] = useState({
    step: 1,
    min: 0,
    max: 1000,
  });

  const [turn, setTurn] = useState(0);
  const [currentFrame, setFrame] = useState<Frame>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = React.createRef<HTMLInputElement>();

  // If the game changes, put a setup callback to set up controller configs
  useEffect(() => {
    if (game) {
      game.events.on('setup', () => {
        // @ts-ignore
        const main: MainScene = game.scene.scenes[0];
        setMain(main);
        const configs = main.luxgame.configs;
        setConfigs(configs as LuxMatchConfigs);

        setSliderConfigs({
          min: 0,
          max: Math.min(configs.parameters.MAX_DAYS, main.frames.length - 1),
          step: 1,
        });
        setReady(true);
      });
    }
  }, [game]);

  // If play is toggled (running) or playback speed is changed, we update the playback
  useEffect(() => {
    if (running && configs) {
      let currTurn = turn;
      const interval = setInterval(() => {
        if (
          currTurn >=
          Math.min(configs.parameters.MAX_DAYS, main.frames.length - 1)
        ) {
          setRunning(false);
          return;
        }
        moveToTurn(currTurn);
        currTurn += 1;
        setTurn(currTurn);
      }, 1000 / playbackSpeed);
      return () => clearInterval(interval);
    }
  }, [running, playbackSpeed]);

  // if game loaded is ready, move to turn 0 and load that turn's frame
  useEffect(() => {
    if (isReady) {
      moveToTurn(0);
    }
  }, [isReady]);

  // whenever the main scene is changed or visualScale is changed, call main to change the visual scale appropriately.
  useEffect(() => {
    if (main && visualScale) {
      main.overallScale = visualScale;
      if (main.activeImageTile) {
        // main.activeImageTile.setY(main.originalTileY);
        // main.activeImageTile.clearTint();
        // main.activeImageTile = null;
        // main.originalTileY
      }
      // move to current turn to rerender all objects appropriately
      moveToTurn(turn);
      // TODO: do a on scale change instead inside main
      main.floorImageTiles.forEach((info, hash) => {
        [info.source, info.overlay, info.roadOverlay].forEach(
          (tileImage, i) => {
            const pos = hashToMapPosition(hash);
            const ps = mapCoordsToIsometricPixels(pos.x, pos.y, {
              scale: main.overallScale,
              width: main.mapWidth,
              height: main.mapHeight,
            });
            tileImage.setScale(main.defaultScales.block * main.overallScale);
            tileImage.setX(ps[0]);
            tileImage.setY(ps[1]);
            if (tileImage == main.activeImageTile) {
              main.originalTileY = tileImage.y;
            }
            if (tileImage == main.hoverImageTile) {
              main.originalHoverImageTileY = tileImage.y;
            }
          }
        );
      });
    }
  }, [main, visualScale]);

  /** handle the change of the slider to move turns */
  const handleSliderChange = (_event: any, newValue: number) => {
    setRunning(false);
    moveToTurn(newValue);
  };

  /** Move to a specific turn and render that turn's frame */
  const moveToTurn = (turn: number) => {
    setTurn(turn);
    main.renderFrame(turn);
    setFrame(main.frames[turn]);
    //render the right bg color
    const colors = [
      '00AFBD',
      '438D91',
      '846D68',
      'A55D53',
      '704A60',
      '4D3D59',
      '2C2E33',
    ];
    const canvasWrapper = document
      .getElementById('content')
      .getElementsByTagName('canvas')[0];
    const dayLength = main.luxgame.configs.parameters.DAY_LENGTH;
    const cycleLength =
      dayLength + main.luxgame.configs.parameters.NIGHT_LENGTH;
    let idx = 0;
    if (
      turn % cycleLength >= dayLength - 5 &&
      turn % cycleLength < dayLength + 1
    ) {
      idx = (turn % cycleLength) - (dayLength - 5) + 1;
    } else if (
      turn % cycleLength >= dayLength + 1 &&
      turn % cycleLength < cycleLength - 1
    ) {
      idx = 6;
    } else if (turn % cycleLength >= cycleLength - 1) {
      idx = 5;
    } else if (turn % cycleLength < 5 && turn > 5) {
      idx = 6 - ((turn % cycleLength) + 2);
    }
    console.log({ canvasWrapper });
    canvasWrapper.style.transition = `background-color linear ${
      1 / main.speed
    }s`;
    canvasWrapper.style.backgroundColor = `#${colors[idx]}`;
  };

  /** track a unit by id */
  const trackUnit = (id: string) => {
    setTrackedUnitID(id);
    main.untrackUnit();
    main.trackUnit(id);
  };

  /** load game given json replay data */
  const loadGame = (jsonReplayData: any, skipVersionCheck = false) => {
    if (!skipVersionCheck) {
      if (
        jsonReplayData.version === undefined ||
        jsonReplayData.version !== clientConfigs.version
      ) {
        if (jsonReplayData.version === undefined) {
          alert('No version associated with replay data, cannot load');
          return;
        }
        const versionvals = jsonReplayData.version.split('.');
        if (
          versionvals[0] !== clientConfigs.version[0] ||
          versionvals[1] !== clientConfigs.version[2]
        ) {
          alert(
            `Replay file works on version ${versionvals[0]}.${versionvals[1]}.x but client is on version ${clientConfigs.version}. The visualizer will most likely not work correctly. Download an older visualizer here to watch the replay: https://github.com/Lux-AI-Challenge/LuxViewer2021/releases`
          );
          return;
        }
      }
    }
    if (game) {
      game.destroy(true, false);
    }
    setReady(false);
    setReplayData(jsonReplayData);
    const newgame = createGame({
      replayData: jsonReplayData,
      handleTileClicked,
      handleUnitTracked,
      zoom,
    });
    setGame(newgame);
  };

  /** handle uploaded files */
  const handleUpload = () => {
    setUploading(true);
    setUseKaggleReplay(false);
    if (fileInput.current.files.length) {
      const file = fileInput.current.files[0];
      const name = file.name;
      const meta = name.split('.');

      if (meta[meta.length - 1] === 'json') {
        file
          .text()
          .then(JSON.parse)
          .then((data) => {
            setUploading(false);
            data = parseReplayData(data);
            loadGame(data);
          })
          .catch((err) => {
            console.error(err);
            alert(err);
          });
      }
    }
  };
  useEffect(() => {
    //@ts-ignore
    if (window.kaggle) {
      // check if window.kaggle.environment is valid and usable
      if (
        //@ts-ignore
        window.kaggle.environment &&
        //@ts-ignore
        window.kaggle.environment.steps.length > 1
      ) {
        console.log('Embedded kaggle replay detected, parsing it');
        //@ts-ignore
        let replay = window.kaggle.environment;
        replay = parseReplayData(replay);
        loadGame(replay);
      } else {
        console.log(
          'Kaggle detected, but no replay, listening for postMessage'
        );
        // add this listener only once
        window.addEventListener(
          'message',
          (event) => {
            // Ensure the environment names match before updating.
            try {
              if (event.data.environment.name == 'lux_ai_2021') {
                // updateContext(event.data);
                let replay = event.data.environment;
                console.log('post message:');
                console.log(event.data);
                replay = parseReplayData(replay);
                loadGame(replay, true);
                const el = document.getElementsByTagName('html');
                if (window.innerWidth * 0.65 <= 768) {
                  el[0].style.fontSize = '6pt';
                }
                if (window.innerWidth * 0.65 <= 1280) {
                  el[0].style.fontSize = '8pt';
                }
              }
            } catch (err) {
              console.error('Could not parse game');
              console.error(err);
            }
          },
          false
        );
      }
    }
    // change root font size depending on window size
    const el = document.getElementsByTagName('html');
    if (window.innerWidth <= 768) {
      // set the font size of root html smaller since this is being viewed on the kaggle page
      el[0].style.fontSize = '6pt';
    } else if (window.innerWidth <= 1280) {
      el[0].style.fontSize = '8pt';
    }
    // loadGame(debug_replay);
  }, []);
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          setPlaybackSpeed(playbackSpeed * 2);
          break;
        case 'ArrowDown':
          setPlaybackSpeed(playbackSpeed / 2);
          break;
        case 'ArrowRight':
          setRunning(false);
          if (
            turn < Math.min(configs.parameters.MAX_DAYS, main.frames.length - 1)
          ) {
            moveToTurn(turn + 1);
          }
          break;
        case 'ArrowLeft':
          setRunning(false);
          if (turn > 0) {
            moveToTurn(turn - 1);
          }
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [turn, playbackSpeed, main, configs]);

  const handleTileClicked = (data: FrameTileData) => {
    setTileData(data);
    // deal with unit tracking, which unfortunately has data fragmented between react and the phaser scene
  };
  const handleUnitTracked = (id: string) => {
    setTrackedUnitID(id);
  };

  const [debugOn, _setDebug] = useState(true);
  const setDebug = (
    e: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    _setDebug(checked);
    main.debug = checked;
    moveToTurn(turn);
  };
  const renderDebugModeButton = () => {
    return (
      <FormGroup row className="debug-mode-button-wrapper">
        <FormControlLabel
          control={
            <Switch checked={debugOn} onChange={setDebug} name="checkedA" />
          }
          label="Debug Mode"
        />
      </FormGroup>
    );
  };
  return (
    <div className="Game">
      <ThemeProvider theme={theme}>
        <div id="content"></div>
        {!isReady && (
          <div className="upload-no-replay-wrapper">
            <p>Welcome to the Lux AI Season 1 Visualizer</p>
            <div>
              <Button
                className="upload-btn"
                color="secondary"
                variant="contained"
                onClick={() => {
                  fileInput.current.click();
                }}
              >
                <span className="upload-text">Upload a replay</span>
                <img className="upload-icon-no-replay" src={UploadSVG} />
              </Button>
              <p></p>
              <input
                accept=".json, .luxr"
                type="file"
                style={{ display: 'none' }}
                onChange={handleUpload}
                ref={fileInput}
              />
            </div>
          </div>
        )}
        <div id="version-number">
          <strong>Version: </strong>
          {clientConfigs.version}
        </div>
        {isReady && (
          <div>
            <Controller
              turn={turn}
              moveToTurn={moveToTurn}
              handleUpload={handleUpload}
              running={running}
              isReady={isReady}
              setRunning={setRunning}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              fileInput={fileInput}
              sliderConfigs={sliderConfigs}
              handleSliderChange={handleSliderChange}
            />
            {debugOn && currentFrame.annotations.length > 0 && (
              <div className="debug-sidetext">
                <h4>Debug Text</h4>
                {currentFrame.annotations
                  .filter((v) => {
                    return (
                      v.command.length > 2 &&
                      v.command.split(' ')[0] ===
                        Game.ACTIONS.DEBUG_ANNOTATE_SIDETEXT
                    );
                  })
                  .sort((v) => v.agentID)
                  .map((v) => {
                    return (
                      <div className={`sidetext-${v.agentID}`}>
                        {v.command.split(' ').slice(1).join(' ').split("'")[1]}
                      </div>
                    );
                  })}
              </div>
            )}
            <div className="tile-stats-wrapper">
              {selectedTileData ? (
                <TileStats
                  {...selectedTileData}
                  cities={currentFrame.cityData}
                  trackUnit={trackUnit}
                  trackedUnitID={trackedUnitID}
                />
              ) : (
                <TileStats
                  empty
                  trackUnit={trackUnit}
                  trackedUnitID={trackedUnitID}
                />
              )}
            </div>
            <div className="global-stats-wrapper">
              {main && (
                <GlobalStats
                  currentFrame={currentFrame}
                  turn={turn}
                  accumulatedStats={main.accumulatedStats}
                  teamDetails={replayData.teamDetails}
                  staticGlobalStats={main.globalStats}
                />
              )}
            </div>
            {renderDebugModeButton()}
            <ZoomInOut
              className="zoom-in-out"
              handleZoomIn={() => {
                setVisualScale(visualScale + scaleSize);
              }}
              handleZoomOut={() => {
                setVisualScale(visualScale - scaleSize);
              }}
            />
            <div className="map-meta-wrapper">
              <p>
                <strong>Map Size:</strong>{' '}
                {(main.pseudomatch.state.game as Game).map.width}x
                {(main.pseudomatch.state.game as Game).map.height}
              </p>
              <p>
                <strong>Map Seed:</strong>{' '}
                {(main.pseudomatch.state.game as Game).configs.seed}
              </p>
            </div>
          </div>
        )}
      </ThemeProvider>
    </div>
  );
};
