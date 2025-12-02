<template>
  <div class="pomodoro-container">
    <div class="tool-description">
      <el-alert type="info" show-icon :closable="false">
        <p>
          番茄工作法是一种时间管理方法，使用一个定时器来分割工作和休息时间，以提高效率和保持专注。
        </p>
        <p>
          传统的番茄工作法包括25分钟的工作时间和5分钟的休息时间，完成4个周期后进行一次较长休息。
        </p>
      </el-alert>
    </div>

    <el-row :gutter="20" class="main-content">
      <el-col :span="16">
        <el-card class="timer-card">
          <div
            class="timer-display"
            :class="{ 'work-mode': isWorkMode, 'break-mode': !isWorkMode }"
          >
            <div class="timer-status">
              {{ isWorkMode ? "工作时间" : "休息时间" }}
            </div>
            <div class="timer-clock">{{ formatTime(currentTime) }}</div>
            <div class="timer-progress">
              <el-progress
                :percentage="progressPercentage"
                :stroke-width="10"
                :color="isWorkMode ? '#ff6b6b' : '#4caf50'"
                :show-text="false"
              />
            </div>
          </div>

          <div class="timer-controls">
            <el-button-group>
              <el-button
                v-if="!isRunning"
                type="primary"
                @click="startTimer"
                round
                :icon="renderIcon('ri:play-circle-line')"
              >
                开始
              </el-button>
              <el-button
                v-else
                type="danger"
                @click="pauseTimer"
                round
                :icon="renderIcon('ri:pause-circle-line')"
              >
                暂停
              </el-button>
              <el-button
                type="warning"
                @click="resetTimer"
                round
                :icon="renderIcon('ri:restart-line')"
              >
                重置
              </el-button>
              <el-button
                type="info"
                @click="skipToNext"
                round
                :icon="renderIcon('ri:skip-forward-line')"
              >
                跳过
              </el-button>
            </el-button-group>
          </div>

          <div class="timer-cycles">
            <div class="cycle-label">已完成番茄数：</div>
            <div class="cycle-indicators">
              <div
                v-for="n in workCyclesTarget"
                :key="n"
                class="cycle-indicator"
                :class="{ completed: n <= completedWorkCycles }"
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

          <div class="timer-stats">
            <div class="stats-item">
              <div class="stats-value">{{ completedWorkCycles }}</div>
              <div class="stats-label">已完成</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ formatTime(totalWorkTime) }}</div>
              <div class="stats-label">总工作时间</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ formatTime(totalBreakTime) }}</div>
              <div class="stats-label">总休息时间</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="settings-card">
          <template #header>
            <div class="settings-header">
              <span>计时器设置</span>
            </div>
          </template>

          <div class="settings-content">
            <div class="settings-item">
              <div class="settings-label">工作时间 (分钟):</div>
              <el-input-number
                v-model="workTime"
                :min="1"
                :max="60"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <div class="settings-item">
              <div class="settings-label">短休息时间 (分钟):</div>
              <el-input-number
                v-model="shortBreakTime"
                :min="1"
                :max="30"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <div class="settings-item">
              <div class="settings-label">长休息时间 (分钟):</div>
              <el-input-number
                v-model="longBreakTime"
                :min="1"
                :max="60"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <div class="settings-item">
              <div class="settings-label">长休息周期 (工作次数):</div>
              <el-input-number
                v-model="workCyclesTarget"
                :min="1"
                :max="10"
                :step="1"
                :disabled="isRunning"
              />
            </div>

            <el-divider />

            <div class="settings-item">
              <div class="settings-label">自动开始休息:</div>
              <ScSwitch
                v-model="autoStartBreak"
                :disabled="isRunning"
                layout="modern"
              />
            </div>

            <div class="settings-item">
              <div class="settings-label">自动开始工作:</div>
              <ScSwitch
                v-model="autoStartWork"
                :disabled="isRunning"
                layout="modern"
              />
            </div>

            <div class="settings-item">
              <div class="settings-label">声音提醒:</div>
              <ScSwitch v-model="soundEnabled" layout="modern" />
            </div>

            <div class="settings-item">
              <div class="settings-label">声音音量:</div>
              <el-slider
                v-model="soundVolume"
                :min="0"
                :max="100"
                :disabled="!soundEnabled"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24">
        <el-card class="tips-card">
          <template #header>
            <div class="tips-header">
              <span>番茄工作法小贴士</span>
            </div>
          </template>

          <div class="tips-content">
            <ul class="tips-list">
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
        </el-card>
      </el-col>
    </el-row>

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
import { ElMessage, ElNotification } from "element-plus";
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
  ElNotification({
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

<style scoped>
.pomodoro-container {
  padding: 20px;
}

.tool-description {
  margin-bottom: 20px;
}

.main-content {
  margin-bottom: 20px;
}

.timer-card,
.settings-card,
.tips-card {
  height: 100%;
}

.timer-display {
  text-align: center;
  padding: 30px;
  border-radius: 12px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.work-mode {
  background-color: #fff5f5;
  border: 1px solid #ffcccc;
}

.break-mode {
  background-color: #f0f9f0;
  border: 1px solid #c8e6c9;
}

.timer-status {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.timer-clock {
  font-size: 64px;
  font-weight: bold;
  font-family: "Courier New", monospace;
  margin: 20px 0;
  letter-spacing: 2px;
}

.work-mode .timer-clock {
  color: #ff6b6b;
}

.break-mode .timer-clock {
  color: #4caf50;
}

.timer-progress {
  margin: 20px 0;
}

.timer-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.timer-cycles {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}

.cycle-label {
  margin-right: 10px;
  font-weight: bold;
}

.cycle-indicators {
  display: flex;
}

.cycle-indicator {
  font-size: 24px;
  margin: 0 3px;
  color: var(--el-text-color-secondary);
}

.cycle-indicator.completed {
  color: var(--el-color-success);
}

.timer-stats {
  display: flex;
  justify-content: space-around;
  background-color: var(--el-fill-color-light);
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

.stats-item {
  text-align: center;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.stats-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
}

.settings-header,
.tips-header {
  font-weight: bold;
}

.settings-content {
  padding: 10px 0;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.settings-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.tips-content {
  padding: 10px;
}

.tips-list {
  padding-left: 20px;
  margin: 0;
}

.tips-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}
</style>
