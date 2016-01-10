/**
 * Created by kevinholland on 1/9/16.
 */

keys = {};
playerAccel = .4;
playerDecel = .1;

function init() {
    //Create a stage by getting a reference to the canvas
    stage = new createjs.Stage("demoCanvas");

    //create a square object
    playerSquare = new createjs.Shape();
    playerSquare.graphics.beginFill("#1643A3").drawRect(220,585,90,90);
    playerSquare.velocity = 0;
    stage.addChild(playerSquare);
    stage.update();

    //Update stage will render next frame
    createjs.Ticker.addEventListener("tick", handleTick);
    createjs.Ticker.setFPS(60);

    this.document.onkeydown = keydown;
    this.document.onkeyup = keyup;

    function keydown(event) {
        keys[event.keyCode] = true;
    }

    function keyup(event) {
        delete keys[event.keyCode];
    }

    function handleTick() {
        if (keys[68]) playerSquare.velocity -= playerAccel;
        if (keys[70]) playerSquare.velocity += playerAccel;
        if (playerSquare.velocity > 0) playerSquare.velocity -= playerDecel;
        else if (playerSquare.velocity < 0) playerSquare.velocity += playerDecel;
        if (Math.abs(playerSquare.velocity) < playerDecel) playerSquare.velocity = 0;
        playerSquare.x += playerSquare.velocity;
        stage.update();
    }
}
