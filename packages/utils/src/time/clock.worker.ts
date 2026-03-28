/**
 * Shared clock worker.
 * Emits the current timestamp once immediately and then every second.
 */

let timer: ReturnType<typeof setInterval> | null = null;

const emitNow = () => {
  self.postMessage({ now: Date.now() });
};

emitNow();
timer = setInterval(emitNow, 1000);

self.addEventListener("message", (event: MessageEvent<{ type?: string }>) => {
  if (event.data?.type === "dispose" && timer) {
    clearInterval(timer);
    timer = null;
  }
});
