class Star {
  lastSpeed = 0;
  lastRadius = 0;
  constructor({ x, y, radius, queueLength = 10, hyper, color = "white" }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.queueLength = queueLength;
    this.hyper = hyper;

    this.speed =
      (this.radius ** 2 / (2 * this.hyper.starMaxRadius) ** 2) *
      0.005 *
      hyper.speedFactor ** 2;
    this.color = color;
    this.lastRadius = this.radius * 0.1;
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
  }
  draw(ctx) {
    // ctx.arc(x, y, radius, 0, 2 * Math.PI);
    // draw a cylinder instead of a circle
    ctx.lineWidth = 2 * this.lastRadius;
    ctx.strokeStyle = this.color;
    ctx.lineCap = "round";
    ctx.moveTo(this.x, this.y);
    const alpha = this.lastRadius / this.radius;
    ctx.globalAlpha = alpha;
    ctx.lineTo(
      this.x - this.vector.x * (this.lastSpeed / 1.1 - alpha),
      this.y - this.vector.y * (this.lastSpeed / 1.1 - alpha)
    );
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  live(fraction = 1) {
    this.lastRadius < this.radius && (this.lastRadius += 1.1);
    const distance = Math.sqrt(
      (this.x - this.hyper.center.x) ** 2 + (this.y - this.hyper.center.y) ** 2
    );
    const distanceFactor = distance / 1_000;
    const delta = fraction * this.speed + distanceFactor ** 2;
    this.lastSpeed = delta;
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
      this.hyper.stars = this.hyper.stars.filter((star) => star !== this);
    }
  }
}
