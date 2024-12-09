const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const generateButton = document.getElementById('generateMaze');
const solveButton = document.getElementById('solveMaze');
const mazeSizeInput = document.getElementById('mazeSize');
const mazeSimplicityInput = document.getElementById('mazeSimplicity');
const winScreen = document.getElementById('winScreen');
const timeTakenElement = document.getElementById('timeTaken');
const generateAnotherButton = document.getElementById('generateAnother');

let maze, cols, rows, cellSize;
const stack = [];
let path = [];
let solving = false;
let userSolving = false;
let userPath = [];
let player = { x: 0, y: 0 };
let startTime, endTime;
let confettiCanvas, confettiCtx, confettiAnimationFrame;
let timerStarted = false;
let gameFrozen = false;

// Initialize canvas size
function initCanvas() {
    canvas.width = window.innerWidth * 0.6;
    canvas.height = window.innerHeight * 0.8;
    cellSize = Math.floor(canvas.width / parseInt(mazeSizeInput.value));
    cols = Math.floor(canvas.width / cellSize);
    rows = Math.floor(canvas.height / cellSize);
}

// Cell constructor
function Cell(x, y) {
    this.x = x;
    this.y = y;
    this.walls = [true, true, true, true]; // top, right, bottom, left
    this.visited = false;

    this.show = function() {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        if (this.walls[0]) ctx.strokeRect(x, y, cellSize, 0); // top
        if (this.walls[1]) ctx.strokeRect(x + cellSize, y, 0, cellSize); // right
        if (this.walls[2]) ctx.strokeRect(x, y + cellSize, cellSize, 0); // bottom
        if (this.walls[3]) ctx.strokeRect(x, y, 0, cellSize); // left

        if (this.visited) {
            ctx.fillStyle = '#ccc';
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    };

    this.checkNeighbors = function() {
        const neighbors = [];

        const top = maze[index(this.x, this.y - 1)];
        const right = maze[index(this.x + 1, this.y)];
        const bottom = maze[index(this.x, this.y + 1)];
        const left = maze[index(this.x - 1, this.y)];

        if (top && !top.visited) neighbors.push(top);
        if (right && !right.visited) neighbors.push(right);
        if (bottom && !bottom.visited) neighbors.push(bottom);
        if (left && !left.visited) neighbors.push(left);

        if (neighbors.length > 0) {
            const r = Math.floor(Math.random() * neighbors.length);
            return neighbors[r];
        } else {
            return undefined;
        }
    };
}

function index(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) {
        return -1;
    }
    return x + y * cols;
}

function setup() {
    maze = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = new Cell(x, y);
            maze.push(cell);
        }
    }
    const start = maze[0];
    start.visited = true;
    stack.push(start);

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const next = current.checkNeighbors();

        if (next) {
            next.visited = true;
            stack.push(next);

            // Remove walls
            const x = current.x - next.x;
            if (x === 1) {
                current.walls[3] = false;
                next.walls[1] = false;
            } else if (x === -1) {
                current.walls[1] = false;
                next.walls[3] = false;
            }

            const y = current.y - next.y;
            if (y === 1) {
                current.walls[0] = false;
                next.walls[2] = false;
            } else if (y === -1) {
                current.walls[2] = false;
                next.walls[0] = false;
            }
        } else {
            stack.pop();
        }
    }

    // Add extra paths to increase simplicity
    const simplicity = parseInt(mazeSimplicityInput.value);
    for (let i = 0; i < simplicity; i++) {
        const randomCell = maze[Math.floor(Math.random() * maze.length)];
        const neighbors = [
            maze[index(randomCell.x, randomCell.y - 1)], // top
            maze[index(randomCell.x + 1, randomCell.y)], // right
            maze[index(randomCell.x, randomCell.y + 1)], // bottom
            maze[index(randomCell.x - 1, randomCell.y)]  // left
        ];

        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        if (randomNeighbor) {
            const x = randomCell.x - randomNeighbor.x;
            if (x === 1) {
                randomCell.walls[3] = false;
                randomNeighbor.walls[1] = false;
            } else if (x === -1) {
                randomCell.walls[1] = false;
                randomNeighbor.walls[3] = false;
            }

            const y = randomCell.y - randomNeighbor.y;
            if (y === 1) {
                randomCell.walls[0] = false;
                randomNeighbor.walls[2] = false;
            } else if (y === -1) {
                randomCell.walls[2] = false;
                randomNeighbor.walls[0] = false;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < maze.length; i++) {
        maze[i].show();
    }
    drawBorder();
    highlightEnd();
    drawPlayer();
}

function drawBorder() {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, cols * cellSize, rows * cellSize);
}

function drawPlayer(x = player.x, y = player.y) {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

function highlightEnd() {
    const endCell = maze[maze.length - 1];
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(endCell.x * cellSize, endCell.y * cellSize, cellSize, cellSize);
}

function solveMaze() {
    const start = maze[0];
    const end = maze[maze.length - 1];
    const visited = new Set();
    path = [];
    solving = true;

    function dfs(cell) {
        if (cell === end) {
            path.push(cell);
            return true;
        }

        visited.add(cell);
        path.push(cell);

        const neighbors = [
            maze[index(cell.x, cell.y - 1)], // top
            maze[index(cell.x + 1, cell.y)], // right
            maze[index(cell.x, cell.y + 1)], // bottom
            maze[index(cell.x - 1, cell.y)]  // left
        ];

        for (let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];
            if (neighbor && !visited.has(neighbor) && !cell.walls[i]) {
                if (dfs(neighbor)) {
                    return true;
                }
            }
        }

        path.pop();
        return false;
    }

    dfs(start);
    animatePath();
}

function animatePath() {
    if (path.length > 0) {
        const cell = path.shift();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
        requestAnimationFrame(animatePath);
    } else {
        solving = false;
    }
}

function handleMouseClick(event) {
    if (gameFrozen) return;

    if (!timerStarted) {
        startTime = new Date();
        timerStarted = true;
    }

    if (userSolving) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / cellSize);
        const y = Math.floor((event.clientY - rect.top) / cellSize);
        const cell = maze[index(x, y)];

        if (cell && !userPath.includes(cell)) {
            userPath.push(cell);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
        }
    }
}

function handleKeyDown(event) {
    if (gameFrozen) return;

    if (!timerStarted) {
        startTime = new Date();
        timerStarted = true;
    }

    const key = event.key;
    let newX = player.x;
    let newY = player.y;

    const currentCell = maze[index(player.x, player.y)];

    if ((key === 'ArrowUp' || key === 'w') && !currentCell.walls[0]) newY--;
    if ((key === 'ArrowDown' || key === 's') && !currentCell.walls[2]) newY++;
    if ((key === 'ArrowLeft' || key === 'a') && !currentCell.walls[3]) newX--;
    if ((key === 'ArrowRight' || key === 'd') && !currentCell.walls[1]) newX++;

    const nextCell = maze[index(newX, newY)];

    if (nextCell) {
        player.x = newX;
        player.y = newY;
        draw();

        // Check if the player has reached the end
        if (player.x === cols - 1 && player.y === rows - 1) {
            endTime = new Date();
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
            timeTakenElement.textContent = timeTaken;
            winScreen.classList.remove('hidden');
            startConfetti();
            gameFrozen = true;
        }
    }
}

function startConfetti() {
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confettiCanvas';
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    document.body.appendChild(confettiCanvas);

    confettiCtx = confettiCanvas.getContext('2d');
    const confettiCount = 300;
    const confetti = [];

    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height,
            r: Math.random() * 6 + 2,
            d: Math.random() * confettiCount,
            color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
            tilt: Math.random() * 10 - 10,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }

    function drawConfetti() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confetti.forEach((c, i) => {
            c.tiltAngle += c.tiltAngleIncremental;
            c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
            c.tilt = Math.sin(c.tiltAngle - i / 3) * 15;

            if (c.y > confettiCanvas.height) {
                confetti[i] = {
                    x: Math.random() * confettiCanvas.width,
                    y: -10,
                    r: c.r,
                    d: c.d,
                    color: c.color,
                    tilt: c.tilt,
                    tiltAngleIncremental: c.tiltAngleIncremental,
                    tiltAngle: c.tiltAngle
                };
            }

            confettiCtx.beginPath();
            confettiCtx.lineWidth = c.r / 2;
            confettiCtx.strokeStyle = c.color;
            confettiCtx.moveTo(c.x + c.tilt + c.r / 4, c.y);
            confettiCtx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4);
            confettiCtx.stroke();
        });

        confettiAnimationFrame = requestAnimationFrame(drawConfetti);
    }

    drawConfetti();
}

generateButton.addEventListener('click', () => {
    winScreen.classList.add('hidden');
    winScreen.style.animation = 'none';
    setTimeout(() => {
        winScreen.style.animation = '';
    }, 50);
    if (confettiCanvas) {
        confettiCanvas.remove();
        cancelAnimationFrame(confettiAnimationFrame);
    }
    player = { x: 0, y: 0 };
    timerStarted = false;
    gameFrozen = false;
    initCanvas();
    setup();
    draw();
});

solveButton.addEventListener('click', solveMaze);
generateAnotherButton.addEventListener('click', () => {
    winScreen.classList.add('hidden');
    winScreen.style.animation = 'none';
    setTimeout(() => {
        winScreen.style.animation = '';
    }, 50);
    if (confettiCanvas) {
        confettiCanvas.remove();
        cancelAnimationFrame(confettiAnimationFrame);
    }
    player = { x: 0, y: 0 };
    timerStarted = false;
    gameFrozen = false;
    initCanvas();
    setup();
    draw();
});

canvas.addEventListener('click', handleMouseClick);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('resize', initCanvas);
initCanvas();
setup();
draw();