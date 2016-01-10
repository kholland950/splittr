/**
 * Created by kevinholland on 1/9/16.
 */

keys = {};
playerAccel = 1500; //.4
playerDecel = 400;

function init() {
    //Create a stage by getting a reference to the canvas
    stage = new createjs.Stage("demoCanvas");

    //create a square object
    playerSquare = new createjs.Shape();

    //TODO(quinton): Fix start location magic numbers
    playerSquare.graphics.beginFill("#1643A3").drawRect(220,585,90,90);
    playerSquare.velocity = 0;

    stage.addChild(playerSquare);
    stage.update();

    //Update stage will render next frame
    createjs.Ticker.addEventListener("tick", handleTick);
    createjs.Ticker.setFPS(120);


    this.document.onkeydown = keydown;
    this.document.onkeyup = keyup;

    function keydown(event) {
        keys[event.keyCode] = true;
    }

    function keyup(event) {
        delete keys[event.keyCode];
    }


    function movePlayerBox(box, acceleration, time) {
        box.x = (.5 * acceleration * Math.pow(time,2)) + box.velocity * time + box.x;
        box.velocity = acceleration * time + box.velocity;
        if (Math.abs(box.velocity) < 1) box.velocity = 0;
    }

    function handleTick(event) {
        var acceleration = 0;

        //calculate acceleration of player based on pressed keys
        if (keys[68]) acceleration -= playerAccel;
        if (keys[70]) acceleration += playerAccel;

        //moving right = positive velocity
        //moving left = negative velocity
        //positive velocity -> negative acceleration (due to friction)
        //negative velocity -> positive acceleration (due to friction)
        acceleration -= playerDecel * getSign(playerSquare.velocity);

        movePlayerBox(playerSquare, acceleration, event.delta/1000);
        stage.update();
    }
}

function getSign(x) {
    return x == 0 ? 0 : x < 0 ? -1 : 1;
}
