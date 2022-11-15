class Utils {
  static finiteQueue = (_size) => {
    const queue = [];
    queue.size = _size;
    queue.push = (item) => {
      if (queue.length >= queue.size) queue.shift();
      return Array.prototype.push.call(queue, item);
    };
    return queue;
  };
  static MAX_UINT = 2 ** 32;
  static rand = () =>
    crypto.getRandomValues(new Uint32Array(1))[0] / Utils.MAX_UINT;
  static randomInNormalDistribution = (std = 0.3) => {
    return (
      0.5 +
      std *
        Math.sqrt(-2 * Math.log(Utils.rand())) *
        Math.cos(2 * Math.PI * Utils.rand())
    );
  };
  static randomPick = (arr) => arr[Math.floor(Utils.rand() * arr.length)];
}
