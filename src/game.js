/**
 * Created by kevinholland on 1/9/16.
 */

var keys = {};

var playerAccel = 3000; //.4
var playerDecel = 400;

var enemyWidth = 60;
var enemyHeight = 50;
var gravity = 750;

var playerSquare;
var defaultPlayerHeight = 80;
var defaultPlayerWidth = 20;

var FPS = 60;

var stage;

var mousedown = false;
var mouseX = 0;

function init() {
    //Create a stage by getting a reference to the canvas
    stage = new createjs.Stage("game-canvas");
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;
    stage.width = stage.canvas.width;
    stage.height = stage.canvas.height;

    stage.on("stagemousedown", function(event) {
        mousedown = true;
        mouseX = event.stageX;
    });
    stage.on("stagemouseup", function(event) {
       mousedown = false;
    });

    splitters = [];
    playerBoxes = [];
    addPlayerBox(4,stage.width / 2 - defaultPlayerHeight / 2);

    createjs.Touch.enable(stage);

    //Update stage will render next frame
    createjs.Ticker.addEventListener("tick", handleTick);
    createjs.Ticker.setFPS(FPS);

    this.document.onkeydown = keydown;
    this.document.onkeyup = keyup;
}

function keydown(event) {
    keys[event.keyCode] = true;
}

function keyup(event) {
    delete keys[event.keyCode];
}

function movePlayerBox(box, acceleration, time) {

    //get next potential spot
    var newPos = (.5 * acceleration * Math.pow(time,2)) + box.velocity * time + box.x;

    //if this spot is a collision
    //get the new acceleration
    //calculate the new "next position"

    // set new position
    // calculate and set new velocity

    if (checkCollision(box, newPos)) {
        return;
    }
    box.x = newPos;
    box.velocity = acceleration * time + box.velocity;
    if (Math.abs(box.velocity) < 1) box.velocity = 0;
}

function moveObjectVertical(object, acceleration, time) {
    time = time / 1000;
    object.y = (.5 * acceleration * Math.pow(time,2)) + object.velocity * time + object.y;
    object.velocity += acceleration * time;
}

function handleTick(event) {
    playerSquare.acceleration = 0;

    //calculate acceleration of player based on pressed keys
    if (keys[68] || (mousedown && mouseX < stage.width / 2)) playerSquare.acceleration -= playerAccel;
    if (keys[70] || (mousedown && mouseX > stage.width / 2)) playerSquare.acceleration += playerAccel;

    //moving right = positive velocity
    //moving left = negative velocity
    //positive velocity -> negative acceleration (due to friction)
    //negative velocity -> positive acceleration (due to friction)
    playerSquare.acceleration -= playerDecel * getSign(playerSquare.velocity);

    moveSplitters(event);
    movePlayerBox(playerSquare, playerSquare.acceleration, event.delta/1000);
    randomlyGenerateSplitter();

    stage.update();
}

function addPlayerBox(mass, xPos) {
    //create a square object
    playerSquare = new createjs.Shape();

    playerSquare.graphics.beginFill("#115B89").drawRect(
        xPos,
        stage.height - defaultPlayerHeight - 10,
        defaultPlayerWidth * mass,
        defaultPlayerHeight
    );
    playerSquare.leftBound = -1 * stage.width / 2;
    playerSquare.rightBound = stage.width / 2;
    playerSquare.velocity = 0;
    playerSquare.mass = mass;

    playerBoxes.push(playerSquare);
    stage.addChild(playerSquare);
}


function checkCollision(object, nextPos) {
    if (nextPos + object.graphics.command.w / 2 > object.rightBound) {
        object.x = object.rightBound - object.graphics.command.w / 2;
        object.velocity *= -.4;
        return true;
    } else if (nextPos - object.graphics.command.w / 2 < object.leftBound) {
        object.x = object.leftBound + object.graphics.command.w / 2;
        object.velocity *= -.4;
        return true;
    }
    return false;
}

function getSign(x) {
    return x == 0 ? 0 : x < 0 ? -1 : 1;
}

function randomlyGenerateSplitter() {
    if (Math.round(createjs.Ticker.getTime()) % 8 == 0) {
        addSplitter();
    }
}

function addSplitter() {
    //create a new enemy
    var splitter = new createjs.Shape();
    splitter.velocity = 500;
    splitter.graphics.beginFill("#D70230");
    var startingXLocation = Math.floor(Math.random() * stage.width - enemyWidth/2);
    var startingYLocation = enemyHeight * -1;
    splitter.graphics.moveTo((startingXLocation + enemyWidth/2), startingYLocation + enemyHeight)  //bottom
        .lineTo(startingXLocation, startingYLocation) //top left
        .lineTo((startingXLocation + enemyWidth), startingYLocation) //top right
        .lineTo((startingXLocation + enemyWidth/2), startingYLocation + enemyHeight); //bottom
    stage.addChild(splitter);
    splitters.push(splitter);
}

function moveSplitters(event) {
    for (var i = 0; i < splitters.length; i++) {
        //if splitter is on screen
        if (splitters[i].y - enemyHeight < stage.height) {
            moveObjectVertical(splitters[i], gravity, event.delta);
        } else {
            delete splitters.shift();
        }
    }
}
