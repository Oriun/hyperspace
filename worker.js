onmessage = function (e) {
  const { canvas, ...options } = e.data;
  if (!canvas) return;
  const hyperspace = new HyperSpace(canvas, { ...options, offScreen: true });
  new DemoController({ hyperspace });
};

class HyperSpace {
  static plannedDuration = 1000 / 30;
  static defaultOptions = {
    speedFactor: 1,
    speedStep: 200,
    zoomFactor: 2,
    colors: ["white", "white", "#cccccc", "lightgray", "#ccffff", "#c0ffff"],
    starCount: 200,
    starMaxRadius: 10,
    devMode: false,
    offScreen: false,
    tailFactor: 5
  };
  get center() {
    return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
  }
  set starCount(value) {
    this.options.starCount = value;
  }
  get starCount() {
    return this.options.starCount;
  }
  set starMaxRadius(value) {
    this.options.starMaxRadius = value;
  }
  get starMaxRadius() {
    return this.options.starMaxRadius * this.options.zoomFactor;
  }
  set devMode(value) {
    this.options.devMode = value;
  }
  set zoomFactor(factor) {
    this.options.zoomFactor = factor;
    this.responsive();
  }
  get zoomFactor() {
    return this.options.zoomFactor;
  }
  set speedFactor(value) {
    this.options.speedFactor = Math.min(value / this.options.speedStep, 10);
    this.stars.forEach((star) => (star.speedFactor = this.speedFactor));
  }
  get speedFactor() {
    return this.options.speedFactor * this.options.speedStep;
  }
  constructor(canvas, options) {
    this.canvas = canvas;
    this.options = { ...HyperSpace.defaultOptions, ...options };
    this.responsive();
    this.ctx = this.canvas.getContext("2d");
    this.stars = finiteQueue(this.options.starCount, true);
    this.age = 0;
    this.paused = false;
    this.lastDraw = 0;
    this.init();
  }
  responsive() {
    this.width = this.canvas.offsetWidth * this.options.zoomFactor;
    this.height = this.canvas.offsetHeight * this.options.zoomFactor;
    if (this.options.offScreen) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  init() {
    for (let i = 0; i < this.stars.size; i++) {
      this.aStarIsBorn(0.5);
    }
    this.loop();
  }
  aStarIsBorn(std = 0.2) {
    const star = new Star({
      x: randomInNormalDistribution(std) * this.canvas.width,
      y: randomInNormalDistribution(std) * this.canvas.height,
      radius: Math.max(
        4,
        Math.min(
          Math.floor(
            randomInNormalDistribution() * this.starMaxRadius +
              this.age / 100_000
          ),
          this.starMaxRadius
        )
      ),
      center: this.center,
      speedFactor: this.speedFactor,
      hyper: this,
      color: randomPick(this.options.colors)
    });
    this.stars.push(star);
  }
  drawDevMode() {
    if (!this.options.devMode) return;
    const { ctx, center } = this;
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.arc(center.x, center.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.font = "64px sans-serif";
    ctx.fontWeight = "bold";
    ctx.fillText(
      `Use arrow keys to modify speed and count and space to pause`,
      10,
      64
    );
    Object.entries({
      speedFactor: this.speedFactor,
      starCount: this.options.starCount,
      actualStarCount: this.stars.length,
      zoomFactor: this.options.zoomFactor,
      starMaxRadius: this.options.starMaxRadius,
      desiredFps: 1000 / HyperSpace.plannedDuration,
      fps: Math.ceil(1000 / (Date.now() - this.lastDraw))
    }).forEach(([key, value], index) => {
      ctx.fillText(`${key}: ${value.toFixed(2)}`, 10, 64 * (index + 2));
    });
    ctx.closePath();
  }
  loop() {
    if (this.paused === true) return;
    const start = Date.now();
    this.age++;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.stars.forEach((star) => {
      this.ctx.beginPath();
      this.ctx.fillStyle = star.color;
      const steps = this.options.tailFactor * this.options.speedFactor;
      for (let i = 0; i < steps; i++) {
        star.live(1 / steps);
      }
      star.draw(this.ctx);
      this.ctx.closePath();
    });
    this.drawDevMode();
    const missing = this.options.starCount - this.stars.length;
    for (let i = 0; i < missing; i++) {
      this.aStarIsBorn();
    }
    const elapsed = Date.now() - start;
    setTimeout(
      () => this.loop(),
      Math.ceil(Math.max(0, HyperSpace.plannedDuration - elapsed))
    );
    this.lastDraw = start;
  }
  play() {
    this.paused = false;
    this.loop();
  }
  pause() {
    this.paused = true;
  }
  upSpeed(value) {
    this.speedFactor += value ?? this.options.speedStep;
  }
}
class Star {
  lastPos;
  constructor({ x, y, radius, queueLength = 10, hyper, color = "white" }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.queueLength = queueLength;
    this.lastPos = finiteQueue(queueLength);
    this.hyper = hyper;

    this.speed =
      (this.radius ** 2 / (2 * this.hyper.starMaxRadius) ** 2) *
      0.005 *
      hyper.speedFactor ** 2;
    this.color = color;
  }
  get vector() {
    const vector = {
      x: this.x - this.hyper.center.x,
      y: this.y - this.hyper.center.y
    };
    const vecMax = Math.max(Math.abs(vector.x), Math.abs(vector.y));
    return {
      x: vector.x / vecMax,
      y: vector.y / vecMax
    };
  }
  set speedFactor(factor) {
    this.speed =
      (this.radius ** 2 / (2 * this.hyper.starMaxRadius) ** 2) *
      0.005 *
      factor ** 2;
    this.lastPos.size = this.hyper.options.speedFactor * 10;
  }
  get trainee() {
    return this.lastPos.filter((pos) => pos);
  }
  draw(ctx) {
    const pos = this.trainee;
    for (let i = 0; i < pos.length; i++) {
      const { x, y, radius } = pos[i];
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  live(fraction) {
    const lastRadius = this.trainee.at(-1)?.radius || 0;
    this.lastPos.push({
      x: this.x,
      y: this.y,
      radius: Math.min(lastRadius + 1, this.radius)
    });
    const distance = Math.sqrt(
      (this.x - this.hyper.center.x) ** 2 + (this.y - this.hyper.center.y) ** 2
    );
    const distanceFactor = distance / 1_000;
    const delta = fraction * this.speed + distanceFactor ** 2;
    this.x += this.vector.x * delta;
    this.y += this.vector.y * delta;
    this.checkBounds();
  }
  checkBounds() {
    if (
      this.x < -this.hyper.starMaxRadius ||
      this.x > this.hyper.canvas.width + this.hyper.starMaxRadius ||
      this.y < -this.hyper.starMaxRadius ||
      this.y > this.hyper.canvas.height + this.hyper.starMaxRadius
    ) {
      this.lastPos.pop();
      this.lastPos.push(null);
      if (!this.trainee.length)
        this.hyper.stars = this.hyper.stars.filter((star) => star !== this);
    }
  }
}
class DemoController {
  constructor({ hyperspace, worker }) {
    this.hyper = hyperspace;
    this.worker = worker;
    if (worker) this.initWorker();
    else this.initMain();
  }
  initMain() {
    const { hyper } = this;
    const keyDown = (event) => {
      if (event.key === "ArrowUp") {
        hyper.speedFactor *= 1.2;
      }
      if (event.key === "ArrowDown") {
        hyper.speedFactor /= 1.2;
      }
      if (event.key === "ArrowRight") {
        hyper.starCount *= 1.2;
      }
      if (event.key === "ArrowLeft") {
        hyper.starCount /= 1.2;
      }
      if (event.key === " ") {
        hyper.paused ? hyper.play() : hyper.pause();
      }
    };
    globalThis.document?.addEventListener("keydown", keyDown);
    onmessage = (event) => {
      if (!event.data.key) return;
      keyDown(event.data);
    };
  }
  initWorker() {
    document.addEventListener("keydown", (event) => {
      this.worker.postMessage({ key: event.key });
    });
  }
}
const finiteQueue = (_size) => {
  const queue = [];
  queue.size = _size;
  queue.push = (item) => {
    if (queue.length >= queue.size) queue.shift();
    return Array.prototype.push.call(queue, item);
  };
  return queue;
};
const rand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
const randomInNormalDistribution = (std = 0.3) => {
  return (
    0.5 +
    std * Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand())
  );
};
const randomPick = (arr) => arr[Math.floor(rand() * arr.length)];
