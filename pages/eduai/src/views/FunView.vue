<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">趣味学习</h2>
      <p class="text-gray-500 mt-1">探索有趣的互动学习模块</p>
    </div>

    <!-- 模块卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- 昆虫识图 -->
      <div
        v-if="isModuleEnabled('INSECT')"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="openModule('INSECT')"
      >
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🦗</span>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-800">昆虫识图</h3>
            <p class="text-sm text-gray-500">交互式3D昆虫图鉴</p>
          </div>
        </div>
        <p class="text-gray-600 text-sm mb-4">
          认识63种昆虫的身体构造、生活史与生态角色。每一只虫都是代码实时生成的3D模型。
        </p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">63种昆虫 · 14个目</span>
          <el-button type="primary" size="small">开始探索</el-button>
        </div>
      </div>

      <!-- 成语消消乐 -->
      <div
        v-if="isModuleEnabled('IDIOM_GAME')"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="openModule('IDIOM_GAME')"
      >
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🏆</span>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-800">成语消消乐</h3>
            <p class="text-sm text-gray-500">成语配对挑战</p>
          </div>
        </div>
        <p class="text-gray-600 text-sm mb-4">
          根据学段生成的成语配对游戏，测试你的成语知识。匹配拼音和释义，挑战高分！
        </p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">小学 · 初中 · 高中</span>
          <el-button type="warning" size="small">开始挑战</el-button>
        </div>
      </div>

      <!-- 成语库 -->
      <div
        v-if="isModuleEnabled('IDIOM_BANK')"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="openModule('IDIOM_BANK')"
      >
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📚</span>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-800">成语库</h3>
            <p class="text-sm text-gray-500">管理成语数据</p>
          </div>
        </div>
        <p class="text-gray-600 text-sm mb-4">
          管理成语数据和学段映射，支持按学段、难度筛选成语。
        </p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">20+成语</span>
          <el-button size="small">管理</el-button>
        </div>
      </div>
    </div>

    <!-- 当前打开的模块 -->
    <div v-if="currentModule" class="mt-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">{{ currentModule.moduleName }}</h3>
          <el-button text @click="currentModule = null">
            <span class="text-gray-500">✕ 关闭</span>
          </el-button>
        </div>
        <div class="p-4">
          <!-- 根据模块类型显示不同内容 -->
          <iframe
            v-if="currentModule.moduleCode === 'INSECT'"
            :src="getModuleConfig('INSECT')?.url || 'https://insect-world.pages.dev'"
            :width="getModuleConfig('INSECT')?.width || '100%'"
            :height="getModuleConfig('INSECT')?.height || '800px'"
            frameborder="0"
            class="rounded-lg"
          />
          <IdiomGameView
            v-else-if="currentModule.moduleCode === 'IDIOM_GAME'"
            @close="currentModule = null"
          />
          <IdiomBankView
            v-else-if="currentModule.moduleCode === 'IDIOM_BANK'"
            @close="currentModule = null"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { eduaiApi } from "../api/eduaiApi";
import type { FunConfig } from "../api/types";
import IdiomGameView from "./IdiomGameView.vue";
import IdiomBankView from "./IdiomBankView.vue";

const configs = ref<FunConfig[]>([]);
const currentModule = ref<FunConfig | null>(null);

onMounted(async () => {
  try {
    configs.value = await eduaiApi.listAllFunConfigs();
  } catch (e) {
    console.error("加载趣味模块配置失败", e);
  }
});

const isModuleEnabled = (code: string) => {
  return configs.value.some((c) => c.moduleCode === code && c.enabled === 1);
};

const openModule = (code: string) => {
  currentModule.value = configs.value.find((c) => c.moduleCode === code) || null;
};

const getModuleConfig = (code: string) => {
  const config = configs.value.find((c) => c.moduleCode === code);
  if (config?.configJson) {
    try {
      return JSON.parse(config.configJson);
    } catch {
      return null;
    }
  }
  return null;
};
</script>
