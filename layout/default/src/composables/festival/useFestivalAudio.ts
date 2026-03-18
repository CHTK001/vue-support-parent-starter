/**
 * 节日音效组合函数
 * @description 提供节日音效播放和管理功能
 */
import { ref, onUnmounted, type Ref } from 'vue';

export interface AudioConfig {
  /** 音频源 URL */
  src: string;
  /** 音量 (0-1) */
  volume?: number;
  /** 是否循环 */
  loop?: boolean;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 淡入时间（毫秒） */
  fadeIn?: number;
  /** 淡出时间（毫秒） */
  fadeOut?: number;
}

export interface AudioInstance {
  id: string;
  config: AudioConfig;
  audio: HTMLAudioElement;
  isPlaying: boolean;
  isMuted: boolean;
}

export function useFestivalAudio() {
  const audios: Ref<AudioInstance[]> = ref([]);
  const globalVolume: Ref<number> = ref(1);
  const globalMuted: Ref<boolean> = ref(false);

  /**
   * 加载音频
   */
  const loadAudio = (config: AudioConfig): string => {
    const id = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const audio = new Audio(config.src);
    audio.volume = (config.volume || 1) * globalVolume.value;
    audio.loop = config.loop || false;

    const instance: AudioInstance = {
      id,
      config,
      audio,
      isPlaying: false,
      isMuted: false,
    };

    if (config.autoPlay) {
      play(id);
    }

    audios.value.push(instance);
    return id;
  };

  /**
   * 播放音频
   */
  const play = (id: string): Promise<void> => {
    const instance = audios.value.find(a => a.id === id);
    if (!instance) return Promise.reject(new Error('Audio not found'));

    const { audio, config } = instance;
    
    // 淡入效果
    if (config.fadeIn) {
      audio.volume = 0;
      const targetVolume = (config.volume || 1) * globalVolume.value;
      const step = targetVolume / (config.fadeIn / 50);
      
      const fadeInInterval = setInterval(() => {
        if (audio.volume < targetVolume) {
          audio.volume = Math.min(audio.volume + step, targetVolume);
        } else {
          clearInterval(fadeInInterval);
        }
      }, 50);
    }

    instance.isPlaying = true;
    return audio.play();
  };

  /**
   * 暂停音频
   */
  const pause = (id: string): void => {
    const instance = audios.value.find(a => a.id === id);
    if (instance) {
      instance.audio.pause();
      instance.isPlaying = false;
    }
  };

  /**
   * 停止音频
   */
  const stop = (id: string): void => {
    const instance = audios.value.find(a => a.id === id);
    if (instance) {
      instance.audio.pause();
      instance.audio.currentTime = 0;
      instance.isPlaying = false;
    }
  };

  /**
   * 设置音量
   */
  const setVolume = (id: string, volume: number): void => {
    const instance = audios.value.find(a => a.id === id);
    if (instance) {
      instance.audio.volume = Math.max(0, Math.min(1, volume)) * globalVolume.value;
    }
  };

  /**
   * 设置全局音量
   */
  const setGlobalVolume = (volume: number): void => {
    globalVolume.value = Math.max(0, Math.min(1, volume));
    audios.value.forEach(instance => {
      instance.audio.volume = (instance.config.volume || 1) * globalVolume.value;
    });
  };

  /**
   * 静音/取消静音
   */
  const toggleMute = (id: string): void => {
    const instance = audios.value.find(a => a.id === id);
    if (instance) {
      instance.audio.muted = !instance.audio.muted;
      instance.isMuted = instance.audio.muted;
    }
  };

  /**
   * 全局静音/取消静音
   */
  const toggleGlobalMute = (): void => {
    globalMuted.value = !globalMuted.value;
    audios.value.forEach(instance => {
      instance.audio.muted = globalMuted.value;
      instance.isMuted = globalMuted.value;
    });
  };

  /**
   * 移除音频
   */
  const removeAudio = (id: string): void => {
    const index = audios.value.findIndex(a => a.id === id);
    if (index !== -1) {
      const instance = audios.value[index];
      instance.audio.pause();
      instance.audio.src = '';
      audios.value.splice(index, 1);
    }
  };

  /**
   * 清空所有音频
   */
  const clearAudios = (): void => {
    audios.value.forEach(instance => {
      instance.audio.pause();
      instance.audio.src = '';
    });
    audios.value = [];
  };

  /**
   * 清理
   */
  onUnmounted(() => {
    clearAudios();
  });

  return {
    audios,
    globalVolume,
    globalMuted,
    loadAudio,
    play,
    pause,
    stop,
    setVolume,
    setGlobalVolume,
    toggleMute,
    toggleGlobalMute,
    removeAudio,
    clearAudios,
  };
}
