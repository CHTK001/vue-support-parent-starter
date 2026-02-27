<template>
  <div class="pomodoro-tool">
    <div class="pomodoro-tool__header">
      <div class="pomodoro-tool__header-content">
        <IconifyIconOnline icon="ri:timer-line" class="pomodoro-tool__header-icon" />
        <div>
          <h2 class="pomodoro-tool__header-title">番茄工作法计时器</h2>
          <p class="pomodoro-tool__header-desc">使用定时器分割工作和休息时间，提高效率和保持专注</p>
        </div>
      </div>
    </div>

    <ScRow :gutter="20" class="pomodoro-tool__main-content">
      <ScCol :span="16">
        <ScCard class="pomodoro-tool__card" shadow="hover">
          <div
            class="pomodoro-tool__timer-display"
            :class="{ 'pomodoro-tool__timer-display--work': isWorkMode, 'pomodoro-tool__timer-display--break': !isWorkMode }"
          >
            <div class="pomodoro-tool__timer-status">
              {{ isWorkMode ? "工作时间" : "休息时间" }}
            </div>
            <div class="pomodoro-tool__timer-clock">{{ formatTime(currentTime) }}</div>
            <div class="pomodoro-tool__timer-progress">
              <ScProgress 
                :percentage="progressPercentage"
                :stroke-width="10"
                :color="isWorkMode ? '#ff6b6b' : '#4caf50'"
                :show-text="false"
              />
            </div>
          </div>

          <div class="pomodoro-tool__timer-controls">
            <el-button-group>
              <ScButton 
                v-if="!isRunning"
                type="primary"
                @click="startTimer"
                round
                :icon="renderIcon('ri:play-circle-line')"
              >
                开始
              </ScButton>
              <ScButton 
                v-else
                type="danger"
                @click="pauseTimer"
                round
                :icon="renderIcon('ri:pause-circle-line')"
              >
                暂停
              </ScButton>
              <ScButton 
                type="warning"
                @click="resetTimer"
                round
                :icon="renderIcon('ri:restart-line')"
              >
                重置
              </ScButton>
              <ScButton 
                type="info"
                @click="skipToNext"
                round
                :icon="renderIcon('ri:skip-forward-line')"
              >
                跳过
              </ScButton>
            </el-button-group>
          </div>

          <div class="pomodoro-tool__timer-cycles">
            <div class="pomodoro-tool__cycle-label">已完成番茄数：</div>
            <div class="pomodoro-tool__cycle-indicators">
              <div
                v-for="n in workCyclesTarget"
                :key="n"
                class="pomodoro-tool__cycle-indicator"
                :class="{ 'pomodoro-tool__cycle-indicator--completed': n <= completedWorkCycles }"
              >
                <IconifyIconOnline
                  :icon="
                    n <= completedWorkCycles
                      ? 'ri:checkbox-circle-fill'
                      : 'ri:checkbox-blank-circle-line'
                  "
                />
              </div>
            </div>
          </div>

          <div class="pomodoro-tool__timer-stats">
            <div class="pomodoro-tool__stats-item">
              <div class="pomodoro-tool__stats-value">{{ completedWorkCycles }}</div>
              <div class="pomodoro-tool__stats-label">已完成</div>
            </div>
            <div class="pomodoro-tool__stats-item">
              <div class="pomodoro-tool__stats-value">{{ formatTime(totalWorkTime) }}</div>
              <div class="pomodoro-tool__stats-label">总工作时间</div>
            </div>
            <div class="pomodoro-tool__stats-item">
              <div class="pomodoro-tool__stats-value">{{ formatTime(totalBreakTime) }}</div>
              <div class="pomodoro-tool__stats-label">总休息时间</div>
            </div>
          </div>
        </ScCard>
      </ScCol>

      <ScCol :span="8">
        <ScCard class="pomodoro-tool__card" shadow="hover">
          <template #header>
            <div class="pomodoro-tool__card-header">
              <IconifyIconOnline icon="ri:settings-3-line" class="pomodoro-tool__card-icon" />
              <span>计时器设置</span>
            </div>
          </template>

          <div class="pomodoro-tool__settings-content">
            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">工作时间 (分钟):</div>
              <ScInputNumber 
                v-model="workTime"
                :min="1"
                :max="60"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">短休息时间 (分钟):</div>
              <ScInputNumber 
                v-model="shortBreakTime"
                :min="1"
                :max="30"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">长休息时间 (分钟):</div>
              <ScInputNumber 
                v-model="longBreakTime"
                :min="1"
                :max="60"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">长休息周期 (工作次数):</div>
              <ScInputNumber 
                v-model="workCyclesTarget"
                :min="1"
                :max="10"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <ScDivider />

            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">自动开始休息:</div>
              <ScSwitch
                v-model="autoStartBreak"
                :disabled="isRunning"
                layout="modern"
              />
            </div>

            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">自动开始工作:</div>
              <ScSwitch
                v-model="autoStartWork"
                :disabled="isRunning"
                layout="modern"
              />
            </div>

            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">声音提醒:</div>
              <ScSwitch v-model="soundEnabled" layout="modern" />
            </div>

            <div class="pomodoro-tool__settings-item">
              <div class="pomodoro-tool__settings-label">声音音量:</div>
              <ScSlider
                v-model="soundVolume"
                :min="0"
                :max="100"
                :disabled="!soundEnabled"
              />
            </div>
          </div>
        </ScCard>
      </ScCol>
    </ScRow>

    <ScRow>
      <ScCol :span="24">
        <ScCard class="pomodoro-tool__card" shadow="hover">
          <template #header>
            <div class="pomodoro-tool__card-header">
              <IconifyIconOnline icon="ri:lightbulb-line" class="pomodoro-tool__card-icon" />
              <span>番茄工作法小贴士</span>
            </div>
          </template>

          <div class="pomodoro-tool__tips-content">
            <ul class="pomodoro-tool__tips-list">
              <li>每个番茄时间（通常为25分钟）专注于单一任务，不受干扰。</li>
              <li>
                休息时间应远离工作，真正放松身心（起身走动、伸展、闭目养神等）。
              </li>
              <li>
                在开始番茄钟前，列出你要完成的任务，并计划需要几个番茄钟。
              </li>
              <li>
                如果有干扰（想法、邮件、电话），写下来，然后回到工作中，在休息时再处理。
              </li>
              <li>
                记录每天完成的番茄数量，可以帮助你了解自己的工作效率和注意力模式。
              </li>
              <li>
                番茄工作法有助于减轻拖延症，因为你只需承诺短时间的专注工作。
              </li>
            </ul>
          </div>
        </ScCard>
      </ScCol>
    </ScRow>

    <!-- 隐藏的音频元素 -->
    <audio
      ref="workFinishedSound"
      preload="auto"
      src="https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
    ></audio>
    <audio
      ref="breakFinishedSound"
      preload="auto"
      src="https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { ScSlider } from "@repo/components";
import { message , ScNotification} from "@repo/utils";

import ScSwitch from "@repo/components/ScSwitch/index.vue";

// 状态变量
const isRunning = ref(false);
const isWorkMode = ref(true);
const currentTime = ref(0);
const completedWorkCycles = ref(0);
const totalWorkTime = ref(0);
const totalBreakTime = ref(0);

// 设置项
const workTime = ref(25);
const shortBreakTime = ref(5);
const longBreakTime = ref(15);
const workCyclesTarget = ref(4);
const autoStartBreak = ref(true);
const autoStartWork = ref(false);
const soundEnabled = ref(true);
const soundVolume = ref(80);

// 音频引用
const workFinishedSound = ref(null);
const breakFinishedSound = ref(null);

// 计时器
let timerInterval = null;

// 计算属性：进度百分比
const progressPercentage = computed(() => {
  const totalDuration = isWorkMode.value
    ? workTime.value * 60
    : completedWorkCycles.value % workCyclesTarget.value === 0 &&
        completedWorkCycles.value > 0
      ? longBreakTime.value * 60
      : shortBreakTime.value * 60;

  return Math.floor((1 - currentTime.value / totalDuration) * 100);
});

// 监听音量变化
watch(soundVolume, (newVolume) => {
  if (workFinishedSound.value) {
    workFinishedSound.value.volume = newVolume / 100;
  }
  if (breakFinishedSound.value) {
    breakFinishedSound.value.volume = newVolume / 100;
  }
});

// 开始计时器
const startTimer = () => {
  if (isRunning.value) return;

  // 如果计时器为0，初始化计时器
  if (currentTime.value === 0) {
    resetTimer();
  }

  isRunning.value = true;

  timerInterval = setInterval(() => {
    if (currentTime.value > 0) {
      currentTime.value--;

      if (isWorkMode.value) {
        totalWorkTime.value++;
      } else {
        totalBreakTime.value++;
      }
    } else {
      // 计时结束
      clearInterval(timerInterval);

      if (isWorkMode.value) {
        // 工作时间结束
        completedWorkCycles.value++;
        playSound(workFinishedSound.value);
        showNotification("工作时间结束", "现在是时候休息一下了！");

        isWorkMode.value = false;
        // 设置休息时间
        if (completedWorkCycles.value % workCyclesTarget.value === 0) {
          // 长休息
          currentTime.value = longBreakTime.value * 60;
        } else {
          // 短休息
          currentTime.value = shortBreakTime.value * 60;
        }

        // 自动开始休息
        if (autoStartBreak.value) {
          startTimer();
        } else {
          isRunning.value = false;
        }
      } else {
        // 休息时间结束
        playSound(breakFinishedSound.value);
        showNotification("休息时间结束", "准备开始新的工作周期！");

        isWorkMode.value = true;
        currentTime.value = workTime.value * 60;

        // 自动开始工作
        if (autoStartWork.value) {
          startTimer();
        } else {
          isRunning.value = false;
        }
      }
    }
  }, 1000);
};

// 暂停计时器
const pauseTimer = () => {
  clearInterval(timerInterval);
  isRunning.value = false;
};

// 重置计时器
const resetTimer = () => {
  clearInterval(timerInterval);
  isRunning.value = false;
  isWorkMode.value = true;
  currentTime.value = workTime.value * 60;
};

// 跳过当前阶段
const skipToNext = () => {
  clearInterval(timerInterval);
  isRunning.value = false;

  if (isWorkMode.value) {
    // 跳过工作时间
    completedWorkCycles.value++;
    isWorkMode.value = false;

    // 设置休息时间
    if (completedWorkCycles.value % workCyclesTarget.value === 0) {
      // 长休息
      currentTime.value = longBreakTime.value * 60;
    } else {
      // 短休息
      currentTime.value = shortBreakTime.value * 60;
    }
  } else {
    // 跳过休息时间
    isWorkMode.value = true;
    currentTime.value = workTime.value * 60;
  }
};

// 播放声音
const playSound = (audioElement) => {
  if (soundEnabled.value && audioElement) {
    audioElement.volume = soundVolume.value / 100;
    audioElement.currentTime = 0;
    audioElement.play();
  }
};

// 显示通知
const showNotification = (title, message) => {
  ScNotification({
    title: title,
    message: message,
    type: isWorkMode.value ? "success" : "warning",
    position: "top-right",
    duration: 3000,
  });
};

// 格式化时间 (将秒数转为 MM:SS 格式)
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// 渲染图标
const renderIcon = (icon) => {
  return () => h(IconifyIconOnline, { icon });
};

// 组件挂载
onMounted(() => {
  resetTimer();

  // 从本地存储中加载设置
  const savedSettings = localStorage.getItem("pomodoroSettings");
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      workTime.value = settings.workTime || 25;
      shortBreakTime.value = settings.shortBreakTime || 5;
      longBreakTime.value = settings.longBreakTime || 15;
      workCyclesTarget.value = settings.workCyclesTarget || 4;
      autoStartBreak.value =
        settings.autoStartBreak !== undefined ? settings.autoStartBreak : true;
      autoStartWork.value =
        settings.autoStartWork !== undefined ? settings.autoStartWork : false;
      soundEnabled.value =
        settings.soundEnabled !== undefined ? settings.soundEnabled : true;
      soundVolume.value =
        settings.soundVolume !== undefined ? settings.soundVolume : 80;
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  // 重置计时器与设置同步
  resetTimer();
});

// 组件卸载前
onBeforeUnmount(() => {
  clearInterval(timerInterval);

  // 保存设置到本地存储
  const settings = {
    workTime: workTime.value,
    shortBreakTime: shortBreakTime.value,
    longBreakTime: longBreakTime.value,
    workCyclesTarget: workCyclesTarget.value,
    autoStartBreak: autoStartBreak.value,
    autoStartWork: autoStartWork.value,
    soundEnabled: soundEnabled.value,
    soundVolume: soundVolume.value,
  };

  localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
});

// 监听设置变化，如果未运行则重置计时器
watch([workTime, shortBreakTime, longBreakTime], () => {
  if (!isRunning.value) {
    resetTimer();
  }
});
</script>

<style scoped lang="scss">
.pomodoro-tool {
  padding: 20px;

  &__header {
    background: linear-gradient(135deg, var(--el-color-warning-light-3) 0%, var(--el-color-warning) 100%);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__header-icon {
    font-size: 48px;
    opacity: 0.9;
  }

  &__header-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }

  &__header-desc {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
  }

  &__main-content {
    margin-bottom: 20px;
  }

  &__card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: var(--el-color-warning-light-5);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-color-warning);
  }

  &__card-icon {
    font-size: 20px;
  }

  &__timer-display {
    text-align: center;
    padding: 40px;
    border-radius: 12px;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__timer-display--work {
    background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
    border: 2px solid var(--el-color-danger-light-5);
  }

  &__timer-display--break {
    background: linear-gradient(135deg, #f0f9f0 0%, #e0f5e0 100%);
    border: 2px solid var(--el-color-success-light-5);
  }

  &__timer-status {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
  }

  &__timer-clock {
    font-size: 72px;
    font-weight: 700;
    font-family: "Courier New", monospace;
    margin: 24px 0;
    letter-spacing: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &__timer-display--work &__timer-clock {
    color: var(--el-color-danger);
  }

  &__timer-display--break &__timer-clock {
    color: var(--el-color-success);
  }

  &__timer-progress {
    margin: 24px 0;
  }

  &__timer-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }

  &__timer-cycles {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 24px 0;
    padding: 16px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  &__cycle-label {
    margin-right: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__cycle-indicators {
    display: flex;
    gap: 8px;
  }

  &__cycle-indicator {
    font-size: 28px;
    color: var(--el-text-color-placeholder);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__cycle-indicator--completed {
    color: var(--el-color-success);
    transform: scale(1.1);
  }

  &__timer-stats {
    display: flex;
    justify-content: space-around;
    background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-light) 100%);
    padding: 20px;
    border-radius: 12px;
    margin-top: 24px;
  }

  &__stats-item {
    text-align: center;
    flex: 1;
  }

  &__stats-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-color-primary);
    margin-bottom: 4px;
  }

  &__stats-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__settings-content {
    padding: 8px 0;
  }

  &__settings-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 12px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  &__settings-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__tips-content {
    padding: 8px 0;
  }

  &__tips-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      position: relative;
      margin-bottom: 12px;
      padding-left: 24px;
      line-height: 1.6;
      color: var(--el-text-color-regular);

      &::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--el-color-warning);
        font-weight: bold;
        font-size: 18px;
      }
    }
  }
}
</style>
