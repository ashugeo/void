const gridSize = 40;
const rows = 10;
const cols = 10;

const zones = [];

let hoveredCell = {};
let clickedCell = {};
let selectedCell = {};

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);

    zones.push(new Zone('board', 0, 20, 20, 10, 10));
    zones.push(new Zone('row', 1, 440, 60, 5, 1));
    zones.push(new Zone('row', 2, 440, 120, 3, 1));
    zones.push(new Zone('tools', 3, 660, 20, 1, 5));
    zones.push(new Zone('colors', 3, 720, 20, 1, 3));
}

function draw() {
    hoveredCell = {};
    
    background(255);
    noFill();

    for (const zone of zones) zone.display();
}

function mousePressed() {
    if (!Object.keys(hoveredCell).length) return;

    clickedCell = { x: hoveredCell.x, y: hoveredCell.y, zone: hoveredCell.zone };

    if (clickedCell.zone.type === 'row') {
        selectedCell = { x: hoveredCell.x, y: hoveredCell.y, zone: hoveredCell.zone };
    }
}

class Cell {
    constructor(x, y, zone) {
        this.x = x;
        this.y = y;
        this.zone = zone;
    }

    display() {
        const x = this.x * gridSize;
        const y = this.y * gridSize;

        if (
            x + this.zone.x < mouseX &&
            mouseX < this.zone.x + x + gridSize &&
            y + this.zone.y < mouseY &&
            mouseY < this.zone. y + y + gridSize &&
            (hoveredCell.x !== this.x || hoveredCell.y !== this.y)
        ) hoveredCell = { x: this.x, y: this.y, zone: this.zone };

        push();
        translate(x, y);

        if (selectedCell.x === this.x && selectedCell.y === this.y && selectedCell.zone.id === this.zone.id ) strokeWeight(3);

        rect(0, 0, gridSize, gridSize);

        fill(0);
        noStroke();
        text(`${this.x}:${this.y}`, 5, 15);

        pop();
    }
}

class Zone {
    constructor(type, id, x, y, cols, rows) {
        this.type = type;
        this.id = id;
        this.x = x;
        this.y = y;
        this.cols = cols;
        this.rows = rows;
        this.cells = [];

        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                this.cells.push(new Cell(x, y, this));
            }
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        for (const cell of this.cells) cell.display();
        pop();
    }
}
