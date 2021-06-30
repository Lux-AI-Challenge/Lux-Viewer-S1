# Lux AI Challenge: Season 1 Visualizer

This is the codebase for the Season 1 competition visualizer. The latest version is hosted on https://2021vis.lux-ai.org/. To download a local or past version, check out [the releases](https://github.com/Lux-AI-Challenge/LuxViewer2021/releases/)

To run the visualizer locally, first unzip the release and it should create a folder called dist. Then install the serve package via

```
npm i -g serve
```

Then run

```
serve dist
```

And you should be able to navigate to http://localhost:5000 to use the visualizer, upload replays, and watch them, and begin to analyze matches!

![](./game_replay.gif)

## Features

- Click and drag or press the WASD keys to pan around the map
- Zoom in or out of the map as necessary
- Play back the movement of units smoothly
- See statistics and graphs on your bots
- Open the dev console on the browser to see any warnings/errors your agent encounters each turn
- Toggle a debug mode that lets you visualize annotations your bot writes within the match

## Development

Run `npm run dev` to start server and go to http://localhost:3000/dist

You will also need to copy the `assets/` folder to `dist/`

Make sure whenever a change is made, the versioning is changed in configs.json.

Whenever the game engine has a breaking change, update the major version number.
