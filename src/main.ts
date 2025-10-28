import { Game } from './Game';

document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        const game = new Game(gameContainer);
        game.start();
    }
});
