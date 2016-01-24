/**
 * Created by kevinholland on 1/9/16.
 */

var keys = {};

var playerAccel = 3000; //.4
var playerDecel = 400;

var enemyWidth = 60;
var enemyHeight = 50;
var gravity = 750;

var defaultPlayerHeight = 80;
var defaultPlayerWidth = 20;
var defaultPlayerMass = 4;

var splitters;

var FPS = 60;

var stage;

var mousedown = false;
var mouseX = 0;

var playerBoxes = [];

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
    addPlayerBox(defaultPlayerMass, stage.width / 2 - defaultPlayerHeight / 2);

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

    if (willBeInBounds(box, newPos)) {
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
    //pause for debugging (!!! not a toggle !!!)
    if (keys[32]) return;

    playerBoxes[0].acceleration = 0;
    if (playerBoxes.length > 1) playerBoxes[1].acceleration = 0;

    //calculate acceleration of player based on pressed keys
    if (keys[68] || (mousedown && mouseX < stage.width / 2)) playerBoxes[0].acceleration -= playerAccel;
    if (keys[70] || (mousedown && mouseX > stage.width / 2)) playerBoxes[0].acceleration += playerAccel;
    if (keys[74] && playerBoxes.length > 1) playerBoxes[1].acceleration -= playerAccel;
    if (keys[75] && playerBoxes.length > 1) playerBoxes[1].acceleration += playerAccel;

    //moving right = positive velocity
    //moving left = negative velocity
    //positive velocity -> negative acceleration (due to friction)
    //negative velocity -> positive acceleration (due to friction)
    for (var i = 0; i < playerBoxes.length; i++) {
        playerBoxes[i].acceleration -= playerDecel * getSign(playerBoxes[i].velocity);
        movePlayerBox(playerBoxes[i], playerBoxes[i].acceleration, event.delta/1000);
    }
    moveSplitters(event);
    randomlyGenerateSplitter();

    stage.update();
}

function addPlayerBox(mass, xPos, velocity) {
    velocity = velocity || 0; //set velocity to 0 if not passed

    //create a square object
    var playerSquare = new createjs.Shape();

    var width = defaultPlayerWidth * mass;
    playerSquare.graphics.beginFill("#115B89").drawRect(
        xPos,
        stage.height - defaultPlayerHeight - 10,
        defaultPlayerWidth * mass,
        defaultPlayerHeight
    );
    playerSquare.leftBound = (xPos * -1) - width/2;
    playerSquare.rightBound = (stage.width - xPos) - width/2;
    playerSquare.velocity = velocity;
    playerSquare.mass = mass;

    playerBoxes.push(playerSquare);
    stage.addChild(playerSquare);
}

function willBeInBounds(object, nextPos) {
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
    if (Math.round(createjs.Ticker.getTime()) % 13 == 0) {
        addSplitter();
    }
}

var lastSplitterX = 0;
function addSplitter() {
    //create a new enemy
    var splitter = new createjs.Shape();
    splitter.velocity = 500;
    splitter.graphics.beginFill("#D70230");

    //calculates how wide the stage is in splitter width terms (18 splitters wide)
    //this is so that splitters can only spawn at certain x coords
    //i.e. | | | | |V| | | |    --- like lanes, that splitters can spawn in
    //this fixes an issue where splitters would spawn overlapping each other
    var widthInSplitters = stage.width / enemyWidth;
    var startingXLocation = Math.floor(Math.random() * widthInSplitters - 1) * enemyWidth + enemyWidth/2;
    splitter.startingXLocation = startingXLocation;
    lastSplitterX = startingXLocation;
    var startingYLocation = enemyHeight * -1;
    //draw splitter triangle
    //should this be moved into a function? (is there really no draw triangle function!?)
    splitter.x = startingXLocation;
    splitter.y = startingYLocation;
    splitter.graphics.moveTo(0,0)
        .lineTo(enemyWidth/2, enemyHeight * -1)
        .lineTo(enemyWidth/2*-1, enemyHeight * -1)
        .lineTo(0,0);//(enemyWidth/2), enemyHeight)  //bottom
        //.lineTo(0, 0) //top left
        //.lineTo(enemyWidth, 0) //top right
        //.lineTo(enemyWidth/2 + enemyHeight); //bottom
    stage.addChild(splitter);
    splitters.push(splitter);
}

function moveSplitters(event) {
    for (var i = 0; i < splitters.length; i++) {
        //if splitter is on screen
        if (splitters[i].y - enemyHeight < stage.height) {
            moveObjectVertical(splitters[i], gravity, event.delta);
            var hitIndex = splitterHitPlayerBox(splitters[i]);
            if (hitIndex > -1) {
                splitPlayerBox(hitIndex);
            }
        } else {
            delete splitters.shift();
        }
    }
}

//returns index in playerBoxes of box hit, or -1 if no boxes hit
function splitterHitPlayerBox(splitter) {
    for (var i = 0; i < playerBoxes.length; i++) {
        var pt = splitter.localToLocal(0, 0, playerBoxes[i]);
        if (playerBoxes[i].hitTest(pt.x, pt.y)) {
            return i;
        }
    }
    return -1;
}

function splitPlayerBox(index) {
    stage.removeChild(playerBoxes[index]);
    //change alpha for debugging, split doesn't happen yet

    if (playerBoxes.length == 2) { //delete box
        playerBoxes.splice(index, 1);
    } else if (playerBoxes[index].mass > 2) { //split box
        var pt = playerBoxes[index].localToGlobal(stage.width/2, 0);
        addPlayerBox(playerBoxes[index].mass / 2, pt.x - enemyWidth/2, -300);
        addPlayerBox(playerBoxes[index].mass / 2, pt.x + enemyWidth/2, 300);
        playerBoxes.shift();
    }
}
