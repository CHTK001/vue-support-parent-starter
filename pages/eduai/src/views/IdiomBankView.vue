<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold text-gray-800">成语库</h3>
      <el-button @click="$emit('close')">返回</el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="flex gap-4 mb-6">
      <el-select v-model="filterGradeLevel" placeholder="学段" clearable class="w-32">
        <el-option label="小学" value="小学" />
        <el-option label="初中" value="初中" />
        <el-option label="高中" value="高中" />
      </el-select>
      <el-select v-model="filterDifficulty" placeholder="难度" clearable class="w-32">
        <el-option label="1-简单" :value="1" />
        <el-option label="2-较易" :value="2" />
        <el-option label="3-中等" :value="3" />
        <el-option label="4-较难" :value="4" />
        <el-option label="5-困难" :value="5" />
      </el-select>
      <el-button type="primary" @click="loadIdioms">查询</el-button>
    </div>

    <!-- 成语列表 -->
    <el-table :data="idioms" stripe border style="width: 100%">
      <el-table-column prop="idiomContent" label="成语" width="120" />
      <el-table-column prop="idiomPinyin" label="拼音" width="180" />
      <el-table-column prop="idiomMeaning" label="释义" min-width="200" show-overflow-tooltip />
      <el-table-column prop="idiomSource" label="出处" width="150" show-overflow-tooltip />
      <el-table-column prop="idiomDifficulty" label="难度" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getDifficultyType(row.idiomDifficulty)" size="small">
            {{ row.idiomDifficulty }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="idiomTags" label="标签" width="120">
        <template #default="{ row }">
          <el-tag
            v-for="tag in (row.idiomTags || '').split(',')"
            :key="tag"
            size="small"
            class="mr-1"
          >
            {{ tag }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" @click="viewDetail(row)">详情</el-button>
          <el-button text size="small" type="danger" @click="deleteIdiom(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="loadIdioms"
        @current-change="loadIdioms"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="成语详情" width="600px">
      <div v-if="currentIdiom" class="space-y-4">
        <div class="text-center py-4">
          <div class="text-4xl font-bold text-gray-800 mb-2">{{ currentIdiom.idiomContent }}</div>
          <div class="text-lg text-gray-500">{{ currentIdiom.idiomPinyin }}</div>
        </div>
        <el-divider />
        <div>
          <div class="text-sm font-medium text-gray-700 mb-1">释义</div>
          <div class="text-gray-600">{{ currentIdiom.idiomMeaning }}</div>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-700 mb-1">出处</div>
          <div class="text-gray-600">{{ currentIdiom.idiomSource }}</div>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-700 mb-1">例句</div>
          <div class="text-gray-600">{{ currentIdiom.idiomExample }}</div>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-700 mb-1">近义词</div>
          <div class="text-gray-600">{{ currentIdiom.idiomSynonyms || '无' }}</div>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-700 mb-1">反义词</div>
          <div class="text-gray-600">{{ currentIdiom.idiomAntonyms || '无' }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { eduaiApi } from "../api/eduaiApi";
import type { Idiom } from "../api/types";

const emit = defineEmits(["close"]);

const idioms = ref<Idiom[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const filterGradeLevel = ref("");
const filterDifficulty = ref<number | null>(null);

const detailVisible = ref(false);
const currentIdiom = ref<Idiom | null>(null);

onMounted(() => {
  loadIdioms();
});

const loadIdioms = async () => {
  loading.value = true;
  try {
    const result = await eduaiApi.listIdioms({
      gradeLevel: filterGradeLevel.value || undefined,
      count: pageSize.value,
    });
    idioms.value = result || [];
    total.value = result?.length || 0;
  } catch (e) {
    ElMessage.error("加载成语列表失败");
  } finally {
    loading.value = false;
  }
};

const getDifficultyType = (difficulty: number) => {
  const types: Record<number, string> = {
    1: "success",
    2: "success",
    3: "warning",
    4: "danger",
    5: "danger",
  };
  return types[difficulty] || "info";
};

const viewDetail = (idiom: Idiom) => {
  currentIdiom.value = idiom;
  detailVisible.value = true;
};

const deleteIdiom = async (idiom: Idiom) => {
  try {
    await ElMessageBox.confirm(`确定要删除成语「${idiom.idiomContent}」吗？`, "提示", {
      type: "warning",
    });
    await eduaiApi.deleteIdiom(idiom.idiomId);
    ElMessage.success("删除成功");
    loadIdioms();
  } catch (e) {
    if (e !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};
</script>
