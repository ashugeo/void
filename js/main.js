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
    // Load map
    const data = loadJSON('data/map2.json', () => {
        map = data.map;

        // Create and position hero
        hero = new Hero(data.hero.pos.x, data.hero.pos.y, data.hero.dir);

        // Display functions slots in UI
        const $functions = $('.functions');
        for (const func of data.funcs) {
            $functions.append(`<div class="function">${'<div class="step"></div>'.repeat(func)}<div>`);
        }

        const $tools = $('.tools');

        // Display tools in UI
        let tools = '<div class="row">';
        for (const tool of data.tools) {
            tools += `<div class="tool" data-tool="${tool}"></div>`;
        }
        tools += '</div>';
        $tools.append(tools);

        // Display colors in UI
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

/**
* Load functions created by the player
*/
function loadFuncs() {
    const $functions = $('.functions');

    // Array of functions (f1, f2…)
    funcs = [];

    $functions.find('.function').each((id, el) => {
        const $function = $(el);

        // Array of steps in a function
        const func = [];

        $function.find('.step').each((id, el) => {
            const $step = $(el);
            const tool = $step.attr('data-tool');
            const color = parseInt($step.attr('data-color')) | 0;
            func.push({ tool, color });
        });
        funcs.push(func);
    });

    // Load f1 to timeline and play it
    buildTimeline(funcs[0]);
}

function buildTimeline(func) {
    const $timeline = $('.timeline');

    // Reset UI timeline by emptying it
    $timeline.empty();

    // Fill UI timeline with a function's steps
    $timeline.html(funcToHtml(func));

    // Create timeline (array of steps)
    const timeline = [];
    $timeline.find('.step').each((id, el) => {
        const $step = $(el);
        const tool = $step.attr('data-tool');
        const color = parseInt($step.attr('data-color')) | 0;
        timeline.push({ tool, color });
    });

    // Timeline is not empty, play it
    if (timeline[0]) setTimeout(() => {
        playing = true;
        play($timeline, timeline);
    }, 1000);
}

/**
* Turn a function (array of steps) to HTML for the UI
* @param  {Array} func  function (array of steps)
* @return {String}      HTML to inject to the DOM
*/
function funcToHtml(func) {
    html = '';
    for (const step of func) {
        if (step.tool) html += `<div class="step" data-tool="${step.tool}" data-color="${step.color}"></div>`;
    }
    return html;
}

function play($timeline, timeline) {
    // Action to play
    const step = timeline[0];

    // Find cell the hero is on
    let cell = board.find(c => c.x === hero.x && c.y === hero.y);

    // Any color, or matching color
    if (step.color === 0 || step.color === cell.color) {
        if (step.tool === 'forward') {
            // Move forward
            hero.forward();

            // Find new cell the hero is on
            cell = board.find(c => c.x === hero.x && c.y === hero.y);

            // Moved out of board
            if (!cell.color) lost();

            // Stepped on a star
            if (cell.star) {
                // Mark star as collected
                cell.starClear = true;

                // Check if all stars have been collected if so, game is won
                const stars = board.filter(c => c.star && !c.starClear)
                if (stars.length === 0) won();
            }
        } else if (step.tool === 'right') {
            // Turn right (clockwise)
            hero.right();
        } else if (step.tool === 'left') {
            // Turn left (counterclockwise)
            hero.left();
        } else if (step.tool[0] === 'f') {
            // Add function to timeline
            const func = parseInt(step.tool.replace('f', '')) - 1;
            timeline.splice(1, 0, ...funcs[func]);
            $('.timeline .step:first-child').after(funcToHtml(funcs[func]));
        }
    }

    // Remove action that has just been played from timeline
    timeline.shift();

    setTimeout(() => {
        if (playing) {
            // Remove action from UI
            $('.timeline .step:first-child').remove();

            // Play next action if there's any, otherwise game is lost
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

    // Reset board
    for (const cell of board.filter(c => c.starClear)) {
        cell.starClear = false;
    }
}

$(document).on('click', '.functions .step', e => {
    // Select a step by clicking on it
    const $el = $(e.target);
    $('.step.selected').removeClass('selected');
    $el.addClass('selected');
});

$(document).on('click', '.color', e => {
    // Add or remove color to selected step
    const $el = $(e.target);
    const color = $el.attr('data-color')
    if ($('.step.selected').attr('data-color') === color) {
        $('.step.selected').attr('data-color', '');
    } else {
        $('.step.selected').attr('data-color', color);
    }
});

$(document).on('click', '.tool', e => {
    // Add or remove action to selected step
    const $el = $(e.target);
    const tool = $el.attr('data-tool');
    if ($('.step.selected').attr('data-tool') === tool) {
        $('.step.selected').attr('data-tool', '');
    } else {
        $('.step.selected').attr('data-tool', tool);
    }
});

$(document).on('click', '.action', e => {
    // Manage player actions
    const $el = $(e.target);
    const action = $el.attr('data-action');

    if (action === 'play') {
        stop();
        loadFuncs();
    }
});
