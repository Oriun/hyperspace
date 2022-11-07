const demoOptions = {
  zoomFactor: 3,
  speedFactor: 0.75,
  starCount: 70,
  backgroundColor: "#000011",
  devMode: true,
  tailFactor: 3
};

window.onload = function () {
  const canvas = document.getElementById("space");
  const offCanvas = canvas.transferControlToOffscreen?.();
  let hyperspace;
  if (offCanvas && window.Worker) {
    console.log("Offscreen canvas supported");
    offCanvas.width = canvas.offsetWidth * (demoOptions.zoomFactor ?? 1);
    offCanvas.height = canvas.offsetHeight * (demoOptions.zoomFactor ?? 1);
    const worker = new Worker("worker.js");
    worker.postMessage({ canvas: offCanvas, ...demoOptions }, [offCanvas]);
    new DemoController({ worker });
  } else {
    console.log("Offscreen canvas not supported");
    hyperspace = new HyperSpace(canvas, demoOptions);
    new DemoController({ hyperspace });
  }
};
