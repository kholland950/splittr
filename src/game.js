/**
 * Created by kevinholland on 1/9/16.
 */

var keys = {};

var playerAccel = 1500; //.4
var playerDecel = 400;

var enemyWidth = 60;
var enemyHeight = 50;
var enemyFallSpeed = .3;

var playerSquare;
var defaultPlayerSize = 90;

var stage;

function init() {
    //Create a stage by getting a reference to the canvas
    stage = new createjs.Stage("demoCanvas");
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;
    stage.width = stage.canvas.width;
    stage.height = stage.canvas.height;

    initPlayerSquare();
    splitters = [];


    //Update stage will render next frame
    createjs.Ticker.addEventListener("tick", handleTick);
    createjs.Ticker.setFPS(60);

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
    newPos = (.5 * acceleration * Math.pow(time,2)) + box.velocity * time + box.x;

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

    newPos = (.5 * acceleration * Math.pow(time,2)) + object.velocity * time + object.y;
    object.y = newPos;
    object.velocity = acceleration * time + object.velocity;

}

function handleTick(event) {
    playerSquare.acceleration = 0;

    //calculate acceleration of player based on pressed keys
    if (keys[68]) playerSquare.acceleration -= playerAccel;
    if (keys[70]) playerSquare.acceleration += playerAccel;

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

function initPlayerSquare() {
    //create a square object
    playerSquare = new createjs.Shape();

    playerSquare.graphics.beginFill("#1643A3").drawRect(
        stage.width / 2 - defaultPlayerSize / 2,
        stage.height - defaultPlayerSize - 10,
        defaultPlayerSize,
        defaultPlayerSize
    );
    playerSquare.leftBound = -1 * stage.width / 2;
    playerSquare.rightBound = stage.width / 2;
    playerSquare.velocity = 0;

    stage.addChild(playerSquare);
}


function checkCollision(object, nextPos) {
    if (object.x + object.graphics.command.w / 2 > object.rightBound) {
        object.x = object.rightBound - object.graphics.command.w / 2;
        object.velocity *= -.2;
        return true;
    } else if (object.x - object.graphics.command.w / 2 < object.leftBound) {
        object.x = object.leftBound + object.graphics.command.w / 2;
        object.velocity *= -.2;
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
    splitter.velocity = enemyFallSpeed;
    splitter.graphics.beginFill("red");
    startingXLocation = Math.floor(Math.random() * stage.width - enemyWidth/2);
    startingYLocation = enemyHeight * -1;
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


            moveObjectVertical(splitters[i], 0, event.delta);

            //splitters[i].y += enemyFallSpeed;
            //if (splitters[i].y > this.startY - 51 && this.splitters[i].y > this.startY - 49) {
                //checkPlayerSplitterCollision(this.splitters[i])
            //}
        } else {
            splitters.shift();
        }
    }
}
