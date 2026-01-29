document.addEventListener('DOMContentLoaded', () => {
    // Initialize Game
    const game = new Game('world', 'score', 'high-score', 'next-piece-display');

    // Start Game
    game.start();

    // Expose for debugging/Agent
    window.game = game;
});
