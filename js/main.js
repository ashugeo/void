const gridSize = 40;
let rows;
let cols;

const debug = false;

const colors = ['#dddddd', '#4caf50', '#2196f3', '#ffc107'];

const board = [];
let funcs;

let hoveredCell = {};
let clickedCell = {};
let selectedCell = {};

let map;
let hero;

let playing = false;

function preload() {
    const data = loadJSON('data/map1.json', () => {
        map = data.map;
        hero = new Hero(data.hero.pos.x, data.hero.pos.y, data.hero.dir);

        const $functions = $('.functions');
        for (const func of data.funcs) {
            $functions.append(`<div class="function">${'<div class="step"></div>'.repeat(func)}<div>`);
        }

        const $tools = $('.tools');

        let tools = '<div class="row">';
        for (const tool of data.tools) {
            tools += `<div class="tool" data-tool="${tool}"></div>`;
        }
        tools += '</div>';
        $tools.append(tools);

        let colors = '<div class="row">';
        for (const color of data.colors) {
            colors += `<div class="color" data-color="${color}"></div>`;
        }
        colors += '</div>';
        $tools.append(colors);
    });
}

function setup() {
    const canvas = createCanvas(window.innerWidth / 2, window.innerHeight);
    canvas.parent('canvas-wrapper');

    rows = map.length;
    cols = map[0].length;

    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
            board.push(new Cell(x, y, map[y] ? map[y][x] : false));
        }
    }
}

function draw() {
    hoveredCell = {};

    background(255);
    noFill();

    const oX = Math.floor(width / 2 - cols * gridSize / 2);
    const oY = Math.floor(height / 2 - rows * gridSize / 2);

    translate(oX, oY);
    for (const cell of board) cell.display();
    hero.display();
}

class Hero {
    constructor(x, y, dir) {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.startX = x;
        this.startY = y;
        this.startDir = dir;
    }

    display() {
        push();
        translate((1 / 2 + this.x) * gridSize, (1 / 2 + this.y) * gridSize);
        rotate(radians(this.dir * 90));
        fill(255);
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

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = this.startDir;
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

        if (this.star && !this.starClear) {
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
    funcs = [];

    $functions.find('.function').each((id, el) => {
        const $function = $(el);
        const func = [];

        $function.find('.step').each((id, el) => {
            const $step = $(el);

            const tool = $step.attr('data-tool');
            const color = parseInt($step.attr('data-color')) | 0;

            func.push({ tool, color });
        });
        funcs.push(func)
    });

    playing = true;
    buildTimeline(funcs[0]);
}

function buildTimeline(func) {
    const $timeline = $('.timeline');
    $timeline.empty();
    $timeline.html(funcToHtml(func));

    const timeline = [];
    $timeline.find('.step').each((id, el) => {
        const $step = $(el);

        const tool = $step.attr('data-tool');
        const color = parseInt($step.attr('data-color')) | 0;
        timeline.push({ tool, color });
    });

    if (timeline[0]) setTimeout(() => {
        play($timeline, timeline);
    }, 1000);
}

function funcToHtml(func) {
    html = '';
    for (const step of func) {
        if (step.tool) html += `<div class="step" data-tool="${step.tool}" data-color="${step.color}"></div>`;
    }
    return html;
}

function play($timeline, timeline) {
    const step = timeline[0];

    let cell = board.find(c => c.x === hero.x && c.y === hero.y);
    if (step.color === 0 || step.color === cell.color) {
        if (step.tool === 'forward') {
            hero.forward();
            cell = board.find(c => c.x === hero.x && c.y === hero.y);
            if (!cell.color) lost();
            if (cell.star) {
                cell.starClear = true;
                const stars = board.filter(c => c.star && !c.starClear)
                if (stars.length === 0) won();
            }
        } else if (step.tool === 'right') {
            hero.right();
        } else if (step.tool === 'left') {
            hero.left();
        } else if (step.tool === 'f1') {
            timeline.splice(1, 0, ...funcs[0]);
            $('.timeline .step:first-child').after(funcToHtml(funcs[0]));
        }
    }

    timeline.shift();
    setTimeout(() => {
        if (playing) {
            $('.timeline .step:first-child').remove();
            if (timeline.length) play($timeline, timeline);
            else lost();
        }
    }, 1000);
}

function won() {
    console.log('won');
    playing = false;
}

function lost() {
    console.log('lost');
    playing = false;
}

function stop() {
    hero.reset();
    for (const cell of board.filter(c => c.starClear)) {
        cell.starClear = false;
    }
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

    if (action === 'play') {
        stop();
        loadFuncs();
    }
});
