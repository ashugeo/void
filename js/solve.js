self.addEventListener('message', async e => {
    const winningFuncs = await solve(e.data);
    self.postMessage(winningFuncs);
});

let funcs = [];

async function solve(data) {
    console.log('solving');
    const { board, hero, level } = { ...data };
    const winningFuncs = [];
    
    let settings = [];
    for (const tool of [...level.tools, ...level.funcs.map((f, i) => `f${i + 1}`)]) {
        for (const color of [0, ...level.colors]) {
            settings.push({ tool, color });
        }
    }

    funcs = [];

    let i = 0;

    const sleep = async ms => new Promise(res => setTimeout(res, ms));

    const buildStep = async step => {
        for (const setting of settings) {
            call = 0;
            i += 1;

            hero.x = hero.startX;
            hero.y = hero.startY;
            hero.dir = hero.startDir;

            board.filter(cell => cell.starClear).map(cell => cell.starClear = false);

            let f = 0;
            let s = step;
            while (s >= level.funcs[f]) {
                s -= level.funcs[f];
                f += 1;
            }

            if (!funcs[f]) funcs[f] = [];
            funcs[f][s] = { ...setting };

            const timeline = [...funcs[0]];

            // Store winning configurations
            if (playStep(board, hero, timeline) === 'won') winningFuncs.push(JSON.parse(JSON.stringify(funcs)));

            // await sleep(10);

            if (winningFuncs.length > 20) return winningFuncs;

            if (step + 1 < level.funcs.reduce((acc, curr) => acc + curr, 0)) await buildStep(step + 1);
        }
    }

    await buildStep(0);
    console.log(i);

    console.log({ winningFuncs });

    // if (winningFuncs.some(config => config.some(step => step.tool === ''))) {
    //     // winningFuncs = winningFuncs.filter(config => !config.every(step => step.tool !== ''));
    //     console.log(winningFuncs);
    // }

    return winningFuncs;
}

let call = 0;
function playStep(board, hero, timeline) {
    // Action to play
    const step = timeline[0];
    if (!step) return;

    // Prevent exceeded maximum call stack size
    call += 1;
    if (call > 200) {
        call = 0;
        return 'lost';
    }

    // Find cell the hero is on
    let cell = board.find(c => c.x === hero.x && c.y === hero.y);

    if (!cell) return 'lost';

    // Any color, or matching color
    if (step.color === 0 || step.color === cell.color) {
        if (step.tool === 'forward') {
            // Move forward
            hero.x += [0, 1, 0, -1][hero.dir];
            hero.y += [-1, 0, 1, 0][hero.dir];

            // Find new cell the hero is on
            cell = board.find(c => c.x === hero.x && c.y === hero.y);

            // Moved out of board
            if (!cell || cell.color === undefined) return 'lost';

            // Stepped on a star
            if (cell.star) {
                // Mark star as collected
                cell.starClear = true;

                // Check if all stars have been collected if so, game is won
                const stars = board.map(c => c.star && !c.starClear).filter(Boolean);
                if (stars.length === 0) return 'won';
            }
        } else if (step.tool === 'right') {
            // Turn right (clockwise)
            hero.dir = (4 + hero.dir + 1) % 4;
        } else if (step.tool === 'left') {
            // Turn left (counterclockwise)
            hero.dir = (4 + hero.dir - 1) % 4;
        } else if (step.tool[0] === 'f') {
            // Add function to timeline
            const func = parseInt(step.tool.replace('f', '')) - 1;
            if (funcs[func]) timeline.splice(1, 0, ...funcs[func]);
        }
    }

    // Remove action that has just been played from timeline
    timeline.shift();

    // if (timeline[0] && timeline[0].tool === 'f1') return lost();
    if (timeline.length) return playStep(board, hero, timeline);
    else return 'lost';
}