// src/personality.js — Kawaii speech bubbles, personality system, and anime text effects
import { getCurrentSkin } from './skins.js';

// Personality types with different behavior weights
const PERSONALITIES = ['brave', 'scared', 'sleepy', 'hyper'];

const SPEECH = {
  gameStart: [
    "Let's go!", "Ganbare!", "ᕦ(ò_óˇ)ᕤ", "FIGHT-O!", "yosh~!",
    "here we go~!", "✧ ready! ✧", "let's do this!", "IKUZO!",
    "adventure time~!", "born ready!", "show time~!",
    "( •̀ᴗ•́ )و", "LET'S SPLIT!", "I believe!", "gambarimasuuu!",
    "my time to shine~", "watch me!", "full power!",
    "HAJIME!", "bring it on~!", "uwu let's go",
  ],
  idle: [
    "...", "zzZ", "(._. )", "hm?", "anyone there?",
    "( -_-)", "bored~", "*yawn*", "hello?", "move me!",
    "tap tap...", "*whistles*", "la la la~", "so quiet...",
    "(。-ω-)", "waiting...", "*poke poke*", "hmmmm~",
    "is it nap time?", "*twiddles thumbs*", "echo~!",
    "I'll just wait here", "where'd everyone go?",
    "( ´_ゝ`)", "*daze*", "the dust is settling...",
  ],
  movingFast: [
    "NYOOM!", "weeeee~", "ᕕ( ᐛ )ᕗ", "ZOOM!", "wheee~!",
    "so fast!", "SPEEED!", "zoooom~", "VROOOOM!",
    "I'm FLYING!", "can't catch me!", "TURBO MODE!",
    "wind in my face~!", "GOTTA GO FAST!", "warp speed!",
    "( ͡° ͜ʖ ͡°)~♪", "YEEEHAW!", "sonic boom!",
    "MAX VELOCITY!", "I am speed.", "rolling rolling~",
    "beep beep!", "WHOOOOSH!", "like the wind!",
  ],
  gettingSplit: [
    "ITAI!", "awawawa!", "NOOOO~", "( >﹏< )", "kyaa!",
    "not again!", "OW!", "ugh~!", "YAMETE!", "it hurts!",
    "I'm splitting!", "AAAA!", "why me?!", "ouch ouch!",
    "MY BODY!", "nooooo!", "coming apart!", "HELP!",
    "I'm too young!", "not like this!", "(;´Д`)", "waaaa!",
    "I've been hit!", "ouchies!", "my poor self!",
    "(*_*)", "divided we fall!", "I'm seeing double!",
  ],
  highDepth: [
    "help me...", "too many...", "(╥_╥)", "I can't...",
    "so small...", "cramped...", "someone...", "why...",
    "I'm tiny...", "can barely see...", "so fragile...",
    "one more hit...", "please no more", "I'm fading...",
    "is this the end?", "hold together...", "stay strong...",
    "everything hurts", "too thin...", "(ᗒᗣᗕ)՞",
    "I miss being big", "help me...", "we're doomed...",
    "hanging by a thread", "paper thin...", "so vulnerable",
  ],
  dodge: [
    "phew~", "SAFE!", "(*≧▽≦)", "close one!", "hah!",
    "nice~!", "too easy~", "dodged!", "NOT TODAY!",
    "missed me!", "can't touch this~", "nailed it!",
    "pro gamer move!", "like a ninja!", "ez dodge~",
    "matrix mode!", "slippery~!", "UNTOUCHABLE!",
    "dance dance~!", "try harder!", "( ˘ω˘ )♪",
    "swerved~!", "outplayed!", "you'll never catch me!",
    "calculated.", "smooth~!", "like butter!",
  ],
  heartPickup: [
    "yay~!", "♡♡♡", "together again~", "friend~!", "heal!",
    "thank you~", "love~!", "♡ yes ♡", "I'm whole again!",
    "HEALING!", "feels good~!", "power of love!",
    "reunited~!", "heart get!", "my heart~!", "COMBO HEAL!",
    "we're ONE again!", "♡ LOVE WINS ♡", "so warm~!",
    "nakama~!", "I feel ALIVE!", "heart power!",
    "besties forever~!", "the power of friendship!",
  ],
  siblingDestroyed: [
    "NOOO!", "brother!!", "(T_T)", "come back...",
    "noooo~!", "why...", "friend...", "I'll avenge you!",
    "NANI?!", "don't go!", "BROTHER NO!", "rest in peace...",
    "I'll survive for you!", "I'll remember you!",
    "they took you...", "gone too soon", "farewell...",
    "I won't forget!", "(╥﹏╥)", "stay strong for them!",
    "carry on their spirit!", "REVENGE!", "never forgive!",
  ],
  nearDeath: [
    "I'm scared...", "don't leave me", "all alone...",
    "help...", "last one...", "(;_;)", "is anyone there?",
    "I'm the only one left...", "I can do this...",
    "for my fallen friends!", "just me now...",
    "solo mission...", "one box army!", "survive...",
    "lonely...", "the last stand!", "I WILL NOT FALL!",
    "hold the line!", "they're counting on me...",
    "I carry their hopes!", "final form!", "ultra instinct!",
  ],
  celebration: [
    "PARTY!", "WE DID IT!", "✧ SUGOI! ✧", "YATTA!",
    "amazing~!", "keep going!", "YEAH!", "SASUGA!",
    "INCREDIBLE!", "UNSTOPPABLE!", "CHAMPIONS!", "WOOO!",
    "dance party~!", "let's CELEBRATE!", "we're LEGENDS!",
    "the power of teamwork!", "VICTORY LAP!", "ENCORE!",
    "30 SECONDS BABY!", "no one can stop us!",
    "THIS IS OUR MOMENT!", "banzai~!", "KANPAI!",
  ],
};

// Personality-specific overrides
const PERSONALITY_SPEECH = {
  brave: {
    gameStart: ["I was BORN for this!", "LET'S FIGHT!", "no fear!", "hero time!", "CHARGE!",
      "I'll protect everyone!", "courage mode ON!", "bring the pain!"],
    gettingSplit: ["Bring it on!", "Is that all?!", "HA!", "MORE!", "I'm fine!",
      "just a scratch!", "pain is temporary!", "I LIKE the pain!", "HARDER!",
      "that tickled!", "you call that a hit?", "I've had worse!"],
    highDepth: ["I can do this!", "no problem!", "easy!", "we got this~",
      "small but MIGHTY!", "size doesn't matter!", "never surrender!",
      "I'm still standing!", "can't keep me down!", "PLUS ULTRA!"],
    nearDeath: ["I WON'T GIVE UP!", "NEVER!", "FIGHT!", "not yet!",
      "THIS IS WHERE I SHINE!", "my final stand!", "I REFUSE TO DIE!",
      "for my friends!", "BELIEVE IT!", "one box is all I need!"],
    idle: ["let's GO!", "c'mon!", "bring 'em!", "waiting~!",
      "I need ACTION!", "where's the fight?!", "too peaceful!",
      "my sword arm itches!", "LET ME AT 'EM!"],
    dodge: ["HA! TOO EASY!", "pathetic!", "try HARDER!", "COME AT ME!",
      "I could do this all day!", "not even close!", "amateur hour!"],
    siblingDestroyed: ["I'LL AVENGE YOU!", "YOUR SACRIFICE WON'T BE IN VAIN!",
      "RAAAGE!", "they'll PAY for this!", "fight HARDER for them!"],
  },
  scared: {
    gameStart: ["eep!", "oh no...", "I'm nervous", "d-do we have to?",
      "I have a bad feeling...", "m-maybe we should wait?", "is it safe?",
      "I'm not ready!", "hold me...", "I want my mommy!"],
    gettingSplit: ["AAAAA!", "eep!!", "SCARY!", "nononono!", "eep eep!",
      "I KNEW this would happen!", "MOMMY!", "I can't TAKE it!",
      "THE HORROR!", "make it stop!", "I'm gonna cry!",
      "why is this happening?!", "SAVE MEEEE!"],
    highDepth: ["I wanna go home", "eep...", "too scary!", "mama...",
      "I should've stayed in bed", "this is a nightmare!",
      "please no more splits...", "I'm so tiny and afraid...",
      "every sound scares me...", "is that another triangle?!"],
    dodge: ["EEP that was close!", "oh my...", "phew... eep",
      "my heart stopped!", "I almost DIED!", "too close TOO CLOSE!",
      "I need a moment...", "*hyperventilating*", "barely survived!"],
    idle: ["...is it safe?", "eep?", "*trembling*", "s-so quiet...",
      "quiet is good... right?", "*nervous peek*", "please stay calm...",
      "*hiding*", "maybe they won't notice me..."],
    movingFast: ["TOO FAST!", "I'm gonna be sick!", "SLOW DOWN!",
      "I don't like this!", "eep eep EEEP!", "AAAA THE SPEED!"],
    nearDeath: ["I DON'T WANNA DIE!", "PLEASE HELP!", "this is the end!",
      "I can't do this alone!", "I'm shaking so much!", "goodbye world..."],
    celebration: ["we...we survived?!", "I can't believe it!", "oh thank goodness!",
      "I was SO scared!", "*relieved crying*", "we made it??"],
  },
  sleepy: {
    idle: ["zzz...", "so sleepy~", "*snore*", "5 more min...", "zzzZZZ",
      "*drool*", "naptime...", "counting sheep...", "pillow plz...",
      "*mumbling*", "just resting my eyes~", "do not disturb...",
      "sleep is life...", "*snooze*", "what time is it?"],
    gameStart: ["*yawn* ok...", "sleepy...", "mmm...", "do I have to?",
      "can we play later?", "alarm didn't go off...", "*stretches*",
      "who woke me up?!", "just 5 more minutes...", "ugh morning already?"],
    movingFast: ["too fast...", "dizzy~", "slow down...", "mmm...",
      "motion sickness...", "*drowsy swerving*", "can't keep eyes open...",
      "zzzZOOM?", "sleepwalking at mach speed"],
    dodge: ["...huh?", "oh.", "barely awake~", "*yawn* safe",
      "did something happen?", "that was close... I think?",
      "*yawn* what?", "oh a triangle, cool", "zzz--WHAT? oh ok"],
    gettingSplit: ["ow... *yawn*", "rude awakening...", "I was sleeping...",
      "not the nap zone...", "*sleepy ow*", "that's one way to wake up"],
    highDepth: ["too tired for this...", "let me sleep...", "wake me when it's over",
      "this is exhausting...", "energy at 0%...", "*dozing off*"],
    celebration: ["yay... *yawn*...", "cool... nap time?", "we won? nice... zzz",
      "*sleepy clap*", "party... *snore*... yay"],
  },
  hyper: {
    gameStart: ["LET'S GOOOO!", "YEAHHH!", "SO EXCITED!!", "WOOOO!",
      "MAXIMUM HYPE!!!", "I CAN'T CONTAIN MYSELF!", "AAAAA SO PUMPED!",
      "THIS IS GONNA BE EPIC!", "HYPE HYPE HYPE!", "LEEEEEROY!"],
    movingFast: ["FASTERFASTER!", "NYOOOOM!!", "MAXIMUM SPEED!!", "GO GO GO!",
      "WARP FACTOR 9!", "LIGHTSPEED!", "I'M ON FIRE!", "TURBO BOOST!",
      "OVERDRIVE!!", "CAN'T STOP WON'T STOP!", "BEYOND LIMITS!"],
    idle: ["GO GO GO!", "CAN'T STOP!", "MORE ACTION!", "MOOOOVE!",
      "I'M VIBRATING!", "SO MUCH ENERGY!", "NEED SPEED!",
      "WHY ARE WE STANDING?!", "BORED BORED BORED!", "AAAA DO SOMETHING!",
      "I CAN'T SIT STILL!", "*bouncing*", "ENERGY OVERLOAD!"],
    gettingSplit: ["WOAH!!", "EPIC!", "AWESOME!", "SO COOL!", "AGAIN AGAIN!",
      "THAT WAS AMAZING!", "MORE SPLITTING!", "YEAAAH BABY!",
      "I LOVE THIS GAME!", "BEST SPLIT EVER!", "SPLIT ME MORE!"],
    dodge: ["EASY!!", "HA! TOO SLOW!", "BRING MORE!!", "YESSS!",
      "I'M UNTOUCHABLE!", "EAT MY DUST!", "PARKOUR!", "RADICAL!",
      "EXTREME DODGE!", "SICK MOVES!", "POGGERS!", "INSANE REFLEXES!"],
    celebration: ["WOOOOO!!!", "BEST DAY EVER!!", "UNSTOPPABLE!!!", "LEGENDARY!!!",
      "WE'RE GODS!!!", "NOTHING CAN STOP US!", "INFINITE POWER!",
      "THIS IS PEAK GAMING!", "S-RANK ACHIEVED!", "FLAWLESS!!!"],
    heartPickup: ["HEAAALING!", "POWER UP!!", "SUPER HEART!", "YESYESYES!",
      "MAXIMUM FRIENDSHIP!", "LOVE IS POWER!", "♡♡♡!!!"],
    nearDeath: ["THIS IS THE FINAL BOSS!", "ULTRA INSTINCT!", "I GO EVEN FURTHER BEYOND!",
      "LIMIT BREAK!", "SECOND WIND!", "NOT TODAY!", "I'M GOING SUPER SAIYAN!"],
    siblingDestroyed: ["NOOO MY BRO!", "I'LL WIN FOR YOU!", "THIS MEANS WAR!",
      "YOUR ENERGY LIVES IN ME!", "I'M GOING ALL OUT NOW!"],
  },
};

// Floating anime text effects
const ANIME_TEXTS = [
  { text: '✧', color: '#ffeb3b', size: 24 },
  { text: '♪', color: '#ff69b4', size: 26 },
  { text: '~', color: '#81d4fa', size: 22 },
  { text: '☆', color: '#ffd700', size: 24 },
  { text: '♡', color: '#ff69b4', size: 24 },
  { text: '✦', color: '#b388ff', size: 22 },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Speech bubble that appears above a box
class SpeechBubble {
  constructor(text, mood = 'neutral') {
    this.text = text;
    this.mood = mood;
    this.life = 1.5 + Math.random() * 0.5;
    this.maxLife = this.life;
    this.fadeIn = 0;
    this.offsetY = 0;
  }

  update(dt) {
    this.fadeIn = Math.min(1, this.fadeIn + dt * 6);
    this.offsetY -= dt * 8; // slowly float up
    this.life -= dt;
  }

  get alpha() {
    if (this.life < 0.3) return Math.max(0, this.life / 0.3) * this.fadeIn;
    return this.fadeIn;
  }

  get dead() { return this.life <= 0; }

  getMoodColor() {
    switch (this.mood) {
      case 'happy': return 'rgba(255, 182, 193, 0.92)';   // pink
      case 'sad': return 'rgba(135, 206, 250, 0.92)';      // light blue
      case 'excited': return 'rgba(255, 255, 150, 0.92)';  // yellow
      case 'scared': return 'rgba(200, 180, 255, 0.92)';   // lavender
      default: return 'rgba(255, 255, 255, 0.88)';
    }
  }

  render(ctx, x, y) {
    if (this.alpha <= 0) return;

    const bx = x;
    const by = y - 30 + this.offsetY;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Measure text
    ctx.font = 'bold 18px monospace';
    const metrics = ctx.measureText(this.text);
    const tw = metrics.width;
    const pad = 12;
    const bw = tw + pad * 2;
    const bh = 32;
    const br = 10;

    // Bubble background
    ctx.fillStyle = this.getMoodColor();
    ctx.beginPath();
    const left = bx - bw / 2;
    const top = by - bh;
    ctx.moveTo(left + br, top);
    ctx.lineTo(left + bw - br, top);
    ctx.quadraticCurveTo(left + bw, top, left + bw, top + br);
    ctx.lineTo(left + bw, top + bh - br);
    ctx.quadraticCurveTo(left + bw, top + bh, left + bw - br, top + bh);
    // Triangle pointer
    ctx.lineTo(bx + 7, top + bh);
    ctx.lineTo(bx, top + bh + 9);
    ctx.lineTo(bx - 7, top + bh);
    ctx.lineTo(left + br, top + bh);
    ctx.quadraticCurveTo(left, top + bh, left, top + bh - br);
    ctx.lineTo(left, top + br);
    ctx.quadraticCurveTo(left, top, left + br, top);
    ctx.closePath();
    ctx.fill();

    // Bubble border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, bx, top + bh / 2);

    ctx.restore();
  }
}

// Floating anime effect text
class AnimeText {
  constructor(text, x, y, color, size) {
    this.text = text;
    this.x = x + (Math.random() - 0.5) * 30;
    this.y = y;
    this.color = color;
    this.size = size;
    this.life = 1.2 + Math.random() * 0.6;
    this.maxLife = this.life;
    this.vx = (Math.random() - 0.5) * 50;
    this.vy = -60 - Math.random() * 40;
    this.rotation = (Math.random() - 0.5) * 0.4;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy *= 0.98;
    this.life -= dt;
  }

  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get dead() { return this.life <= 0; }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.font = `bold ${this.size}px monospace`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}

// Heart particle floating between nearby boxes
class HeartParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 30;
    this.vy = -35 - Math.random() * 25;
    this.life = 1.0 + Math.random() * 0.5;
    this.maxLife = this.life;
    this.size = 14 + Math.random() * 10;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get dead() { return this.life <= 0; }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.8;
    ctx.fillStyle = '#ff69b4';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 8;
    ctx.font = `${this.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♡', this.x, this.y);
    ctx.restore();
  }
}

// Sparkle around happy boxes
class Sparkle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 25;
    this.x = x + Math.cos(angle) * dist;
    this.y = y + Math.sin(angle) * dist;
    this.life = 0.4 + Math.random() * 0.5;
    this.maxLife = this.life;
    this.size = 5 + Math.random() * 6;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.y -= dt * 15;
    this.life -= dt;
  }

  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get dead() { return this.life <= 0; }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.9;
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    // 4-point star
    const s = this.size;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - s);
    ctx.lineTo(this.x + s * 0.3, this.y - s * 0.3);
    ctx.lineTo(this.x + s, this.y);
    ctx.lineTo(this.x + s * 0.3, this.y + s * 0.3);
    ctx.lineTo(this.x, this.y + s);
    ctx.lineTo(this.x - s * 0.3, this.y + s * 0.3);
    ctx.lineTo(this.x - s, this.y);
    ctx.lineTo(this.x - s * 0.3, this.y - s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export class PersonalitySystem {
  constructor() {
    this._bubbles = new Map();   // box -> SpeechBubble
    this._animeTexts = [];
    this._heartParticles = [];
    this._sparkles = [];
    this._personalities = new Map(); // box -> personality string
    this._blinkTimers = new Map();   // box -> { nextBlink, blinking, blinkEnd }
    this._lastMoveTimes = new Map(); // box -> timestamp of last movement
    this._idleTimers = new Map();    // box -> last idle speech time
    this._catMouths = new Map();     // box -> boolean (has cat mouth)
    this._celebrationUntil = 0;
    this._lastCelebrationCheck = 0;
    this._encourageTime = 0;        // track when to say ganbatte
    this._gameStartTime = 0;
  }

  // Assign personality when a box is created
  assignPersonality(box) {
    if (!this._personalities.has(box)) {
      this._personalities.set(box, pick(PERSONALITIES));
      this._blinkTimers.set(box, {
        nextBlink: performance.now() + 2000 + Math.random() * 4000,
        blinking: false,
        blinkEnd: 0,
      });
      this._lastMoveTimes.set(box, performance.now());
      this._idleTimers.set(box, 0);
      this._catMouths.set(box, Math.random() < 0.2); // 20% chance of cat mouth
    }
  }

  getPersonality(box) {
    return this._personalities.get(box) || 'brave';
  }

  hasCatMouth(box) {
    return this._catMouths.get(box) || false;
  }

  // Get blink state for a box
  getBlinkState(box, now) {
    const blink = this._blinkTimers.get(box);
    if (!blink) return false;

    if (blink.blinking) {
      if (now > blink.blinkEnd) {
        blink.blinking = false;
        blink.nextBlink = now + 2000 + Math.random() * 5000;
      }
      return true;
    }

    if (now > blink.nextBlink) {
      blink.blinking = true;
      blink.blinkEnd = now + 100 + Math.random() * 80;
      return true;
    }

    return false;
  }

  isCelebrating(now) {
    return now < this._celebrationUntil;
  }

  // Clean up references to destroyed boxes
  cleanupBox(box) {
    this._bubbles.delete(box);
    this._personalities.delete(box);
    this._blinkTimers.delete(box);
    this._lastMoveTimes.delete(box);
    this._idleTimers.delete(box);
    this._catMouths.delete(box);
  }

  // Speech triggers
  say(box, category, mood = 'neutral') {
    if (this._bubbles.has(box) && !this._bubbles.get(box).dead) return; // one at a time
    const personality = this.getPersonality(box);
    const overrides = PERSONALITY_SPEECH[personality];
    const pool = (overrides && overrides[category]) || SPEECH[category];
    if (!pool || pool.length === 0) return;
    this._bubbles.set(box, new SpeechBubble(pick(pool), mood));
  }

  onGameStart(boxes) {
    this._gameStartTime = performance.now();
    this._encourageTime = this._gameStartTime;
    for (const box of boxes) {
      this.assignPersonality(box);
      this.say(box, 'gameStart', 'excited');
    }
  }

  onSplit(parent, children) {
    for (const child of children) {
      this.assignPersonality(child);
      // Inherit cat mouth from parent sometimes
      if (this._catMouths.get(parent)) {
        this._catMouths.set(child, Math.random() < 0.5);
      }
      this.say(child, 'gettingSplit', 'scared');
    }
    // Emit anime text at split position
    this._animeTexts.push(new AnimeText(
      'awuwu~', parent.x + parent.width / 2, parent.y, '#ff69b4', 28
    ));
    this.cleanupBox(parent);
  }

  onDestroy(box) {
    this._animeTexts.push(new AnimeText(
      'kyaa!', box.x + box.width / 2, box.y, '#ff4444', 30
    ));
    this.cleanupBox(box);
  }

  onSiblingDestroyed(boxes, destroyedBox) {
    for (const box of boxes) {
      if (box === destroyedBox) continue;
      if (Math.random() < 0.5) {
        this.say(box, 'siblingDestroyed', 'sad');
      }
    }
  }

  onHeartPickup(box) {
    this.say(box, 'heartPickup', 'happy');
    this._animeTexts.push(new AnimeText(
      '♡', box.x + box.width / 2, box.y, '#ff69b4', 32
    ));
  }

  onDodge(box) {
    if (Math.random() < 0.35) {
      this.say(box, 'dodge', 'excited');
    }
  }

  onCombo(box, count) {
    this._animeTexts.push(new AnimeText(
      'sugoi!', box.x + box.width / 2, box.y - 10, '#ffd700', 30
    ));
  }

  triggerCelebration(now) {
    this._celebrationUntil = now + 2000;
  }

  update(dt, now, boxes) {
    // Update speech bubbles
    for (const [box, bubble] of this._bubbles) {
      bubble.update(dt);
      if (bubble.dead) this._bubbles.delete(box);
    }

    // Update anime texts
    for (let i = this._animeTexts.length - 1; i >= 0; i--) {
      this._animeTexts[i].update(dt);
      if (this._animeTexts[i].dead) this._animeTexts.splice(i, 1);
    }

    // Update heart particles
    for (let i = this._heartParticles.length - 1; i >= 0; i--) {
      this._heartParticles[i].update(dt);
      if (this._heartParticles[i].dead) this._heartParticles.splice(i, 1);
    }

    // Update sparkles
    for (let i = this._sparkles.length - 1; i >= 0; i--) {
      this._sparkles[i].update(dt);
      if (this._sparkles[i].dead) this._sparkles.splice(i, 1);
    }

    // Check per-box states
    for (const box of boxes) {
      this.assignPersonality(box);

      // Idle detection
      if (Math.abs(box.velocity) > 50) {
        this._lastMoveTimes.set(box, now);
      }
      const lastMove = this._lastMoveTimes.get(box) || now;
      const idleDuration = now - lastMove;
      const lastIdleSpeech = this._idleTimers.get(box) || 0;

      if (idleDuration > 2000 && now - lastIdleSpeech > 5000) {
        this.say(box, 'idle', 'neutral');
        this._idleTimers.set(box, now);
      }

      // Moving fast speech
      if (Math.abs(box.velocity) > 600 && Math.random() < 0.003) {
        this.say(box, 'movingFast', 'excited');
      }

      // High depth speech
      if (box.splitDepth >= 3 && Math.random() < 0.002) {
        this.say(box, 'highDepth', 'sad');
      }

      // Near death (1-2 boxes)
      if (boxes.length <= 2 && boxes.length > 0 && Math.random() < 0.002) {
        this.say(box, 'nearDeath', 'scared');
      }

      // Sparkles for happy boxes (depth 0)
      if (box.splitDepth === 0 && Math.random() < 0.04) {
        this._sparkles.push(new Sparkle(
          box.x + Math.random() * box.width,
          box.y + Math.random() * box.height
        ));
      }

      // Random kawaii emoticons floating
      if (Math.random() < 0.002) {
        const e = pick(ANIME_TEXTS);
        this._animeTexts.push(new AnimeText(
          e.text,
          box.x + box.width / 2,
          box.y,
          e.color,
          e.size
        ));
      }
    }

    // Heart particles between nearby boxes
    if (boxes.length >= 2 && Math.random() < 0.02) {
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const ax = boxes[i].x + boxes[i].width / 2;
          const bx = boxes[j].x + boxes[j].width / 2;
          const dist = Math.abs(ax - bx);
          if (dist < 100) {
            const mx = (ax + bx) / 2;
            const my = Math.min(boxes[i].y, boxes[j].y);
            this._heartParticles.push(new HeartParticle(mx, my));
          }
        }
      }
    }

    // Encouragement after surviving 10s intervals
    const elapsed = now - this._gameStartTime;
    if (elapsed - (this._encourageTime - this._gameStartTime) > 10000 && boxes.length > 0) {
      this._encourageTime = now;
      const box = pick(boxes);
      this._animeTexts.push(new AnimeText(
        'ganbatte!', box.x + box.width / 2, box.y - 10, '#ffeb3b', 28
      ));
    }

    // Celebration check (30s survival)
    if (this.isCelebrating(now)) {
      for (const box of boxes) {
        if (Math.random() < 0.05) {
          this.say(box, 'celebration', 'excited');
        }
        // Party sparkles
        if (Math.random() < 0.15) {
          this._sparkles.push(new Sparkle(
            box.x + Math.random() * box.width,
            box.y + Math.random() * box.height
          ));
        }
      }
    }
  }

  render(ctx, boxes) {
    // Render sparkles (behind bubbles)
    for (const s of this._sparkles) {
      s.render(ctx);
    }

    // Render heart particles
    for (const h of this._heartParticles) {
      h.render(ctx);
    }

    // Render anime texts
    for (const t of this._animeTexts) {
      t.render(ctx);
    }

    // Render speech bubbles above boxes
    for (const [box, bubble] of this._bubbles) {
      const bx = box.x + box.width / 2;
      const by = box.y;
      bubble.render(ctx, bx, by);
    }
  }
}
