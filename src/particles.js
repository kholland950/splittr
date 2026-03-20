// src/particles.js — Particle effects for splits and destroys

export class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 10;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 200 * dt; // gravity
    this.vx *= 0.99;
    this.life -= dt;
    this.rotation += this.rotSpeed * dt;
  }

  get alpha() {
    return Math.max(0, this.life / this.maxLife);
  }

  get dead() {
    return this.life <= 0;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Burst of cyan shards when a box splits
  emitSplit(x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const count = 20 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 400;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 150;
      const hue = 185 + Math.random() * 20;
      const lightness = 50 + Math.random() * 30;
      const color = `hsl(${hue}, 100%, ${lightness}%)`;
      const size = 2 + Math.random() * 4;
      const life = 0.3 + Math.random() * 0.5;
      this.particles.push(new Particle(cx, cy, vx, vy, color, size, life));
    }
    // Add a flash ring
    this._emitRing(cx, cy, 'rgba(0, 212, 255, 0.6)', width * 0.8);
  }

  // Burst of red shards when a box is destroyed
  emitDestroy(x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const count = 35 + Math.floor(Math.random() * 15);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 500;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 200;
      const isRed = Math.random() > 0.3;
      const color = isRed
        ? `hsl(${350 + Math.random() * 20}, 100%, ${40 + Math.random() * 30}%)`
        : `hsl(${190 + Math.random() * 10}, 100%, ${50 + Math.random() * 30}%)`;
      const size = 2 + Math.random() * 6;
      const life = 0.4 + Math.random() * 0.8;
      this.particles.push(new Particle(cx, cy, vx, vy, color, size, life));
    }
    this._emitRing(cx, cy, 'rgba(255, 23, 68, 0.7)', width);
  }

  // Trailing sparkle behind moving triangles
  emitTriangleTrail(x, y) {
    if (Math.random() > 0.3) return; // sparse trail
    const vx = (Math.random() - 0.5) * 40;
    const vy = -20 - Math.random() * 40;
    const color = `rgba(255, ${100 + Math.random() * 80}, ${50 + Math.random() * 50}, 0.8)`;
    const size = 1 + Math.random() * 2;
    const life = 0.15 + Math.random() * 0.25;
    this.particles.push(new Particle(x, y, vx, vy, color, size, life));
  }

  _emitRing(x, y, color, radius) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = radius * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1.5;
      const life = 0.2;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life));
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      // Mix of squares and diamonds for variety
      if (p.size > 3) {
        // Diamond shape for larger particles
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.7, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}
