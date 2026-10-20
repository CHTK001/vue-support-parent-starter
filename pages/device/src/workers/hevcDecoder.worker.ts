/**
 * H.265 软解 worker：libde265 WASM 只在 WebCodecs HEVC 不可用时按需加载。
 *
 * <p>主线程把「关键帧 + VPS/SPS/PPS」或「普通帧」按 Annex B 拼好发进来；
 * worker 解码后转成 RGBA，再把像素数据 transfer 回主线程画到 canvas。</p>
 */

import type { Decoder, Image, MainModule } from "@yume-chan/libde265";

type WorkerRequest =
  | { type: "init" }
  | { type: "frame"; data: Uint8Array; timestampUs: number }
  | { type: "flush" };

const ctx = self as unknown as {
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

let modulePromise: Promise<MainModule> | null = null;
let module: MainModule | null = null;
let decoder: Decoder | null = null;

function ensureModule(): Promise<MainModule> {
  if (!modulePromise) {
    modulePromise = import("@yume-chan/libde265").then((m) => m.default());
  }
  return modulePromise;
}

function requireModule(): MainModule {
  if (!module) throw new Error("libde265 尚未初始化");
  return module;
}

function requireDecoder(): Decoder {
  if (!decoder) throw new Error("libde265 decoder 尚未初始化");
  return decoder;
}

function fail(message: string): void {
  ctx.postMessage({ type: "error", message });
}

function decodeAvailable(): void {
  const mod = requireModule();
  const dec = requireDecoder();
  let more = true;
  while (more) {
    const result = dec.decode();
    more = result.more;
    if (!mod.isOk(result.error)) {
      if (result.error === mod.Error.ERROR_WAITING_FOR_INPUT_DATA) return;
      throw new Error(`HEVC 解码失败 ${result.error}: ${mod.getErrorText(result.error)}`);
    }
    const image = dec.getNextPicture();
    if (!image) continue;
    postFrame(image);
    image.delete();
  }
}

function postFrame(image: Image): void {
  const y = image.getImagePlane(0);
  const u = image.getImagePlane(1);
  const v = image.getImagePlane(2);
  const width = y.width;
  const height = y.height;
  const strideY = y.stride || y.width;
  const strideU = u.stride || u.width;
  const strideV = v.stride || v.width;
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let row = 0; row < height; row++) {
    const yRow = row * strideY;
    const uRow = Math.min(u.height - 1, Math.floor((row * u.height) / height)) * strideU;
    const vRow = Math.min(v.height - 1, Math.floor((row * v.height) / height)) * strideV;
    const outRow = row * width * 4;
    for (let col = 0; col < width; col++) {
      const yy = y.bytes[yRow + col];
      const ux = Math.min(u.width - 1, Math.floor((col * u.width) / width));
      const vx = Math.min(v.width - 1, Math.floor((col * v.width) / width));
      const cb = u.bytes[uRow + ux] - 128;
      const cr = v.bytes[vRow + vx] - 128;
      const r = yy + 1.402 * cr;
      const g = yy - 0.344136 * cb - 0.714136 * cr;
      const b = yy + 1.772 * cb;
      const p = outRow + col * 4;
      rgba[p] = r < 0 ? 0 : r > 255 ? 255 : r;
      rgba[p + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      rgba[p + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      rgba[p + 3] = 255;
    }
  }

  ctx.postMessage({ type: "frame", width, height, data: rgba }, [rgba.buffer]);
}

async function handleInit(): Promise<void> {
  module = await ensureModule();
  decoder = new module.Decoder();
  ctx.postMessage({ type: "ready" });
}

function handleFrame(req: Extract<WorkerRequest, { type: "frame" }>): void {
  const dec = requireDecoder();
  const mod = requireModule();
  const err = dec.pushData(req.data, BigInt(req.timestampUs));
  if (!mod.isOk(err)) {
    throw new Error(`HEVC 输入失败 ${err}: ${mod.getErrorText(err)}`);
  }
  dec.pushEndOfFrame();
  decodeAvailable();
}

function handleFlush(): void {
  const dec = requireDecoder();
  const mod = requireModule();
  const err = dec.flushData();
  if (!mod.isOk(err)) {
    throw new Error(`HEVC flush 失败 ${err}: ${mod.getErrorText(err)}`);
  }
  decodeAvailable();
  ctx.postMessage({ type: "flushed" });
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const req = ev.data;
  Promise.resolve()
    .then(async () => {
      if (req.type === "init") {
        await handleInit();
      } else if (req.type === "frame") {
        handleFrame(req);
      } else if (req.type === "flush") {
        handleFlush();
      }
    })
    .catch((e: unknown) => fail((e as Error)?.message || String(e)));
};
