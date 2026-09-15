<template>
  <div class="p-4">
    <!-- 游戏设置 -->
    <div v-if="!gameStarted" class="max-w-md mx-auto">
      <h3 class="text-xl font-bold text-gray-800 mb-6 text-center">成语消消乐</h3>

      <div class="space-y-4">
        <!-- 学段选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择学段</label>
          <el-select v-model="selectedGradeLevel" placeholder="选择学段" class="w-full">
            <el-option label="小学" value="小学" />
            <el-option label="初中" value="初中" />
            <el-option label="高中" value="高中" />
          </el-select>
        </div>

        <!-- 年级选择 -->
        <div v-if="selectedGradeLevel === '小学'">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择年级</label>
          <el-select v-model="selectedGrade" placeholder="选择年级" class="w-full">
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </div>

        <div v-if="selectedGradeLevel === '初中'">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择年级</label>
          <el-select v-model="selectedGrade" placeholder="选择年级" class="w-full">
            <el-option label="初一" value="初一" />
            <el-option label="初二" value="初二" />
            <el-option label="初三" value="初三" />
          </el-select>
        </div>

        <div v-if="selectedGradeLevel === '高中'">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择年级</label>
          <el-select v-model="selectedGrade" placeholder="选择年级" class="w-full">
            <el-option label="高一" value="高一" />
            <el-option label="高二" value="高二" />
            <el-option label="高三" value="高三" />
          </el-select>
        </div>

        <!-- 题目数量 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">题目数量</label>
          <el-slider v-model="gameCount" :min="5" :max="20" :step="5" show-stops />
        </div>

        <!-- 开始按钮 -->
        <el-button type="primary" class="w-full" @click="startGame" :loading="loading">
          开始游戏
        </el-button>
      </div>
    </div>

    <!-- 游戏界面 -->
    <div v-else class="max-w-4xl mx-auto">
      <!-- 游戏头部 -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-gray-800">成语消消乐</h3>
          <p class="text-sm text-gray-500">{{ selectedGradeLevel }} {{ selectedGrade }}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ score }}</div>
            <div class="text-xs text-gray-500">得分</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-500">{{ currentIndex + 1 }}/{{ gameData.items.length }}</div>
            <div class="text-xs text-gray-500">进度</div>
          </div>
          <el-button @click="resetGame">重新开始</el-button>
        </div>
      </div>

      <!-- 当前成语 -->
      <div v-if="currentItem" class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <div class="text-center mb-8">
          <div class="text-4xl font-bold text-gray-800 mb-4">{{ currentItem.content }}</div>
          <div class="text-lg text-gray-500">请匹配正确的拼音和释义</div>
        </div>

        <!-- 拼音选项 -->
        <div class="mb-6">
          <div class="text-sm font-medium text-gray-700 mb-3">选择拼音：</div>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="(pinyin, index) in shuffledPinyin"
              :key="'pinyin-' + index"
              :class="[
                'p-3 rounded-lg border-2 text-left transition-all',
                selectedPinyin === pinyin
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
                matchedPinyin === pinyin ? 'border-green-500 bg-green-50' : '',
                wrongPinyin === pinyin ? 'border-red-500 bg-red-50' : '',
              ]"
              @click="selectPinyin(pinyin)"
              :disabled="matchedPinyin === pinyin"
            >
              {{ pinyin }}
            </button>
          </div>
        </div>

        <!-- 释义选项 -->
        <div>
          <div class="text-sm font-medium text-gray-700 mb-3">选择释义：</div>
          <div class="grid grid-cols-1 gap-3">
            <button
              v-for="(meaning, index) in shuffledMeanings"
              :key="'meaning-' + index"
              :class="[
                'p-3 rounded-lg border-2 text-left transition-all',
                selectedMeaning === meaning
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
                matchedMeaning === meaning ? 'border-green-500 bg-green-50' : '',
                wrongMeaning === meaning ? 'border-red-500 bg-red-50' : '',
              ]"
              @click="selectMeaning(meaning)"
              :disabled="matchedMeaning === meaning"
            >
              {{ meaning }}
            </button>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="mt-6 text-center">
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedPinyin || !selectedMeaning"
            @click="submitAnswer"
          >
            确认匹配
          </el-button>
        </div>
      </div>

      <!-- 游戏结果 -->
      <div v-if="gameCompleted" class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-2xl font-bold text-gray-800 mb-2">游戏完成！</h3>
        <p class="text-gray-500 mb-6">你得了 {{ score }} 分</p>
        <div class="flex justify-center gap-4">
          <el-button type="primary" @click="resetGame">再来一局</el-button>
          <el-button @click="$emit('close')">返回</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../api/eduaiApi";
import type { IdiomGameData, IdiomGameItem } from "../api/types";

const emit = defineEmits(["close"]);

const selectedGradeLevel = ref("小学");
const selectedGrade = ref("一年级");
const gameCount = ref(10);
const loading = ref(false);
const gameStarted = ref(false);
const gameCompleted = ref(false);
const gameData = ref<IdiomGameData | null>(null);
const currentIndex = ref(0);
const score = ref(0);

const selectedPinyin = ref("");
const selectedMeaning = ref("");
const matchedPinyin = ref("");
const matchedMeaning = ref("");
const wrongPinyin = ref("");
const wrongMeaning = ref("");

const currentItem = computed(() => {
  if (!gameData.value?.items) return null;
  return gameData.value.items[currentIndex.value] || null;
});

const shuffledPinyin = ref<string[]>([]);
const shuffledMeanings = ref<string[]>([]);

const startGame = async () => {
  loading.value = true;
  try {
    gameData.value = await eduaiApi.generateIdiomGame({
      gradeLevel: selectedGradeLevel.value,
      grade: selectedGrade.value,
      count: gameCount.value,
    });
    gameStarted.value = true;
    gameCompleted.value = false;
    currentIndex.value = 0;
    score.value = 0;
    shuffleOptions();
  } catch (e) {
    ElMessage.error("生成游戏数据失败");
  } finally {
    loading.value = false;
  }
};

const shuffleOptions = () => {
  if (!gameData.value || !currentItem.value) return;

  // 打乱拼音选项
  const pinyinOptions = [
    currentItem.value.pinyin,
    ...gameData.value.distractorPinyin.slice(0, 3),
  ];
  shuffledPinyin.value = shuffleArray(pinyinOptions);

  // 打乱释义选项
  const meaningOptions = [
    currentItem.value.meaning,
    ...gameData.value.distractorMeanings.slice(0, 3),
  ];
  shuffledMeanings.value = shuffleArray(meaningOptions);

  // 重置选择
  selectedPinyin.value = "";
  selectedMeaning.value = "";
  matchedPinyin.value = "";
  matchedMeaning.value = "";
  wrongPinyin.value = "";
  wrongMeaning.value = "";
};

const shuffleArray = (array: string[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const selectPinyin = (pinyin: string) => {
  selectedPinyin.value = pinyin;
};

const selectMeaning = (meaning: string) => {
  selectedMeaning.value = meaning;
};

const submitAnswer = async () => {
  if (!currentItem.value) return;

  try {
    const isValid = await eduaiApi.validateIdiomPair({
      idiomId: currentItem.value.idiomId,
      pinyin: selectedPinyin.value,
      meaning: selectedMeaning.value,
    });

    if (isValid) {
      matchedPinyin.value = selectedPinyin.value;
      matchedMeaning.value = selectedMeaning.value;
      score.value += 10;
      ElMessage.success("匹配正确！+10分");

      // 延迟后进入下一题
      setTimeout(() => {
        if (currentIndex.value < gameData.value!.items.length - 1) {
          currentIndex.value++;
          shuffleOptions();
        } else {
          gameCompleted.value = true;
        }
      }, 1000);
    } else {
      // 显示错误
      if (selectedPinyin.value !== currentItem.value.pinyin) {
        wrongPinyin.value = selectedPinyin.value;
      }
      if (selectedMeaning.value !== currentItem.value.meaning) {
        wrongMeaning.value = selectedMeaning.value;
      }
      ElMessage.error("匹配错误，请重试");
    }
  } catch (e) {
    ElMessage.error("验证失败");
  }
};

const resetGame = () => {
  gameStarted.value = false;
  gameCompleted.value = false;
  gameData.value = null;
  currentIndex.value = 0;
  score.value = 0;
};
</script>
