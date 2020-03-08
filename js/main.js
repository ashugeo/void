const gridSize = 40;
let rows;
let cols;

const speed = 1000;

const debug = false;

const colors = [null, '#edeeef', '#50ce55', '#47adff', '#ffc107'];

const board = [];
let funcs;

let hoveredCell = {};
let clickedCell = {};
let selectedCell = {};

let hero;

let state = 'stopped';
let dark = false;

let $timeline;
let timeline;

const level = {
    map: [],
    hero: {},
    tools: []
};

function preload() {
    $timeline = $('.timeline');

    // str = '111s30001s021301s00w4h4x0y0d1f4arlc12';

    const str = location.search.replace('?', '');

    if (str) loadLevel(str);

    // Create and position hero
    hero = new Hero(level.hero.x, level.hero.y, level.hero.dir);

    // Display functions slots in UI
    const $functions = $('.functions');
    level.funcs.forEach((func, f) => {
        $functions.append(`<div class="function"><span>f${f + 1}</span>${'<div class="step"></div>'.repeat(func)}</div>`);
    });

    const $tools = $('.tools');

    // Display colors in UI
    let colors = '<div class="row">';
    for (const color of level.colors) {
        colors += `<div class="color" data-color="${color + 1}"></div>`;
    }
    colors += '</div>';
    $tools.prepend(colors);

    // Display tools in UI
    let tools = '<div class="row">';
    for (const tool of level.tools) {
        tools += `<div class="tool" data-tool="${tool}"></div>`;
    }

    for (let f of Object.keys(level.funcs)) {
        f = parseInt(f);
        tools += `<div class="tool" data-tool="f${f + 1}"></div>`;
    }

    tools += '</div>';
    $tools.prepend(tools);
}

function setup() {
    const canvas = createCanvas(window.innerWidth / 2, window.innerHeight);
    dark = $('body').hasClass('dark');
    canvas.parent('canvas-wrapper');

    rows = level.map.length;
    cols = level.map[0].length;

    for (let y = 0; y < rows; y += 1) {
        board[y] = [];
        for (let x = 0; x < cols; x += 1) {
            board[y].push(new Cell(x, y, level.map[y] ? level.map[y][x] : false));
        }
    }
}

function draw() {
    hoveredCell = {};

    clear();
    if (dark) background('#1c334050');
    else background(255, 50);
    noFill();

    const oX = Math.floor(width / 2 - cols * gridSize / 2);
    const oY = Math.floor(height / 2 - rows * gridSize / 2);

    translate(oX, oY);

    for (let j = -20; j < 20; j += 1) {
        for (let i = -20; i < 20; i += 1) {
            if (board[i] && board[i][j]) {
                if (dark) stroke(30, 150, 255, 1);
                else stroke(50, 100, 200, 1);
                for (let y = -2; y <= 2; y += 1) {
                    for (let x = -2; x <= 2; x += 1) {
                        rect((j + y) * gridSize, (i + x) * gridSize + 3, gridSize, gridSize);
                    }
                }
            }
        }
    }
    stroke(150);

    for (const row of board) {
        for (const cell of row) cell.display();
    }
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
        stroke(0, 200);
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

        if (this.color) {
            noStroke();
            fill(220);
            rect(0, gridSize, gridSize, 4);
            fill(colors[this.color]);
            stroke(0, 50);
            rect(0, 0, gridSize, gridSize);
        }

        if (this.star && !this.starClear) {
            push();
            translate(gridSize / 2, gridSize / 2);
            rotate(frameCount / 100);
            scale(map(sin(frameCount / 20), 0, 1, .8, 1));
            fill('#faf030');
            stroke(0, 200);
            star(0, 0, 5, 12, 5);
            pop();
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
 * Turn level string into JSON
 * @param {String} str string representation of level
 */
function loadLevel(str) {
    // Find map substring
    const map = str.split('w')[0];
    
    // Split map into cells
    const cells = map.match(/\ds*/g);

    // Find map width and height
    const width = parseInt(str.split('w')[1].split('h')[0]);
    const height = parseInt(str.split('h')[1].split('x')[0]);

    // Turn 1D array of cells to 2D map array
    for (let y = 0; y < height; y += 1) {
        let row = [];
        for (let x = 0; x < width; x += 1) row.push(cells[y * width + x]);
        level.map.push(row);
    }

    // Find hero coordinates and direction
    level.hero.x = parseInt(str.split('x')[1].split('y')[0]);
    level.hero.y = parseInt(str.split('y')[1].split('d')[0]);
    level.hero.dir = parseInt(str.split('d')[1].split('f')[0]);

    // Find level functions and colors
    level.funcs = str.match(/f\d+/g).map(d => parseInt(d.replace('f', '')));
    level.colors = str.match(/c[\d]+/g)[0].replace('c', '').split('').map(d => parseInt(d));

    // Find level tools
    if (str.includes('a')) level.tools.push('forward');
    if (str.includes('r')) level.tools.push('right');
    if (str.includes('l')) level.tools.push('left');
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
            if (!tool) return;
            const color = parseInt($step.attr('data-color')) || 0;
            func.push({ tool, color });
        });
        funcs.push(func);
    });

    // Load f1 to timeline and play it
    buildTimeline(funcs[0]);
}

function buildTimeline(func) {
    // Reset UI timeline by emptying it
    $timeline.empty();

    // Fill UI timeline with a function's steps
    $timeline.html(funcToHTML(func));

    // Create timeline (array of steps)
    timeline = [];
    $timeline.find('.step').each((id, el) => {
        const $step = $(el);
        const tool = $step.attr('data-tool');
        const color = parseInt($step.attr('data-color')) || 0;
        timeline.push({ tool, color });
    });
}

/**
* Turn a function (array of steps) to HTML for the UI
* @param  {Array} func  function (array of steps)
* @return {String}      HTML to inject to the DOM
*/
function funcToHTML(func) {
    html = '';
    for (const step of func) {
        if (step.tool) html += `<div class="step" data-tool="${step.tool}" data-color="${step.color}"></div>`;
    }
    return html;
}

function playStep() {
    // Action to play
    const step = timeline[0];

    // Find cell the hero is on
    let cell = board[hero.y][hero.x];

    // Any color, or matching color
    if (step.color === 0 || step.color === cell.color) {
        if (step.tool === 'forward') {
            // Move forward
            hero.forward();

            // Find new cell the hero is on
            cell = board[hero.y][hero.x];

            // Moved out of board
            if (!cell || cell.color === undefined) return lost();

            // Stepped on a star
            if (cell.star) {
                // Mark star as collected
                cell.starClear = true;

                // Check if all stars have been collected if so, game is won
                const stars = board.map(row => row.find(c => c.star && !c.starClear)).filter(Boolean);
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
            $('.timeline .step:first-child').after(funcToHTML(funcs[func]));
        }
    }

    // Remove action that has just been played from timeline
    timeline.shift();

    setTimeout(() => {
        if (state === 'playing') {
            // Remove action from UI
            $('.timeline .step:first-child').remove();

            // Play next action if there's any, otherwise game is lost
            if (timeline.length) playStep();
            else lost();
        }
    }, speed);
}

function won() {
    console.log('won');
    state = 'stopped';
}

function lost() {
    console.log('lost');
    state = 'stopped';
}

$(document).on('click', '.functions .step', e => {
    // Select a step by clicking on it
    const $el = $(e.target);
    if ($el.hasClass('selected')) {
        $('.step.selected').removeClass('selected');
    } else {
        $('.step.selected').removeClass('selected');
        $el.addClass('selected');
    }
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

    if (action === 'play') play($el);
    else if (action === 'pause') pause($el);
    else if (action === 'next') next();
    else if (action === 'stop') stop();
});

function play($el) {
    if (state === 'stopped') {
        loadFuncs();
        
        // Timeline is not empty, play it
        if (timeline[0]) setTimeout(() => playStep(), speed);
    }
    else if (state === 'paused') playStep();
    state = 'playing';
    $el.attr('data-action', 'pause').html('❙ ❙');
}

function pause($el) {
    state = 'paused';
    $el.attr('data-action', 'play').html('►');

    // Remove action from UI
    $('.timeline .step:first-child').remove();
}

function next() {
    if (state === 'stopped') loadFuncs();
    state = 'paused';
    $('[data-action="pause"]').attr('data-action', 'play').html('►');
    
    playStep();
    
    // Remove action from UI
    $('.timeline .step:first-child').remove();
}

function stop() {
    $('[data-action="pause"]').attr('data-action', 'play').html('►');
    state = 'stopped';

    hero.reset();

    // Reset board
    for (const cell of board.filter(c => c.starClear)) {
        cell.starClear = false;
    }

    // Reset UI timeline by emptying it
    $timeline.empty();
}

$(document).on('click', '.toggle-dark', () => {
    $('.timeline').addClass('hidden');
    $('body').toggleClass('dark');
    dark = !dark;

    localStorage.setItem('darkmode', dark);

    // Hack to hide linear-gradient un-transition
    setTimeout(() => {
        $timeline.removeClass('hidden');
    }, 300);
});

function keyPressed() {
    if (key === 'ArrowRight') {
        if (!$('.step.selected').length) {
            $('.function:first-child .step:first-of-type').addClass('selected');
        } else {
            const $selected = $('.selected');
            $selected.removeClass('selected');
            if ($selected.next('.step').length) $selected.next('.step').addClass('selected');
            else if ($selected.parent().next('.function').length) {
                $selected.parent().next('.function').find('.step:first-of-type').addClass('selected');
            }
        }
    } else if (key === 'ArrowLeft') {
        if (!$('.step.selected').length) {
            $('.function:last-child .step:last-of-type').addClass('selected');
        } else {
            const $selected = $('.selected');
            $selected.removeClass('selected');
            if ($selected.prev('.step').length) $selected.prev('.step').addClass('selected');
            else if ($selected.parent().prev('.function').length) {
                $selected.parent().prev('.function').find('.step:last-of-type').addClass('selected');
            }
        }
    }
}