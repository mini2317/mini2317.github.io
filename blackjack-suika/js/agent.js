class Agent {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.interval = null;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            console.log("Agent Started");
            this.interval = setInterval(() => this.think(), 1000);
        } else {
            console.log("Agent Stopped");
            clearInterval(this.interval);
        }
    }

    think() {
        if (!this.game.canDrop || this.game.isGameOver) return;

        // Simple Random Strategy for now
        // A better strategy would check the height of piles
        const width = CONFIG.WIDTH;
        const x = Math.random() * (width - 60) + 30;

        this.game.dropBall(x);
    }
}

// Global Agent Instance
window.agent = new Agent(window.game);

// Add key listener to toggle agent
document.addEventListener('keydown', (e) => {
    if (e.key === 'q') {
        window.agent.toggle();
    }
});
