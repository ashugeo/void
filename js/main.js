const gridSize = 40;
const rows = 10;
const cols = 10;

let cells = [];

let hoveredCell = {};
let clickedCell = {};
let selectedCell = {};

function setup() {
    const canvas = createCanvas(window.innerWidth / 2, window.innerHeight);
    canvas.parent('canvas-wrapper');

    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
            cells.push(new Cell(x, y));
        }
    }
}

function draw() {
    hoveredCell = {};

    background(255);
    noFill();

    oX = width / 2 - rows * gridSize / 2;
    oY = height / 2 - cols * gridSize / 2;

    translate(oX, oY);
    for (const cell of cells) cell.display();
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    display() {
        const x = this.x * gridSize;
        const y = this.y * gridSize;

        push();
        translate(x, y);

        rect(0, 0, gridSize, gridSize);

        fill(0);
        noStroke();
        text(`${this.x}:${this.y}`, 5, 15);

        pop();
    }
}

$(document).on('click', '.step', e => {
    const $el = $(e.target);
    $('.step.selected').removeClass('selected');
    $el.addClass('selected');
});

$(document).on('click', '.color', e => {
    const $el = $(e.target);
    const color = $el.attr('data-color')
    if ($('.step.selected').attr('data-color') === color) {
        $('.step.selected').attr('data-color', '');
    } else {
        $('.step.selected').attr('data-color', color);
    }
});

$(document).on('click', '.tool', e => {
    const $el = $(e.target);
    const tool = $el.attr('data-tool')
    if ($('.step.selected').attr('data-tool') === tool) {
        $('.step.selected').attr('data-tool', '');
    } else {
        $('.step.selected').attr('data-tool', tool);
    }
});
