import React from 'react';
import { GameComponent } from './components/Game';
import './styles/index.css';
import debug_replay from './scenes/replay.json';
export default function App() {
  return (
    <div className="all-content">
      <GameComponent />
    </div>
  );
}
