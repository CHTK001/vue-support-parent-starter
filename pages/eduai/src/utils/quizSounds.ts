/**
 * 识字练习音效 —— Web Audio 合成，零素材零依赖。
 *
 * <p>只提供三类短音效：答对（上行双音）、答错（低哑短鸣）、批次完成（上行琶音）。
 * AudioContext 懒加载，首次点击（用户手势）后才能出声，符合浏览器自动播放策略；
 * 浏览器不支持或合成失败一律静默忽略，不影响答题本身。</p>
 *
 * <p>静音偏好本地留存（eduai:hanzi-sound-off），开关由页面提供。</p>
 */

const SOUND_OFF_KEY = "eduai:hanzi-sound-off";

/** 是否关闭音效（页面初始化时读取） */
export function readSoundOff(): boolean {
  try {
    return window.localStorage.getItem(SOUND_OFF_KEY) === "1";
  } catch {
    return false;
  }
}

/** 写回静音偏好（隐私模式等异常静默忽略） */
export function writeSoundOff(value: boolean): void {
  try {
    if (value) {
      window.localStorage.setItem(SOUND_OFF_KEY, "1");
    } else {
      window.localStorage.removeItem(SOUND_OFF_KEY);
    }
  } catch {
    /* 记不住偏好不影响使用 */
  }
}

/** AudioContext 懒加载单例；不支持时返回 null */
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        return null;
      }
      ctx = new AC();
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

/**
 * 播一个音符。
 *
 * @param ac   AudioContext
 * @param freq 频率（Hz）
 * @param t0   起始时刻（相对当前时间偏移，秒）
 * @param dur  持续秒数
 * @param type 波形
 * @param gain 音量峰值
 */
function tone(ac: AudioContext, freq: number, t0: number, dur: number, type: OscillatorType, gain = 0.16): void {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // 快起缓落包络，避免咔哒爆音
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** 音符序列：[频率, 偏移秒, 时长秒, 音量?] */
type Note = [number, number, number, number?];

function sequence(notes: Note[], type: OscillatorType): void {
  const ac = audio();
  if (!ac) {
    return;
  }
  const t = ac.currentTime + 0.02;
  notes.forEach(([freq, offset, dur, gain]) => tone(ac, freq, t + offset, dur, type, gain));
}

/** 答对：上行双音（清脆三角波） */
export function playCorrect(): void {
  sequence(
    [
      [660, 0, 0.12],
      [880, 0.1, 0.18],
    ],
    "triangle",
  );
}

/** 答错：低哑短鸣（音量压低，不吓人） */
export function playWrong(): void {
  sequence(
    [
      [220, 0, 0.16, 0.09],
      [180, 0.12, 0.2, 0.09],
    ],
    "sawtooth",
  );
}

/** 批次完成：上行琶音 C5-E5-G5-C6 */
export function playFinish(): void {
  sequence(
    [
      [523, 0, 0.14],
      [659, 0.12, 0.14],
      [784, 0.24, 0.14],
      [1047, 0.36, 0.3],
    ],
    "triangle",
  );
}
