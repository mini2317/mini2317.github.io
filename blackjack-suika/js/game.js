// Matter.js aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events,
    Mouse = Matter.Mouse,
    Vector = Matter.Vector,
    Query = Matter.Query;

class Game {
    constructor(canvasId, scoreId, highScoreId, nextPieceId) {
        this.canvas = document.getElementById(canvasId);
        this.ui = {
            score: document.getElementById(scoreId),
            highScore: document.getElementById(highScoreId),
            nextDisplay: document.getElementById(nextPieceId),
            nextList: document.getElementById('next-queue-list'),
            nextLabel: document.getElementById('label-next'),
            scoreLabel: document.getElementById('label-score'),
            highScoreLabel: document.getElementById('label-highscore'),
            hint: document.getElementById('hint-text'),
            switchBtn: document.getElementById('btn-switch'),
            switchTooltip: document.getElementById('switch-tooltip'),
            bombBtn: document.getElementById('btn-bomb'),
            bombTooltip: document.getElementById('bomb-tooltip'),
            danger: document.getElementById('danger-overlay')
        };

        // State
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('bj-suika-highscore') || 0);
        this.ui.highScore.innerText = this.highScore;
        this.lang = 'KR';
        this.particles = [];

        this.switchCount = 0;
        this.bombCount = 0;
        this.isSwitchMode = false;
        this.isBombMode = false;
        this.selectedBall = null;
        this.hasDropped = false;
        this.dropCount = 0;
        this.dangerY = CONFIG.DANGER_LINE_Y;

        // Queue System
        this.nextQueue = [];
        this.initQueue();

        this.updateUI();

        this.canDrop = true;
        this.isGameOver = false;

        // Engine
        this.engine = Engine.create();
        this.world = this.engine.world;

        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: CONFIG.WIDTH,
                height: CONFIG.HEIGHT,
                wireframes: false,
                background: 'transparent'
            }
        });

        this.createWalls();
        this.setupInput();

        // Game Loop
        Events.on(this.engine, 'afterUpdate', () => {
            this.gameLoop();
            this.updateParticles();
        });

        Events.on(this.render, 'afterRender', () => {
            this.drawCardProjectiles();
            this.drawParticles();
        });

        this.setupUIControls();
    }

    start() {
        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
    }

    setupUIControls() {
        const langBtn = document.getElementById('btn-lang');
        if (langBtn) {
            langBtn.addEventListener('click', () => {
                this.lang = this.lang === 'EN' ? 'KR' : 'EN';
                this.updateUI();
                // Font always Jua
            });
        }

        const modal = document.getElementById('modal-rules');
        const ruleBtn = document.getElementById('btn-rules');
        const closeBtn = document.getElementById('btn-close-rules');
        if (ruleBtn && modal && closeBtn) {
            ruleBtn.addEventListener('click', () => modal.classList.remove('hidden'));
            closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        }

        // Item Buttons
        this.ui.switchBtn.addEventListener('click', () => this.setMode('switch'));
        this.ui.bombBtn.addEventListener('click', () => this.setMode('bomb'));
    }

    setMode(mode) {
        if (mode === 'switch') {
            if (this.switchCount <= 0) return;
            this.isSwitchMode = !this.isSwitchMode;
            this.isBombMode = false;
        } else if (mode === 'bomb') {
            if (this.bombCount <= 0) return;
            this.isBombMode = !this.isBombMode;
            this.isSwitchMode = false;
        }
        this.selectedBall = null;
        this.updateUI();
    }

    updateUI() {
        if (!TEXTS[this.lang]) return;
        const txt = TEXTS[this.lang];

        this.ui.scoreLabel.innerText = txt.SCORE;
        this.ui.highScoreLabel.innerText = txt.HIGH_SCORE;
        this.ui.nextLabel.innerText = txt.NEXT;

        // Mode Hint
        if (this.isSwitchMode) {
            this.ui.hint.innerText = txt.HINT_SWITCH;
            this.ui.hint.parentElement.style.opacity = '1';
            this.ui.hint.style.color = '#ffbd00';
            this.ui.switchBtn.classList.add('active');
            this.ui.bombBtn.classList.remove('active');
        } else if (this.isBombMode) {
            this.ui.hint.innerText = txt.HINT_BOMB;
            this.ui.hint.parentElement.style.opacity = '1';
            this.ui.hint.style.color = '#f94144';
            this.ui.bombBtn.classList.add('active');
            this.ui.switchBtn.classList.remove('active');
        } else {
            if (!this.hasDropped) {
                this.ui.hint.innerText = txt.HINT;
                this.ui.hint.parentElement.style.opacity = '1';
            } else {
                this.ui.hint.parentElement.style.opacity = '0';
            }
            this.ui.hint.style.color = '#fff';
            this.ui.switchBtn.classList.remove('active');
            this.ui.bombBtn.classList.remove('active');
        }

        // Switch Button
        this.ui.switchBtn.innerText = `🔁 ${this.switchCount}`;
        this.ui.switchTooltip.innerText = txt.SWITCH_DESC;
        if (this.switchCount > 0) {
            this.ui.switchBtn.style.display = 'block';
            this.ui.switchBtn.disabled = false;
        } else {
            this.ui.switchBtn.style.display = 'none';
            this.ui.switchBtn.disabled = true;
        }

        // Bomb Button
        this.ui.bombBtn.innerText = `💣 ${this.bombCount}`;
        this.ui.bombTooltip.innerText = txt.BOMB_DESC;
        if (this.bombCount > 0) {
            this.ui.bombBtn.style.display = 'block';
            this.ui.bombBtn.disabled = false;
        } else {
            this.ui.bombBtn.style.display = 'none';
            this.ui.bombBtn.disabled = true;
        }

        const rTitle = document.getElementById('rules-title');
        const rBody = document.getElementById('rules-body');
        const rBtn = document.getElementById('btn-rules');
        const cBtn = document.getElementById('btn-close-rules');

        if (rTitle) rTitle.innerText = txt.RULES_TITLE;
        if (rBody) rBody.innerHTML = txt.RULES_CONTENT;
        if (rBtn) rBtn.innerText = txt.RULES_BTN;
        if (cBtn) cBtn.innerText = "OK";

        this.updateNextPreview();
    }

    initQueue() {
        for (let i = 0; i < 3; i++) this.nextQueue.push(this.generateRandomBall());
    }

    progressQueue() {
        this.nextQueue.shift();
        this.nextQueue.push(this.generateRandomBall());
    }

    generateRandomBall() {
        const value = DROP_VALUES[Math.floor(Math.random() * DROP_VALUES.length)];
        const key = SUIT_KEYS[Math.floor(Math.random() * SUIT_KEYS.length)];
        return { value, suit: SUITS[key] };
    }

    updateNextPreview() {
        if (this.nextQueue.length === 0) return;
        const current = this.nextQueue[0];
        this.renderQueueItem(this.ui.nextDisplay, current);
        this.ui.nextDisplay.style.color = current.suit.color;

        this.ui.nextList.innerHTML = '';
        for (let i = 1; i < this.nextQueue.length; i++) {
            const itemCmd = this.nextQueue[i];
            const div = document.createElement('div');
            div.className = 'queue-item small';
            this.renderQueueItem(div, itemCmd);
            div.style.color = itemCmd.suit.color;
            this.ui.nextList.appendChild(div);
        }
    }

    renderQueueItem(el, item) {
        const val = item.value === 1 ? 'A' : item.value;
        el.innerText = `${val}`;
        const span = document.createElement('span');
        span.style.fontSize = '0.7em';
        span.style.marginLeft = '2px';
        span.innerText = item.suit.symbol;
        el.appendChild(span);
    }

    gameLoop() {
        if (this.isGameOver) return;

        const bodies = Composite.allBodies(this.world).filter(b => b.label === 'ball');

        let highBall = false;
        let overflow = false;
        const now = Date.now();

        bodies.forEach(b => {
            const age = now - (b.gameData.timestamp || 0);

            // Physics Fix: Clamp Velocity
            if (b.velocity.x > CONFIG.MAX_VELOCITY) Matter.Body.setVelocity(b, { x: CONFIG.MAX_VELOCITY, y: b.velocity.y });
            if (b.velocity.x < -CONFIG.MAX_VELOCITY) Matter.Body.setVelocity(b, { x: -CONFIG.MAX_VELOCITY, y: b.velocity.y });
            if (b.velocity.y > CONFIG.MAX_VELOCITY) Matter.Body.setVelocity(b, { x: b.velocity.x, y: CONFIG.MAX_VELOCITY });
            if (b.velocity.y < -CONFIG.MAX_VELOCITY) Matter.Body.setVelocity(b, { x: b.velocity.x, y: -CONFIG.MAX_VELOCITY });

            if (age < 1000) return;

            // Safety: Boundary Clamp (Prevents disappearance via tunneling)
            if (b.position.y > CONFIG.HEIGHT + 50) {
                Matter.Body.setPosition(b, { x: b.position.x, y: CONFIG.HEIGHT - 50 });
                Matter.Body.setVelocity(b, { x: b.velocity.x, y: -5 });
            }
            if (b.position.x < -50) {
                Matter.Body.setPosition(b, { x: 50, y: b.position.y });
                Matter.Body.setVelocity(b, { x: 5, y: b.velocity.y });
            }
            if (b.position.x > CONFIG.WIDTH + 50) {
                Matter.Body.setPosition(b, { x: CONFIG.WIDTH - 50, y: b.position.y });
                Matter.Body.setVelocity(b, { x: -5, y: b.velocity.y });
            }

            // Dynamic Danger Logic
            // If settled ball is ABOVE the Danger Line -> Game Over
            if (b.position.y < this.dangerY) {
                highBall = true;
                if (Math.abs(b.velocity.y) < 0.2 && Math.abs(b.velocity.x) < 0.2) {
                    overflow = true;
                }
            }
        });

        if (overflow) {
            this.isGameOver = true;
            return;
        }

        if (highBall) this.ui.danger.classList.add('active');
        else this.ui.danger.classList.remove('active');

        // Removed length check to allow single-ball logic (like 21 check above) to run if needed, 
        // though adjacency loop handles singletons too.
        if (bodies.length === 0) return;

        let adj = new Map();
        bodies.forEach(b => adj.set(b.id, []));

        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const A = bodies[i];
                const B = bodies[j];
                const distSq = (A.position.x - B.position.x) ** 2 + (A.position.y - B.position.y) ** 2;
                const radSum = A.circleRadius + B.circleRadius;
                if (distSq < (radSum + 2) ** 2) {
                    adj.get(A.id).push(B);
                    adj.get(B.id).push(A);
                }
            }
        }

        let visited = new Set();
        let actionTaken = false;

        for (let body of bodies) {
            if (visited.has(body.id)) continue;
            if (actionTaken) break;

            let component = [];
            let stack = [body];
            visited.add(body.id);

            while (stack.length > 0) {
                let curr = stack.pop();
                component.push(curr);
                let neighbors = adj.get(curr.id) || [];
                for (let n of neighbors) {
                    if (!visited.has(n.id)) {
                        visited.add(n.id);
                        stack.push(n);
                    }
                }
            }

            if (component.length > 0) {
                if (this.checkSum21(component)) {
                    this.trigger21(component);
                    actionTaken = true;
                    continue;
                }

                for (let b of component) {
                    if (actionTaken) break;
                    let neighbors = adj.get(b.id) || [];
                    for (let n of neighbors) {
                        if (b.id > n.id) continue;
                        const valA = b.gameData.value;
                        const valB = n.gameData.value;
                        const suitA = b.gameData.suit.id;
                        const suitB = n.gameData.suit.id;

                        if (suitA === suitB) {
                            const sum = valA + valB;

                            if (sum <= 21) {
                                if (sum === 21) {
                                    // Instant Blackjack Trigger
                                    this.trigger21([b, n]);
                                    actionTaken = true;
                                    break;
                                }

                                const txt = TEXTS[this.lang];
                                this.mergeBalls(b, n, sum, b.gameData.suit, txt.MSG_SUIT);
                                actionTaken = true;
                                break;
                            }
                        } else if (valA === valB) {
                            const sum = valA + valB;
                            if (sum <= 21) {
                                if (sum === 21) {
                                    // Instant Blackjack
                                    this.trigger21([b, n]);
                                    actionTaken = true;
                                    break;
                                }

                                const txt = TEXTS[this.lang];
                                const winner = this.getPriorityBall(b, n);
                                this.mergeBalls(b, n, sum, winner.gameData.suit, txt.MSG_PAIR);
                                actionTaken = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    getPriorityBall(A, B) {
        // Priority by Suit Rank: Spades(3) > Diamonds(2) > Hearts(1) > Clubs(0)
        if (A.gameData.suit.rank > B.gameData.suit.rank) return A;
        if (B.gameData.suit.rank > A.gameData.suit.rank) return B;

        // Fallback to ID (Newer)
        if (A.gameData.id > B.gameData.id) return A;
        return B;
    }

    mergeBalls(A, B, newSum, targetSuit, reason) {
        const winner = this.getPriorityBall(A, B);
        const x = winner.position.x;
        const y = winner.position.y;
        const txt = TEXTS[this.lang];

        this.spawnParticles(x, y, 15, targetSuit.color);
        this.spawnFloatingText(x, y - 20, reason || txt.MSG_MIX, targetSuit.color);

        Composite.remove(this.world, [A, B]);

        const radius = 20 + (newSum * 2.5);
        const newBall = Bodies.circle(x, y, radius, {
            restitution: CONFIG.BOUNCINESS, friction: CONFIG.FRICTION, label: 'ball',
            render: { fillStyle: '#FFFFFF' }
        });

        newBall.gameData = {
            value: newSum, suit: targetSuit,
            id: Date.now() + Math.random(), timestamp: Date.now()
        };

        Composite.add(this.world, newBall);
        this.addScore(newSum * 10);
    }

    checkSum21(bodies) {
        if (bodies.length === 0) return false;

        // Strictly allow only SAME SUIT for 21-explode
        const firstSuit = bodies[0].gameData.suit.id;
        for (let i = 1; i < bodies.length; i++) {
            if (bodies[i].gameData.suit.id !== firstSuit) return false;
        }

        let rawSum = 0;
        bodies.forEach(b => {
            rawSum += b.gameData.value; // Ace is just 1
        });
        return rawSum === 21;
    }

    trigger21(bodies) {
        let cx = 0, cy = 0;
        bodies.forEach(b => { cx += b.position.x; cy += b.position.y; });
        cx /= bodies.length;
        cy /= bodies.length;

        const leader = bodies[Math.floor(Math.random() * bodies.length)];
        const suit = leader.gameData.suit;
        const txt = TEXTS[this.lang];

        this.spawnParticles(cx, cy, 50, suit.color, true);
        this.spawnFloatingText(cx, cy, txt.MSG_BJ, '#ffd700');
        this.addScore(1000);
        bodies.forEach(b => Composite.remove(this.world, b));
        this.executeSuitEffect(suit, { x: cx, y: cy });
    }

    executeSuitEffect(suit, pos) {
        const txt = TEXTS[this.lang];
        if (suit.id === 'clubs') {
            // Club -> Switch
            this.switchCount++;
            this.updateUI();
            // this.spawnFloatingText(pos.x, pos.y, txt.MSG_GET_SWITCH);
        } else if (suit.id === 'hearts') {
            // Heart -> Bomb
            this.bombCount++;
            this.updateUI();
            // this.spawnFloatingText(pos.x, pos.y, txt.MSG_GET_BOMB);
        } else if (suit.id === 'diamonds') {
            // Diamond -> Chaos (Penalty Scatter)
            // Spawn 4-6 random junk balls
            const count = Math.floor(Math.random() * 3) + 4;
            const keys = Object.keys(SUITS);

            for (let i = 0; i < count; i++) {
                // Random position near center
                const angle = (Math.PI * 2 * i) / count;
                const dist = 30 + Math.random() * 50;
                const bx = pos.x + Math.cos(angle) * dist;
                const by = pos.y + Math.sin(angle) * dist;

                // Random Suit & Small Value (1-3)
                const randKey = keys[Math.floor(Math.random() * keys.length)];
                const randVal = Math.floor(Math.random() * 10) + 1;

                this.forceSpawnBall(bx, by, randVal, SUITS[randKey]);
            }
        } else if (suit.id === 'spades') {
            // Spade -> Impact (Physical Push)
            // Increased force (1.2x), No destruction
            // Radius increased to 180 for consistency
            this.explode(pos, 180, 1.2, false);
        }
    }

    performSwitch(A, B) {
        if (!A || !B || A === B) return;

        const posA = { x: A.position.x, y: A.position.y };
        const posB = { x: B.position.x, y: B.position.y };
        const velA = { x: A.velocity.x, y: A.velocity.y };
        const velB = { x: B.velocity.x, y: B.velocity.y };

        Matter.Body.setPosition(A, posB);
        Matter.Body.setVelocity(A, velB);
        Matter.Body.setPosition(B, posA);
        Matter.Body.setVelocity(B, velA);

        this.spawnParticles(posA.x, posA.y, 10, '#fff');
        this.spawnParticles(posB.x, posB.y, 10, '#fff');

        this.switchCount--;
        this.isSwitchMode = false;
        this.selectedBall = null;
        this.updateUI();
    }

    // --- Helpers ---

    addScore(pts) {
        this.score += pts;
        this.ui.score.innerText = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.ui.highScore.innerText = this.highScore;
            localStorage.setItem('bj-suika-highscore', this.highScore);
        }
    }

    createWalls() {
        const wallOptions = { isStatic: true, render: { fillStyle: '#5d4037' }, friction: 0.5 };
        const ground = Bodies.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT + 40, CONFIG.WIDTH, 100, wallOptions);
        const leftWall = Bodies.rectangle(-40, CONFIG.HEIGHT / 2, 100, CONFIG.HEIGHT, wallOptions);
        const rightWall = Bodies.rectangle(CONFIG.WIDTH + 40, CONFIG.HEIGHT / 2, 100, CONFIG.HEIGHT, wallOptions);
        Composite.add(this.world, [ground, leftWall, rightWall]);
    }

    setupInput() {
        this.mouseX = CONFIG.WIDTH / 2;
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isGameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const rawX = e.clientX - rect.left;

            // Dynamic clamping
            // Wall is ~10px wide inside the view (technically bounds are -40..10 and 590..640)
            // So playable area is 10 to 590.
            let limit = 40; // Base safety
            if (!this.isSwitchMode && !this.isBombMode && this.nextQueue.length > 0) {
                const val = this.nextQueue[0].value;
                const r = 20 + (val * 2.5);
                limit = 10 + r + 2; // Wall Edge(10) + Radius + Buffer(2)
            }
            if (this.isBombMode) limit = 32; // Wall(10) + Radius(20) + 2

            this.mouseX = Math.max(limit, Math.min(rawX, CONFIG.WIDTH - limit));
        });

        // Mobile Touch Support (Move)
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isGameOver) return;
            e.preventDefault(); // Prevent scrolling
            const rect = this.canvas.getBoundingClientRect();
            // Scale touch position to canvas coordinates
            const scaleX = CONFIG.WIDTH / rect.width;
            const rawX = (e.touches[0].clientX - rect.left) * scaleX;

            let limit = 40;
            if (!this.isSwitchMode && !this.isBombMode && this.nextQueue.length > 0) {
                const val = this.nextQueue[0].value;
                const r = 20 + (val * 2.5);
                limit = 10 + r + 2;
            }
            if (this.isBombMode) limit = 32;

            this.mouseX = Math.max(limit, Math.min(rawX, CONFIG.WIDTH - limit));
        }, { passive: false });

        this.canvas.addEventListener('click', (e) => {
            if (this.isGameOver) return;
            if (e.target.closest('.action-btn')) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;

            // Dynamic clamping
            // Wall is ~10px wide inside the view (technically bounds are -40..10 and 590..640)
            // So playable area is 10 to 590.
            let limit = 40; // Base safety
            if (!this.isSwitchMode && !this.isBombMode && this.nextQueue.length > 0) {
                const val = this.nextQueue[0].value;
                const r = 20 + (val * 2.5);
                limit = 10 + r + 2; // Wall Edge(10) + Radius + Buffer(2)
            }
            if (this.isBombMode) limit = 32; // Wall(10) + Radius(20) + 2

            const clampX = Math.max(limit, Math.min(x, CONFIG.WIDTH - limit));

            if (this.isSwitchMode) {
                const bodies = Composite.allBodies(this.world).filter(b => b.label === 'ball');
                // Use raw x/y for selection, radius check handled by Query.point effectively
                const clicked = Query.point(bodies, { x, y: e.clientY - rect.top })[0];

                if (clicked) {
                    if (!this.selectedBall) {
                        this.selectedBall = clicked;
                    } else {
                        if (clicked !== this.selectedBall) {
                            this.performSwitch(this.selectedBall, clicked);
                        } else {
                            this.selectedBall = null;
                        }
                    }
                    this.selectedBall = null;
                    this.updateUI();
                }
            } else if (this.isBombMode) {
                // Drop Bomb (Consumes Item)
                this.bombCount--;
                this.isBombMode = false;
                this.updateUI();
                this.dropBomb(clampX);
            } else {
                if (!this.canDrop) return;
                this.dropBall(clampX);
            }
        });

        // Mobile Touch Support (Click/Drop)
        this.canvas.addEventListener('touchend', (e) => {
            if (this.isGameOver) return;
            e.preventDefault();

            // Use last known mouseX for drop position since touchend has no coordinates
            const clampX = this.mouseX;

            if (this.isSwitchMode) {
                // Switch logic slightly harder on touch without simplified target selection, 
                // but for dropping logic it's fine. 
                // For now, Switch Mode might need direct tap. 
                // Let's rely on standard click handling for UI, but canvas tap for drop.
            }

            if (this.isSwitchMode) {
                // Determine tap position from changedTouches if possible
                if (e.changedTouches.length > 0) {
                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = CONFIG.WIDTH / rect.width;
                    const scaleY = CONFIG.HEIGHT / rect.height;
                    const tapX = (e.changedTouches[0].clientX - rect.left) * scaleX;
                    const tapY = (e.changedTouches[0].clientY - rect.top) * scaleY;

                    this.handleSwitchClick(tapX, tapY);
                }
            } else if (this.isBombMode) {
                this.bombCount--;
                this.isBombMode = false;
                this.updateUI();
                this.dropBomb(clampX);
            } else {
                if (!this.canDrop) return;
                this.dropBall(clampX);
            }
        });
    }

    dropBall(x) {
        this.canDrop = false;
        this.hasDropped = true;
        this.dropCount++;

        // Delayed Log scale: Start descending after 10 drops
        const START_DELAY = 10;
        if (this.dropCount > START_DELAY) {
            // Log10(1) = 0 (Drop 11 starts at 0 offset? No, should start small)
            // Log10(11 - 10 + 1) = Log10(2) ~ 0.3 * 120 = 36px
            this.dangerY = CONFIG.DANGER_LINE_Y + (Math.log10(this.dropCount - START_DELAY + 1) * 120);
        } else {
            this.dangerY = CONFIG.DANGER_LINE_Y;
        }

        this.dangerY = Math.min(this.dangerY, CONFIG.HEIGHT - 200);

        this.updateUI();
        this.dropNormalBall(x);
        setTimeout(() => this.canDrop = true, 500);
    }

    dropNormalBall(x) {
        const nextItem = this.nextQueue[0];
        const { value, suit } = nextItem;
        const radius = 20 + (value * 2.5);

        const ball = Bodies.circle(x, CONFIG.DROP_LINE_Y, radius, {
            restitution: CONFIG.BOUNCINESS, friction: CONFIG.FRICTION, label: 'ball',
            render: { fillStyle: '#FFFFFF' }
        });

        ball.gameData = {
            value, suit, id: Date.now() + Math.random(), timestamp: Date.now()
        };

        Composite.add(this.world, ball);
        this.progressQueue();
        this.updateNextPreview();
    }

    dropBomb(x) {
        const bomb = Bodies.circle(x, CONFIG.DROP_LINE_Y, 20, {
            restitution: 0.5, friction: 0.5, label: 'bomb',
            render: { fillStyle: '#000' }
        });
        bomb.isBomb = true;
        Composite.add(this.world, bomb);
        setTimeout(() => {
            // Bomb Item: Destroys in range, Pushes weakly (50%)
            this.explode(bomb.position, 120, 0.5, true);
            this.spawnParticles(bomb.position.x, bomb.position.y, 30, 'red', true);
            Composite.remove(this.world, bomb);
        }, 1200);
    }

    explode(pos, radius, forceMult = 1.0, destroy = false) {
        const bodies = Composite.allBodies(this.world);
        bodies.forEach(b => {
            if (b.isStatic) return;
            const d = Vector.magnitude(Vector.sub(b.position, pos));

            if (d < radius) {
                if (destroy && b.label === 'ball') {
                    // Destroy ball
                    Composite.remove(this.world, b);
                    this.spawnParticles(b.position.x, b.position.y, 10, b.gameData ? b.gameData.suit.color : '#fff');
                } else {
                    // Push ball
                    const forceMag = (0.5 * b.mass) * forceMult;
                    const force = Vector.mult(Vector.normalise(Vector.sub(b.position, pos)), forceMag);
                    Matter.Body.applyForce(b, b.position, force);
                }
            }
        });
    }

    forceSpawnBall(x, y, value, suit) {
        const radius = 20 + (value * 2.5);
        const b = Bodies.circle(x, y, radius, {
            restitution: 0.3, friction: 0.5, label: 'ball',
            render: { fillStyle: '#FFF' }
        });
        b.gameData = { value, suit, id: Date.now() + Math.random(), timestamp: Date.now() };
        Composite.add(this.world, b);
    }

    spawnParticles(x, y, count, color, explosive = false) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                type: 'dot', x, y,
                vx: (Math.random() - 0.5) * (explosive ? 20 : 5),
                vy: (Math.random() - 0.5) * (explosive ? 20 : 5),
                life: 1.0, color
            });
        }
    }

    spawnFloatingText(x, y, text, color = '#fff') {
        this.particles.push({
            type: 'text', x, y, text, life: 1.5, vy: -1.5, color: color
        });
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            if (p.type === 'dot') {
                p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.vy += 0.5;
            } else if (p.type === 'text') {
                p.y += p.vy; p.life -= 0.02;
            }
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawParticles() {
        if (!this.particles.length) return;
        const ctx = this.render.context;
        for (let p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            if (p.type === 'dot') {
                ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4);
            } else if (p.type === 'text') {
                ctx.fillStyle = p.color; ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
                ctx.font = 'bold 24px Arial'; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y);
            }
        }
        ctx.globalAlpha = 1.0;
    }

    drawCardProjectiles() {
        const ctx = this.render.context;
        const bodies = Composite.allBodies(this.world);

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.beginPath(); ctx.moveTo(10, CONFIG.DROP_LINE_Y); ctx.lineTo(CONFIG.WIDTH - 10, CONFIG.DROP_LINE_Y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1; ctx.stroke();

        // Draw Danger Line (Always Visible)
        ctx.beginPath();
        ctx.moveTo(10, this.dangerY);
        ctx.lineTo(CONFIG.WIDTH - 10, this.dangerY);
        ctx.strokeStyle = '#ff4444'; // Slightly darker red
        ctx.lineWidth = 2;
        ctx.setLineDash([]); // Solid
        ctx.stroke();

        // Removed DANGER Text as requested

        for (let body of bodies) {
            if (body.label === 'ball' && body.gameData) {
                const { value, suit } = body.gameData;
                const r = body.circleRadius;
                const borderWidth = 5;

                ctx.beginPath(); ctx.arc(body.position.x, body.position.y, r, 0, 2 * Math.PI);
                ctx.fillStyle = '#FFFFFF'; ctx.fill();

                ctx.beginPath(); ctx.arc(body.position.x, body.position.y, r - borderWidth / 2, 0, 2 * Math.PI);
                ctx.strokeStyle = suit.color; ctx.lineWidth = borderWidth; ctx.stroke();

                // Highlight Selection
                if (this.selectedBall === body) {
                    ctx.beginPath(); ctx.arc(body.position.x, body.position.y, r + 10, 0, 2 * Math.PI);
                    ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 4; ctx.stroke();
                }

                ctx.fillStyle = suit.color;
                ctx.font = `bold ${r}px ${this.lang === 'KR' ? 'Jua' : 'Fredoka'}`;
                let displayTxt = value === 1 ? 'A' : value;
                ctx.fillText(displayTxt, body.position.x, body.position.y - r * 0.25);
                ctx.font = `${r * 0.5}px Arial`;
                ctx.fillText(suit.symbol, body.position.x, body.position.y + r * 0.45);
            } else if (body.label === 'bomb') {
                ctx.fillStyle = 'red';
                ctx.font = '24px Arial';
                ctx.fillText('💣', body.position.x, body.position.y);
            }
        }

        if (this.canDrop && !this.isGameOver && !this.isSwitchMode && !this.isBombMode) {
            const nextItem = this.nextQueue[0];
            const nextVal = nextItem.value;
            const nextRadius = 20 + (nextVal * 2.5);

            ctx.beginPath(); ctx.moveTo(this.mouseX, CONFIG.DROP_LINE_Y); ctx.lineTo(this.mouseX, CONFIG.HEIGHT);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);

            ctx.beginPath(); ctx.arc(this.mouseX, CONFIG.DROP_LINE_Y, nextRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = `bold ${nextRadius}px Arial`;
            ctx.fillText(nextVal === 1 ? 'A' : nextVal, this.mouseX, CONFIG.DROP_LINE_Y);
        } else if (this.isBombMode) {
            // Show Bomb ghost
            ctx.beginPath(); ctx.moveTo(this.mouseX, CONFIG.DROP_LINE_Y); ctx.lineTo(this.mouseX, CONFIG.HEIGHT);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'; ctx.stroke();

            ctx.beginPath(); ctx.arc(this.mouseX, CONFIG.DROP_LINE_Y, 20, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fill();
            ctx.font = '20px Arial'; ctx.fillStyle = '#fff'; ctx.fillText("💣", this.mouseX, CONFIG.DROP_LINE_Y);
        }

        if (this.isGameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
            const txt = TEXTS[this.lang];
            if (txt) {
                ctx.fillStyle = 'white'; ctx.font = `50px ${this.lang === 'KR' ? 'Jua' : 'Fredoka'}`;
                ctx.fillText(txt.GAME_OVER, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 20);
                ctx.font = `30px ${this.lang === 'KR' ? 'Jua' : 'Fredoka'}`;
                ctx.fillStyle = '#aaa'; ctx.fillText(txt.RESTART, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 50);
            }
        }
    }
}

document.addEventListener('click', () => {
    if (window.game && window.game.isGameOver) {
        window.location.reload();
    }
});
