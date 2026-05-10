/**
 * Main Entry Point - main.js
 * Initializes the Game state and starts the logic/render loop.
 */
import Game from './classes/Game.js';

window.addEventListener('load', () => {
  const game = new Game();
  
  // Initial screen state
  game.showStartScreen();
  
  // Kick off the loop
  game.loop();
  
  console.log("☕ Frantic Barista: Engine Started.");
});
