var DEBUG = false;
var SPEED = 180;
var GRAVITY = 18;
var FLAP = 420;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 144;

// Load game
WebFontConfig = {
    google: { families: [ 'Press+Start+2P::latin' ] },
    active: main
};
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();

function main() {

var state = {
    preload: preload,
    create: create,
    update: update,
    render: render
};

var parent = document.querySelector('#screen');

var game = new Phaser.Game(
    320,
    568,
    Phaser.CANVAS,
    parent,
    state
);

function preload() {
    var assets = {
        spritesheet: {
            birdie: ['assets/eagol.png', 52, 43],
            clouds: ['assets/clouds.png', 128, 64]
        },
        image: {
            bigpack: ['assets/bigpack.jpg'],
            winpack: ['assets/pack.jpg'],
            tower:   ['assets/tower.png'],
            fence:   ['assets/fence.png']
        },
        audio: {
            flap: ['assets/flap.wav'],
            score: ['assets/score.wav'],
            hurt: ['assets/hurt.wav']
        }
    };
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            game.load[type].apply(game.load, [id].concat(assets[type][id]));
        });
    });
}

var gameStarted,
    gameOver,
    score,
    bg,
    //credits,
    clouds,
    towers,
    invs,
    birdie,
    fence,
    scoreText,
    instText,
    winpack,
    bigpack,
    highScoreText,
    gameOverText,
    leaderboard,
    flapSnd,
    scoreSnd,
    hurtSnd,
    towersTimer,
    cloudsTimer;

function create() {
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xCCEEFF, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Credits 'yo
    // Wait lang steve!
    /*
    credits = game.add.text(
        game.world.width / 2,
        10,
        'marksteve.com/dtmb\n@themarksteve',
        {
            font: '8px "Press Start 2P"',
            fill: '#fff',
            align: 'center'
        }
    ); */
    //credits.anchor.x = 0.5;
    // Add clouds group
    clouds = game.add.group();
    // Add towers
    towers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add a big pack here...
    bigpack=game.add.sprite(150, 250, 'bigpack');

    // Add birdie
    birdie = game.add.sprite(0, 0, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.animations.add('fly', [0, 1, 2, 3], 5, true);
    birdie.inputEnabled = true;
    birdie.body.collideWorldBounds = true;
    birdie.body.gravity.y = GRAVITY;
    // Add fence
    fence = game.add.tileSprite(0, game.world.height - 32, game.world.width, 32, 'fence');
    fence.tileScale.setTo(2, 2);

    // Add game over text
    highScoreText = game.add.text(
        game.world.width / 2,
        game.world.height / 3,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
        }
    );
    highScoreText.anchor.setTo(0.5, 0.5);

    // Add score text
    scoreText = game.add.text(
        game.world.width / 2, //test
        game.world.height / 5,
        "",
        {
            font: '25px "Press Start 2P"',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
        }
    );
    scoreText.anchor.setTo(0.5, 0.5);

    // Add score text
    titleText = game.add.text(
        game.world.width / 2, //test
        game.world.height / 5,
        "",
        {
            font: '20px "Press Start 2P"',
            fill: '#000000',
            stroke: '#2dcc70',
            strokeThickness: 4,
            align: 'center'
        }
    );
    titleText.anchor.setTo(0.5, 0.5);

    // Add instructions text
    instText = game.add.text(
        game.world.width / 2,
        game.world.height - game.world.height / 4,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
        }
    );
    instText.anchor.setTo(0.5, 0.5);

    // ETO YUN!
    gameOverText = game.add.text(
        game.world.width / 2,
        game.world.height / 2,
        "",
        {
            font: '23px "Press Start 2P"',
            fill: '#000000',
            stroke: '#2dcc70',
            strokeThickness: 4,
            align: 'center'
        }
    );
    gameOverText.setText("Choose\nThe\nBetter Black");
    gameOverText.anchor.setTo(0.5, 0.5);
    gameOverText.renderable = false;

    // Add sounds
    flapSnd = game.add.audio('flap');
    scoreSnd = game.add.audio('score');
    hurtSnd = game.add.audio('hurt');
    // Add controls
    game.input.onDown.add(flap);
    // Start clouds timer
    cloudsTimer = new Phaser.Timer(game);
    cloudsTimer.onEvent.add(spawnCloud);
    cloudsTimer.start();
    cloudsTimer.add(Math.random());
    // RESET!
    reset();
}

function reset() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    scoreText.renderable = false;
    //credits.renderable = true;
    titleText.setText("\n\nWinston\nExtreme Mint\n\nChoose\nThe\nBetter Black");
    instText.setText("TOUCH TO\nFLAP WINGS");
    titleText.renderable = true;
    bigpack.renderable = true;
    highScoreText.renderable = false;
    gameOverText.renderable = false;
    birdie.body.allowGravity = false;
    birdie.angle = 0;
    birdie.reset(game.world.width / 4, game.world.height / 2);
    birdie.animations.play('fly');
    birdie.scale.setTo(1, 1);
    towers.removeAll();
    invs.removeAll();
}

function start() {
    //credits.renderable = false;
    birdie.body.allowGravity = true;
    // SPAWN FINGERS!
    towersTimer = new Phaser.Timer(game);
    towersTimer.onEvent.add(spawnTowers);
    towersTimer.start();
    towersTimer.add(2);
    // Show score
    scoreText.setText(score);
    scoreText.renderable = true;
    instText.renderable = false;
    titleText.renderable = false;
    bigpack.renderable = false;
    // START!
    gameStarted = true;
}

function flap() {
    if (!gameStarted) {
        start();
    }
    if (!gameOver) {
        birdie.body.velocity.y = -FLAP;
        flapSnd.play();
    }
}

function spawnCloud() {
    cloudsTimer.stop();

    var cloudY = Math.random() * game.height / 2;
    var cloud = clouds.create(
        game.width,
        cloudY,
        'clouds',
        Math.floor(4 * Math.random())
    );
    var cloudScale = 2 + 2 * Math.random();
    cloud.alpha = 2 / cloudScale;
    cloud.scale.setTo(cloudScale, cloudScale);
    cloud.body.allowGravity = false;
    cloud.body.velocity.x = -SPEED / cloudScale;
    cloud.anchor.y = 0;

    cloudsTimer.start();
    cloudsTimer.add(4 * Math.random());
}

function o() {
    return OPENING + 60 * ((score > 50 ? 50 : 50 - score) / 50);
}

function spawnTower(towerY, flipped) {
    var tower = towers.create(
        game.width,
        towerY + (flipped ? -o() : o()) / 2,
        'tower'
    );
    tower.body.allowGravity = false;

    // Flip tower! *GASP*
    tower.scale.setTo(2, flipped ? -2 : 2);
    tower.body.offset.y = flipped ? -tower.body.height * 2 : 0;

    // Move to the left
    tower.body.velocity.x = -SPEED;

    return tower;
}

function spawnTowers() {
    towersTimer.stop();

    var towerY = ((game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom tower
    var botTower = spawnTower(towerY);
    // Top tower (flipped)
    var topTower = spawnTower(towerY, true);

    /*
     *  This produces the random win packs. LOL
     *  create(x, y, key, frame, exists)
     */
    //var packY = Math.random() * topTower.x / 2;
    var packY = Math.floor(Math.random() * (game.height-100) ) + 2;
    var inv = invs.create(
        topTower.x + topTower.width + Math.floor(Math.random() * 100 ) + 2, //ToDo: must not be totally IMPOSSIBLE to reach
        packY,
        'winpack'
    );

    inv.body.allowGravity = false;
    inv.body.velocity.x = -SPEED;

    towersTimer.start();
    towersTimer.add(1 / SPAWN_RATE);
}

function addScore(_, inv) {
    invs.remove(inv); // This removes the pack after getting it
    score += 1;
    scoreText.setText(score);
    scoreSnd.play();
}

function setGameOver() {
    gameOver = true;

    instText.setText("TAP EAGLE\nTO TRY AGAIN");
    instText.renderable = true;
    /*
    var hiscore = window.localStorage.getItem('hiscore');
    hiscore = hiscore ? hiscore : score;
    hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
    window.localStorage.setItem('hiscore', hiscore);
    */
    //highScoreText.setText("HIGHSCORE\n" + hiscore);
    // Just your score for now

    highScoreText.setText("FINAL SCORE\n ");
    highScoreText.renderable = true; //dont show high score

    gameOverText.renderable = true;

    // Stop all towers
    towers.forEachAlive(function(tower) {
        tower.body.velocity.x = 0;
    });
    invs.forEach(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning towers
    towersTimer.stop();
    // Make birdie reset the game
    birdie.events.onInputDown.addOnce(reset);
    hurtSnd.play();
}

function update() {
    if (gameStarted) {
        // Make birdie dive
        var dvy = FLAP + birdie.body.velocity.y;
        birdie.angle = (90 * dvy / FLAP) - 180;
        if (birdie.angle < -30) {
            birdie.angle = -30;
        }
        if (
            gameOver ||
            birdie.angle > 90 ||
            birdie.angle < -90
        ) {
            birdie.angle = 90;
            birdie.animations.stop();
            birdie.frame = 3;
        } else {
            birdie.animations.play('fly');
        }
        // Birdie is DEAD!
        if (gameOver) {
            if (birdie.scale.x < 2) {
                birdie.scale.setTo(
                    birdie.scale.x * 1.2,
                    birdie.scale.y * 1.2
                );
            }
            highScoreText.scale.setTo(
                1 + 0.1 * Math.sin(game.time.now / 100),
                1 + 0.1 * Math.cos(game.time.now / 100)
            );
            gameOverText.angle = Math.random() * 5 * Math.cos(game.time.now / 100);
        } else {
            // Check game over
            game.physics.overlap(birdie, towers, setGameOver);
            if (!gameOver && birdie.body.bottom >= game.world.bounds.bottom) {
                setGameOver();
            }
            // Add score
            game.physics.overlap(birdie, invs, addScore);
        }
        // Remove offscreen towers
        towers.forEachAlive(function(tower) {
            if (tower.x + tower.width < game.world.bounds.left) {
                tower.kill();
            }
        });
        // Update tower timer
        towersTimer.update();
    } else {
        birdie.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
    }
    if (!gameStarted || gameOver) {
        // Shake instructions text
        instText.scale.setTo(
            1 + 0.1 * Math.sin(game.time.now / 100),
            1 + 0.1 * Math.cos(game.time.now / 100)
        );
    }
    // Shake score text
    scoreText.scale.setTo(
        1 + 0.1 * Math.cos(game.time.now / 100),
        1 + 0.1 * Math.sin(game.time.now / 100)
    );
    // Update clouds timer
    cloudsTimer.update();
    // Remove offscreen clouds
    clouds.forEachAlive(function(cloud) {
        if (cloud.x + cloud.width < game.world.bounds.left) {
            cloud.kill();
        }
    });
    // Scroll fence
    if (!gameOver) {
        fence.tilePosition.x -= game.time.physicsElapsed * SPEED / 2;
    }
}

function render() {
    if (DEBUG) {
        game.debug.renderSpriteBody(birdie);
        towers.forEachAlive(function(tower) {
            game.debug.renderSpriteBody(tower);
        });
        invs.forEach(function(inv) {
            game.debug.renderSpriteBody(inv);
        });
    }
}

};
