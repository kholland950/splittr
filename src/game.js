/**
 * Created by kevinholland on 1/9/16.
 */

keys = {};
playerAccel = .4;
playerDecel = .1;

function init() {
    //Create a stage by getting a reference to the canvas
    stage = new createjs.Stage("demoCanvas");
    //Create a Shape DisplayObject.
    circle = new createjs.Shape();
    circle.graphics.beginFill("red").drawCircle(210, 600, 40);
    circle.velocity = 0;

    //Set position of Shape instance.
    circle.x = circle.y = 50;
    //Add Shape instance to stage display list.
    stage.addChild(circle);
    //Update stage will render next frame
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
        if (keys[68]) circle.velocity -= playerAccel;
        if (keys[70]) circle.velocity += playerAccel;
        if (circle.velocity > 0) circle.velocity -= playerDecel;
        else if (circle.velocity < 0) circle.velocity += playerDecel;
        if (Math.abs(circle.velocity) < playerDecel) circle.velocity = 0;
        circle.x += circle.velocity;
        stage.update();
    }
}
