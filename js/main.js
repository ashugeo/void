const gridSize = 40;
const rows = 10;
const cols = 10;

const debug = false;

const colors = ['#dddddd', '#4caf50', '#2196f3', '#ffc107'];

let cells = [];

let hoveredCell = {};
let clickedCell = {};
let selectedCell = {};

let board;
let hero;

function preload() {
    const data = loadJSON('data/map1.json', () => {
        board = data.board;
        hero = new Hero(data.hero.pos.x, data.hero.pos.y, data.hero.dir);
    });
}

function setup() {
    const canvas = createCanvas(window.innerWidth / 2, window.innerHeight);
    canvas.parent('canvas-wrapper');

    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
            cells.push(new Cell(x, y, board[y] ? board[y][x] : false));
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
    hero.display();
}

class Hero {
    constructor(x, y, dir) {
        this.x = x;
        this.y = y;
        this.dir = dir;
    }

    display() {
        push();
        translate((1 / 2 + this.x) * gridSize, (1 / 2 + this.y) * gridSize);
        rotate(radians(this.dir * 90));
        triangle(0, -10, -10, 10, 10, 10);
        pop();
    }

    forward() {
        this.x += [0, 1, 0, -1][this.dir];
        this.y += [-1, 0, 1, 0][this.dir];
    }

    right() {
        this.dir += 1;
    }

    left() {
        this.dir -= 1;
    }
}

class Cell {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;

        if (color && color !== '') {
            this.color = parseInt(color.match(/\d/)[0]);
            this.star = !!color.match(/[s]/);
        }
    }

    display() {
        const x = this.x * gridSize;
        const y = this.y * gridSize;

        push();
        translate(x, y);

        if (this.color !== undefined) {
            fill(colors[this.color]);
            rect(0, 0, gridSize, gridSize);
        }

        if (this.star) {
            fill('#faf030');
            star(gridSize / 2, gridSize / 2, 5, 12, 5);
        }

        if (debug) {
            fill(0);
            noStroke();
            text(`${this.x}:${this.y}`, 5, 15);
        }

        pop();
    }
}

function star(x, y, radius1, radius2, npoints) {
    const angle = TWO_PI / npoints;

    beginShape();
    for (let a = radians(-90); a < TWO_PI - radians(90); a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a + angle / 2) * radius1;
        sy = y + sin(a + angle / 2) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
}

function loadFuncs() {
    const $functions = $('.functions');
    const funcs = [];

    $functions.find('.function').each((id, el) => {
        const $function = $(el);
        const func = [];

        $function.find('.step').each((id, el) => {
            const $step = $(el);

            const tool = $step.attr('data-tool');
            const color = parseInt($step.attr('data-color'));

            func.push({ tool, color });
        });
        funcs.push(func)
    });

    loadFunc(funcs[0]);
}

function loadFunc(func) {
    const $timeline = $('.timeline');
    $timeline.empty();
    for (const step of func) {
        $timeline.append(`<div class="step" data-tool="${step.tool}" data-color="${step.color}"></div>`);
    }

    buildTimeline($timeline)
}

function buildTimeline($timeline) {
    const timeline = [];

    $timeline.find('.step').each((id, el) => {
        const $step = $(el);

        const tool = $step.attr('data-tool');
        const color = parseInt($step.attr('data-color')) | 0;
        timeline.push({ tool, color });
    });

    play(timeline);
}

function play(timeline) {
    const step = timeline[0];

    if (step.color === 0 || step.color === cells.find(c => c.x === hero.x && c.y === hero.y).color) {
        if (step.tool === 'forward') hero.forward();
        else if (step.tool === 'right') hero.right();
        else if (step.tool === 'left') hero.left();
    }

    timeline.shift();
    setTimeout(() => {
        $('.timeline .step:first-child').remove();
        if (timeline.length) play(timeline);
    }, 1000);
}

$(document).on('click', '.functions .step', e => {
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
    const tool = $el.attr('data-tool');
    if ($('.step.selected').attr('data-tool') === tool) {
        $('.step.selected').attr('data-tool', '');
    } else {
        $('.step.selected').attr('data-tool', tool);
    }
});

$(document).on('click', '.action', e => {
    const $el = $(e.target);
    const action = $el.attr('data-action');

    if (action === 'play') loadFuncs();
});
