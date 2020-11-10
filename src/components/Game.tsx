import 'phaser';
import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import MainScene, { Frame, FrameTileData } from '../scenes/MainScene';
import { createGame } from '../game';
import PlayerStats from './PlayerStats';
import GameStats from './GameStats';
import {
  Button,
  CircularProgress,
  ButtonGroup,
  Card,
  CardContent,
  Slider,
  Grid,
} from '@material-ui/core';
import './styles.css';
import { LuxMatchConfigs, Unit } from '@lux-ai/2020-challenge/lib/es6';
import TileStats from './TileStats';
import debug_replay from '../scenes/replay.json';
import { hashToMapPosition, mapCoordsToIsometricPixels } from '../scenes/utils';

export const GameComponent = () => {
  const [notifWindowOpen, setNotifWindowOpen] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [running, setRunning] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [visualScale, setVisualScale] = useState(1);
  const [isReady, setReady] = useState(false);
  const [selectedTileData, setTileData] = useState<FrameTileData>(null);
  const [game, setGame] = useState<Phaser.Game>(null);
  const [main, setMain] = useState<MainScene>(null);
  const [configs, setConfigs] = useState<LuxMatchConfigs>(null);
  const [sliderConfigs, setSliderConfigs] = useState({
    step: 1,
    min: 0,
    max: 1000,
  });
  useEffect(() => {
    if (game) {
      game.events.on('setup', () => {
        const main: MainScene = game.scene.scenes[0];
        setMain(main);
        const configs = main.luxgame.configs;
        setConfigs(configs as LuxMatchConfigs);

        setSliderConfigs({
          min: 0,
          max: configs.parameters.MAX_DAYS,
          step: 1,
        });
        setReady(true);
      });
    }
  }, [game]);

  useEffect(() => {
    if (running && configs) {
      let currTurn = turn;
      const interval = setInterval(() => {
        if (currTurn >= configs.parameters.MAX_DAYS) {
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

  useEffect(() => {
    if (isReady) {
      moveToTurn(0);
    }
  }, [isReady]);
  useEffect(() => {
    if (main && visualScale) {
      main.overallScale = visualScale;
      moveToTurn(turn);
      // TODO: do a on scale change instead inside main
      main.floorImageTiles.forEach((tileImage, hash) => {
        const pos = hashToMapPosition(hash)
        const ps = mapCoordsToIsometricPixels(pos.x, pos.y, main.overallScale);
        tileImage.setScale(main.defaultScales.block * main.overallScale)
        tileImage.setX(ps[0])
        tileImage.setY(ps[1])
      });
    }
  }, [main, visualScale])
  const [turn, setTurn] = useState(0);
  const [currentFrame, setFrame] = useState<Frame>(null);
  const [uploading, setUploading] = useState(false);
  const handleChange = (_event: any, newValue: number) => {
    moveToTurn(newValue);
  };
  const fileInput = React.createRef<HTMLInputElement>();
  const moveToTurn = (turn: number) => {
    setTurn(turn);
    main.renderFrame(turn);
    setFrame(main.frames[turn]);
  };
  const handleUpload = () => {
    setUploading(true);
    if (fileInput.current.files.length) {
      const file = fileInput.current.files[0];
      const name = file.name;
      const meta = name.split('.');

      if (meta[meta.length - 1] === 'json') {
        file
          .text()
          .then(JSON.parse)
          .then((data) => {
            if (game) {
              game.destroy(true, false);
            }
            setReady(false);
            const newgame = createGame({
              replayData: data,
              handleUnitClicked,
              handleTileClicked,
            });
            setGame(newgame);
            setUploading(false);
          });
      }
    }
  };
  useEffect(() => {
    const newgame = createGame({
      replayData: debug_replay,
      handleUnitClicked,
      handleTileClicked,
    });
    setGame(newgame);
    setUploading(false);
  }, []);
  const renderUploadButton = () => {
    return (
      <Button variant="contained" component="label">
        Upload Replay{' '}
        <input
          accept=".json, .luxr"
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
          ref={fileInput}
        />
      </Button>
    );
  };
  const noUpload = !uploading && game === null;
  const gameLoading =
    (uploading && game === null) || (!isReady && game !== null);

  const handleUnitClicked = (data) => {
    console.log(data);
  };
  const handleTileClicked = (data) => {
    setTileData(data);
  };
  return (
    <div className="Game">
      <div className="gameContainer">
        <h1>Lux AI Challenge</h1>
        <Grid container spacing={3}>
          <Grid item xs={9}>
            <Card
              className={classnames({
                'phaser-wrapper': true,
                Loading: gameLoading,
              })}
            >
              <CardContent>
                {noUpload && renderUploadButton()}
                {gameLoading && <CircularProgress />}
                <div id="content"></div>
                <div className="play-buttons">
                  <Button className="play" color="primary" variant="contained" disabled={!isReady} onClick={() => {
                    setRunning(!running)
                  }}>
                    {running ? 'Pause' : 'Play'}
                  </Button>
                  <ButtonGroup disabled={!isReady}>
                    {[1, 2, 4, 8, 16].map((speed) => {
                      const variant = playbackSpeed === speed ? "contained" : "outlined";
                      return <Button color="primary" variant={variant} onClick={() => {
                        setPlaybackSpeed(speed);
                      }}>
                      {speed}x
                      </Button>
                    })}
                  </ButtonGroup>
                  <ButtonGroup disabled={!isReady}>
                    {[0.75, 1, 1.25, 1.5, 2].map((s) => {
                      const variant = visualScale === s ? "contained" : "outlined";
                      return <Button color="primary" variant={variant} onClick={() => {
                        setVisualScale(s);
                      }}>
                      {s}x Scale
                      </Button>
                    })}
                  </ButtonGroup>
                </div>
                <Slider
                  value={turn}
                  disabled={!isReady}
                  onChange={handleChange}
                  aria-labelledby="continuous-slider"
                  min={sliderConfigs.min}
                  step={sliderConfigs.step}
                  max={sliderConfigs.max}
                />
                <ButtonGroup color="primary">
                  <Button
                    disabled={!isReady}
                    onClick={() => {
                      moveToTurn(turn - 1);
                    }}
                  >
                    {'<'}
                  </Button>
                  <Button
                    disabled={!isReady}
                    onClick={() => {
                      moveToTurn(turn + 1);
                    }}
                  >
                    {'>'}
                  </Button>
                </ButtonGroup>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card className="stats">
              <CardContent>
                {selectedTileData && (
                  <TileStats
                    {...selectedTileData}
                    cities={currentFrame.cityData}
                  />
                )}
                <GameStats turn={turn} />
                {currentFrame !== null &&
                  [0, 1].map((team: Unit.TEAM) => {
                    return (
                      <PlayerStats
                        key={team}
                        workerUnits={currentFrame.teamStates[team].workers}
                        cartUnits={currentFrame.teamStates[team].carts}
                        cities={currentFrame.teamStates[team].citiesOwned.map(
                          (id) => {
                            const city = currentFrame.cityData.get(id);
                            return {
                              fuel: city.fuel,
                              cells: city.cityTilePositions.length,
                              cityid: id,
                            };
                          }
                        )}
                        team={team}
                      />
                    );
                  })}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            {!noUpload && renderUploadButton()}
          </Grid>
        </Grid>
      </div>
    </div>
  );
};
