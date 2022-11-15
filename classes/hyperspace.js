class HyperSpace {
  static plannedDuration = 1000 / 30;
  static defaultOptions = {
    speedFactor: 1,
    speedStep: 100,
    zoomFactor: 2,
    colors: ["white"],
    starCount: 200,
    starMaxRadius: 8,
    devMode: false,
    tailFactor: 5,
    tailLength: 10
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
    this.options.speedFactor = Math.min(
      value / (this.options.speedStep * this.zoomFactor),
      10
    );
    this.stars.forEach((star) => (star.speedFactor = this.speedFactor));
  }
  get speedFactor() {
    return this.options.speedFactor * this.options.speedStep * this.zoomFactor;
  }
  constructor(canvas, options) {
    this.canvas = canvas;
    this.options = { ...HyperSpace.defaultOptions, ...options };
    this.responsive();
    this.ctx = this.canvas.getContext("2d");
    this.stars = Utils.finiteQueue(this.options.starCount);
    this.age = 0;
    this.paused = false;
    this.lastDraw = 0;
    this.init();
  }
  responsive() {
    this.width = this.canvas.offsetWidth * this.options.zoomFactor;
    this.height = this.canvas.offsetHeight * this.options.zoomFactor;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.backgroundColor = this.options.backgroundColor;
  }
  init() {
    for (let i = 0; i < this.stars.size; i++) {
      this.aStarIsBorn();
    }
    this.loop();
  }
  aStarIsBorn(std = 0.2) {
    console.log("aStarIsBorn");
    const star = new Star({
      x: Utils.randomInNormalDistribution(std) * this.canvas.width,
      y: Utils.randomInNormalDistribution(std) * this.canvas.height,
      radius: Math.max(
        3,
        Math.min(
          Math.floor(
            Utils.randomInNormalDistribution(std) * this.starMaxRadius +
              this.age / 100_000
          ),
          this.starMaxRadius
        )
      ),
      center: this.center,
      speedFactor: this.speedFactor,
      hyper: this,
      color: Utils.randomPick(this.options.colors),
      queueLength: this.options.tailLength
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
      star.live((start - this.lastDraw) / HyperSpace.plannedDuration);
      // const steps = this.options.tailFactor * this.options.speedFactor;
      // for (let i = 0; i < steps; i++) {
      //   star.live(1 / steps);
      // }
      star.draw(this.ctx);
      this.ctx.closePath();
    });
    this.drawDevMode();
    const missing = this.options.starCount - this.stars.length;
    if (missing >= 0) for (let i = 0; i < missing; i++) this.aStarIsBorn(0.1);
    else
      for (let i = missing; i < 0; i++)
        this.stars.splice(Math.floor(Utils.rand() * this.stars.length), 1);

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
