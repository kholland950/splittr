/**
 * Created by kevinholland on 1/9/16.
 * Modified to support infinite recursive splitting
 */

var keys = {};

var playerAccel = 3000;
var playerDecel = 400;

var enemyWidth = 60;
var enemyHeight = 50;
var gravity = 750;

var defaultPlayerHeight = 120;
var defaultPlayerWidth = 40;
var defaultPlayerMass = 4;

var maxSplitDepth = 3; // max times a box can split (0 = initial, 3 = up to 8 boxes)

var splitters;

var FPS = 60;

var stage;

var mousedown = false;
var mouseX = 0;

var playerBoxes = [];

var points = 0;
var pointText;

// Key pairs for controlling boxes: [leftKey, rightKey]
// Each pair is {left: {code, label}, right: {code, label}}
var keyPairPool = [
    {left: {code: 68, label: "D"}, right: {code: 70, label: "F"}},
    {left: {code: 74, label: "J"}, right: {code: 75, label: "K"}},
    {left: {code: 65, label: "A"}, right: {code: 83, label: "S"}},
    {left: {code: 76, label: "L"}, right: {code: 186, label: ";"}},
    {left: {code: 81, label: "Q"}, right: {code: 87, label: "W"}},
    {left: {code: 79, label: "O"}, right: {code: 80, label: "P"}},
    {left: {code: 69, label: "E"}, right: {code: 82, label: "R"}},
    {left: {code: 85, label: "U"}, right: {code: 73, label: "I"}},
    {left: {code: 84, label: "T"}, right: {code: 89, label: "Y"}},
    {left: {code: 71, label: "G"}, right: {code: 72, label: "H"}},
    {left: {code: 90, label: "Z"}, right: {code: 88, label: "X"}},
    {left: {code: 66, label: "B"}, right: {code: 78, label: "N"}},
    {left: {code: 67, label: "C"}, right: {code: 86, label: "V"}},
    {left: {code: 77, label: "M"}, right: {code: 188, label: ","}},
    {left: {code: 49, label: "1"}, right: {code: 50, label: "2"}},
    {left: {code: 51, label: "3"}, right: {code: 52, label: "4"}},
    {left: {code: 53, label: "5"}, right: {code: 54, label: "6"}},
    {left: {code: 55, label: "7"}, right: {code: 56, label: "8"}},
    {left: {code: 57, label: "9"}, right: {code: 48, label: "0"}},
    {left: {code: 189, label: "-"}, right: {code: 187, label: "="}},
    {left: {code: 219, label: "["}, right: {code: 221, label: "]"}},
    {left: {code: 190, label: "."}, right: {code: 191, label: "/"}},
    {left: {code: 222, label: "'"}, right: {code: 220, label: "\\"}},
];
var nextKeyPairIndex = 0;

// Colors for boxes - cycle through these
var splitImmunityTime = 500; // milliseconds of immunity after being split


function getNextKeyPair() {
    if (nextKeyPairIndex < keyPairPool.length) {
        return keyPairPool[nextKeyPairIndex++];
    }
    // If we run out of predefined keys, generate numbered ones
    // These won't actually work as controls, but the chaos is the point
    var n = nextKeyPairIndex - keyPairPool.length;
    nextKeyPairIndex++;
    return {
        left: {code: -1, label: "?" + (n*2)},
        right: {code: -1, label: "?" + (n*2+1)}
    };
}

function init() {
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
    addPlayerBox(defaultPlayerMass, stage.width / 2 - defaultPlayerHeight / 2, 0, 0);

    pointText = new createjs.Text(points, "32px avenir next", "#2B345B");
    pointText.x = 20;
    pointText.y = 40;
    pointText.textBaseline = "alphabetic";
    stage.addChild(pointText);

    createjs.Touch.enable(stage);

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

function handleTick(event) {
    if (keys[32]) return; // pause

    if (playerBoxes.length > 0) {
        // Reset all accelerations and apply key inputs
        for (var i = 0; i < playerBoxes.length; i++) {
            var box = playerBoxes[i];
            box.acceleration = 0;

            // Check this box's assigned keys
            if (box.keyPair) {
                if (keys[box.keyPair.left.code]) box.acceleration -= playerAccel;
                if (keys[box.keyPair.right.code]) box.acceleration += playerAccel;
            }

            // Apply friction and move
            box.acceleration -= playerDecel * getSign(box.velocity);
            movePlayerBox(box, box.acceleration, event.delta/1000);
        }

        // Resolve box-to-box collisions
        resolveBoxCollisions();

        // Update labels after all positions are final
        for (var i = 0; i < playerBoxes.length; i++) {
            updateBoxLabel(playerBoxes[i]);
        }

        points += 1;
        pointText.text = points;
    }

    moveSplitters(event);
    randomlyGenerateSplitter();

    stage.update();
}

function updateBoxLabel(box) {
    if (box.label) {
        // Position label centered on the box
        var boxX = box.x + box.graphics.command.x;
        var boxY = box.graphics.command.y;
        var boxW = box.graphics.command.w;
        var boxH = box.graphics.command.h;

        box.label.x = boxX + boxW / 2;
        box.label.y = boxY + boxH / 2 - 6;
    }
}

function movePlayerBox(box, acceleration, time) {
    var newPos = (.5 * acceleration * Math.pow(time,2)) + box.velocity * time + box.x;

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

function addPlayerBox(mass, xPos, velocity, depth, inheritedKeyPair) {
    velocity = velocity || 0;
    depth = depth || 0;

    var playerSquare = new createjs.Shape();
    var width = defaultPlayerWidth * mass;
    playerSquare.graphics.beginFill("#115B89").drawRect(
        xPos,
        stage.height - defaultPlayerHeight - 10,
        width,
        defaultPlayerHeight
    );
    playerSquare.leftBound = (xPos * -1) - width/2;
    playerSquare.rightBound = (stage.width - xPos) - width/2;
    playerSquare.velocity = velocity;
    playerSquare.mass = mass;
    playerSquare.splitDepth = depth;

    // Inherit parent's keys or assign new ones
    var keyPair = inheritedKeyPair || getNextKeyPair();
    playerSquare.keyPair = keyPair;

    // Create label showing the keys
    var labelText = "\u2190" + keyPair.left.label + "  " + keyPair.right.label + "\u2192";
    var fontSize = Math.max(12, Math.min(28, width / 2.5));
    var label = new createjs.Text(labelText, "bold " + fontSize + "px monospace", "#FFFFFF");
    label.textAlign = "center";
    label.textBaseline = "middle";
    label.mouseEnabled = false;
    playerSquare.label = label;

    // Immunity timer - box flashes while immune
    playerSquare.immuneUntil = createjs.Ticker.getTime() + splitImmunityTime;

    playerBoxes.push(playerSquare);
    stage.addChild(playerSquare);
    stage.addChild(label);

    // Initial label position
    updateBoxLabel(playerSquare);

    return playerSquare;
}

// Get the world-space bounding box of a player box
function getBoxBounds(box) {
    var left = box.x + box.graphics.command.x;
    var top = box.graphics.command.y;
    var w = box.graphics.command.w;
    var h = box.graphics.command.h;
    return {left: left, right: left + w, top: top, bottom: top + h, width: w, height: h};
}

// Get the world-space bounding box of a splitter triangle
function getSplitterBounds(splitter) {
    return {
        left: splitter.x - enemyWidth / 2,
        right: splitter.x + enemyWidth / 2,
        top: splitter.y - enemyHeight,
        bottom: splitter.y
    };
}

function resolveBoxCollisions() {
    for (var i = 0; i < playerBoxes.length; i++) {
        for (var j = i + 1; j < playerBoxes.length; j++) {
            var a = getBoxBounds(playerBoxes[i]);
            var b = getBoxBounds(playerBoxes[j]);

            // Check AABB overlap
            if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
                var overlapLeft = a.right - b.left;
                var overlapRight = b.right - a.left;
                var overlap = Math.min(overlapLeft, overlapRight);
                var pushEach = overlap / 2 + 1;

                var aCenterX = (a.left + a.right) / 2;
                var bCenterX = (b.left + b.right) / 2;

                if (aCenterX < bCenterX) {
                    // a is left, b is right — push apart
                    playerBoxes[i].x -= pushEach;
                    playerBoxes[j].x += pushEach;
                } else {
                    playerBoxes[i].x += pushEach;
                    playerBoxes[j].x -= pushEach;
                }

                // Exchange some velocity (elastic-ish collision)
                var tempVel = playerBoxes[i].velocity;
                playerBoxes[i].velocity = playerBoxes[j].velocity * 0.8;
                playerBoxes[j].velocity = tempVel * 0.8;
            }
        }
    }
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
    if (Math.round(createjs.Ticker.getTime()) % 8 == 0) {
        addSplitter();
    }
}

var lastSplitterX = 0;
function addSplitter() {
    var splitter = new createjs.Shape();
    splitter.velocity = 500;
    splitter.graphics.beginFill("#D70230");

    var widthInSplitters = stage.width / enemyWidth;
    var startingXLocation = Math.floor(Math.random() * widthInSplitters - 1) * enemyWidth + enemyWidth/2;
    splitter.startingXLocation = startingXLocation;
    lastSplitterX = startingXLocation;
    var startingYLocation = enemyHeight * -1;
    splitter.x = startingXLocation;
    splitter.y = startingYLocation;
    splitter.graphics.moveTo(0,0)
        .lineTo(enemyWidth/2, enemyHeight * -1)
        .lineTo(enemyWidth/2*-1, enemyHeight * -1)
        .lineTo(0,0);
    stage.addChild(splitter);
    splitters.push(splitter);
}

function moveSplitters(event) {
    for (var i = 0; i < splitters.length; i++) {
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

function splitterHitPlayerBox(splitter) {
    var now = createjs.Ticker.getTime();
    var sBounds = getSplitterBounds(splitter);
    var pushForce = 600;

    for (var i = 0; i < playerBoxes.length; i++) {
        var box = playerBoxes[i];

        // Handle immunity flashing
        if (box.immuneUntil && now < box.immuneUntil) {
            box.alpha = (Math.floor(now / 60) % 2 === 0) ? 0.3 : 1.0;
            continue;
        }
        box.alpha = 1.0;

        var bBounds = getBoxBounds(box);

        // Check AABB overlap between triangle bounding box and player box
        if (sBounds.left < bBounds.right && sBounds.right > bBounds.left &&
            sBounds.top < bBounds.bottom && sBounds.bottom > bBounds.top) {

            // Check if the tip (bottom center of triangle) is inside the box
            var tipX = splitter.x;
            var tipY = splitter.y;
            if (tipX >= bBounds.left && tipX <= bBounds.right &&
                tipY >= bBounds.top && tipY <= bBounds.bottom) {
                // Direct hit — split
                return i;
            }

            // Edge contact — push the box sideways
            var splitterCenterX = splitter.x;
            var boxCenterX = (bBounds.left + bBounds.right) / 2;
            if (splitterCenterX < boxCenterX) {
                box.velocity += pushForce * (1/FPS);
            } else {
                box.velocity -= pushForce * (1/FPS);
            }
        }
    }
    return -1;
}

function splitPlayerBox(index) {
    var oldBox = playerBoxes[index];
    stage.removeChild(oldBox);
    // Remove the label too
    if (oldBox.label) {
        stage.removeChild(oldBox.label);
    }

    if (oldBox.splitDepth < maxSplitDepth) {
        var pt = oldBox.localToGlobal(stage.width/2, 0);
        var newMass = oldBox.mass / 2;
        var splitOffset = Math.max(enemyWidth / 3, defaultPlayerWidth * newMass);

        // Left child inherits parent's keys, right child gets new keys
        addPlayerBox(newMass, pt.x - splitOffset, -300, oldBox.splitDepth + 1, oldBox.keyPair);
        addPlayerBox(newMass, pt.x + splitOffset, 300, oldBox.splitDepth + 1);
    }
    // Remove old box from array
    playerBoxes.splice(index, 1);
}
