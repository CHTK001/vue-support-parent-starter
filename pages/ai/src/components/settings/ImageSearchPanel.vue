<template>
  <PanelPage title="以图搜图" subtitle="上传图片从人脸特征库检索 TopK 命中（基于 FacePipeline）" :loading="loading">
    <template #actions>
      <el-button size="small" @click="resetAll">清空</el-button>
    </template>

    <el-tabs v-model="activeTab" class="ai-fade-in">
      <!-- 以图搜图 -->
      <el-tab-pane label="以图搜图" name="search">
        <div class="ai-section">
          <el-upload :auto-upload="false" :show-file-list="false" :on-change="onSearchFile" accept="image/*">
            <div class="ai-upload-area ai-upload-area--large">
              <el-icon class="ai-upload-area__icon"><Search /></el-icon>
              <div class="ai-upload-area__title">上传查询图片</div>
              <div class="ai-upload-area__desc">自动从人脸特征库中检索相似图片（TopK）</div>
            </div>
          </el-upload>

          <div v-if="queryPreview" class="img-preview">
            <img :src="queryPreview" class="img-preview__img" alt="查询图片" />
            <div class="img-preview__meta">
              <el-tag size="small" type="info">查询图片</el-tag>
              <span class="img-preview__name">{{ queryFile?.name }}</span>
            </div>
          </div>

          <div v-if="searchResult" class="result-section">
            <el-alert
              :type="searchResult.matched ? 'success' : 'info'"
              :closable="false"
              class="result-alert"
            >
              <template #title>
                <strong v-if="searchResult.matched">
                  匹配成功：{{ searchResult.bestId }}（相似度 {{ searchResult.bestScore?.toFixed(4) }}）
                </strong>
                <strong v-else>未匹配到人脸（请确认库非空）</strong>
              </template>
            </el-alert>

            <div v-if="searchResult.hits && searchResult.hits.length > 0" class="hits-grid">
              <el-card v-for="(hit, i) in searchResult.hits" :key="i" class="hit-card" shadow="hover">
                <div class="hit-card__head">
                  <el-tag size="small" effect="dark">#{{ i + 1 }}</el-tag>
                  <span class="hit-card__id">{{ hit.id }}</span>
                  <el-tag size="small" type="success">相似度 {{ hit.score?.toFixed(4) }}</el-tag>
                </div>
                <div v-if="hit.metadata && Object.keys(hit.metadata).length > 0" class="hit-card__meta">
                  <span v-for="(v, k) in hit.metadata" :key="k" class="meta-chip">
                    {{ k }}: {{ v }}
                  </span>
                </div>
                <div v-if="hit.content" class="hit-card__content">{{ hit.content }}</div>
              </el-card>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 入库 -->
      <el-tab-pane label="入库" name="enroll">
        <div class="ai-section">
          <el-input v-model="enrollId" placeholder="输入图片 ID（例：user_001）" clearable />
          <el-input v-model="enrollMeta" type="textarea" :rows="2" placeholder='可选元数据 JSON：{"name":"张三","tag":"员工"}' />
          <el-upload :auto-upload="false" :show-file-list="false" :on-change="onEnrollFile" accept="image/*">
            <div class="ai-upload-area">
              <el-icon class="ai-upload-area__icon"><Upload /></el-icon>
              <div class="ai-upload-area__title">上传图片入库</div>
              <div class="ai-upload-area__desc">提取人脸特征 → 写入向量库</div>
            </div>
          </el-upload>

          <el-alert v-if="enrollResult" :type="enrollResult.success ? 'success' : 'error'" :closable="false">
            <template #title>{{ enrollResult.success ? '入库成功' : '入库失败' }}：{{ enrollResult.id }}</template>
          </el-alert>
        </div>
      </el-tab-pane>

      <!-- 1:1 比对 -->
      <el-tab-pane label="1:1 比对" name="compare">
        <div class="ai-section">
          <div class="compare-row">
            <div class="compare-item">
              <el-upload :auto-upload="false" :show-file-list="false" :on-change="(f: {raw?: File} | File) => onCompareFile(f, 'a')" accept="image/*">
                <div class="ai-upload-area ai-upload-area--small">
                  <el-icon class="ai-upload-area__icon"><Picture /></el-icon>
                  <div class="ai-upload-area__title">图片 A</div>
                </div>
              </el-upload>
              <img v-if="comparePreviewA" :src="comparePreviewA" class="img-preview__img img-preview__img--small" alt="图A" />
            </div>
            <div class="compare-vs">VS</div>
            <div class="compare-item">
              <el-upload :auto-upload="false" :show-file-list="false" :on-change="(f: {raw?: File} | File) => onCompareFile(f, 'b')" accept="image/*">
                <div class="ai-upload-area ai-upload-area--small">
                  <el-icon class="ai-upload-area__icon"><Picture /></el-icon>
                  <div class="ai-upload-area__title">图片 B</div>
                </div>
              </el-upload>
              <img v-if="comparePreviewB" :src="comparePreviewB" class="img-preview__img img-preview__img--small" alt="图B" />
            </div>
          </div>

          <div v-if="compareResult" class="ai-result-card">
            <div class="ai-result-card__label">相似度</div>
            <div class="ai-result-card__value">
              {{ compareResult.score.toFixed(4) }}
              <el-tag :type="compareResult.matched ? 'success' : 'danger'" size="large">
                {{ compareResult.matched ? '同一人' : '非同一人' }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * ImageSearchPanel —— 以图搜图面板
 *
 * 三大功能：
 * 1. 以图搜图（上传查询图 → 库中检索 TopK 命中）
 * 2. 入库（上传图 + ID → 写入人脸特征向量库）
 * 3. 1:1 比对（两张图相似度）
 *
 * 底层复用 FacePipeline 的 identify/enroll/compare（基于人脸特征）
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Upload, Picture } from '@element-plus/icons-vue';
import PanelPage from '../RePanelPage.vue';
import { imageSearchApi, type ImageSearchResult } from '@pages/ai/api';

defineProps<{ id?: string }>();

const loading = ref(false);
const activeTab = ref<'search' | 'enroll' | 'compare'>('search');

// 搜索
const queryFile = ref<File | null>(null);
const queryPreview = ref('');
const searchResult = ref<ImageSearchResult | null>(null);

const onSearchFile = (f: { raw?: File } | File) => {
  const file = (f as { raw?: File }).raw || (f as File);
  queryFile.value = file;
  queryPreview.value = URL.createObjectURL(file);
  searchResult.value = null;
  runSearch();
};

const runSearch = async () => {
  if (!queryFile.value) return;
  loading.value = true;
  try {
    searchResult.value = await imageSearchApi.searchByImage(queryFile.value);
  } catch (e) {
    ElMessage.error('以图搜图失败：' + (e as Error).message);
    searchResult.value = null;
  } finally {
    loading.value = false;
  }
};

// 入库
const enrollId = ref('');
const enrollMeta = ref('');
const enrollFile = ref<File | null>(null);
const enrollResult = ref<{ success: boolean; id: string } | null>(null);

const onEnrollFile = async (f: { raw?: File } | File) => {
  const file = (f as { raw?: File }).raw || (f as File);
  if (!enrollId.value.trim()) {
    ElMessage.warning('请先输入图片 ID');
    return;
  }
  enrollFile.value = file;
  loading.value = true;
  try {
    await imageSearchApi.enroll(enrollId.value.trim(), file, enrollMeta.value || undefined);
    enrollResult.value = { success: true, id: enrollId.value.trim() };
    ElMessage.success(`入库成功：${enrollId.value.trim()}`);
  } catch (e) {
    enrollResult.value = { success: false, id: enrollId.value.trim() };
    ElMessage.error('入库失败：' + (e as Error).message);
  } finally {
    loading.value = false;
  }
};

// 1:1 比对
const compareFileA = ref<File | null>(null);
const compareFileB = ref<File | null>(null);
const comparePreviewA = ref('');
const comparePreviewB = ref('');
const compareResult = ref<{ score: number; matched: boolean } | null>(null);

const onCompareFile = (f: { raw?: File } | File, which: 'a' | 'b') => {
  const file = (f as { raw?: File }).raw || (f as File);
  if (which === 'a') {
    compareFileA.value = file;
    comparePreviewA.value = URL.createObjectURL(file);
  } else {
    compareFileB.value = file;
    comparePreviewB.value = URL.createObjectURL(file);
  }
  if (compareFileA.value && compareFileB.value) {
    runCompare();
  }
};

const runCompare = async () => {
  if (!compareFileA.value || !compareFileB.value) return;
  loading.value = true;
  try {
    compareResult.value = await imageSearchApi.compareTwo(compareFileA.value, compareFileB.value);
  } catch (e) {
    ElMessage.error('比对失败：' + (e as Error).message);
    compareResult.value = null;
  } finally {
    loading.value = false;
  }
};

const resetAll = () => {
  queryFile.value = null;
  queryPreview.value = '';
  searchResult.value = null;
  enrollId.value = '';
  enrollMeta.value = '';
  enrollFile.value = null;
  enrollResult.value = null;
  compareFileA.value = null;
  compareFileB.value = null;
  comparePreviewA.value = '';
  comparePreviewB.value = '';
  compareResult.value = null;
};
</script>

<style scoped>
.ai-section {
  display: flex;
  flex-direction: column;
  gap: var(--ai-spacing-md);
  padding-top: var(--ai-spacing-md);
}

/* 上传区 */
.ai-upload-area {
  border: 2px dashed var(--ai-card-border);
  border-radius: var(--ai-card-radius);
  padding: var(--ai-spacing-xl);
  text-align: center;
  background: var(--ai-bg-overlay);
  transition: all var(--ai-transition-normal);
  cursor: pointer;
}
.ai-upload-area:hover {
  border-color: var(--ai-primary);
  background: rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}
.ai-upload-area--large {
  padding: var(--ai-spacing-2xl);
}
.ai-upload-area--small {
  padding: var(--ai-spacing-md);
}
.ai-upload-area__icon {
  font-size: 48px;
  color: var(--ai-primary);
  margin-bottom: var(--ai-spacing-sm);
}
.ai-upload-area--small .ai-upload-area__icon {
  font-size: 32px;
}
.ai-upload-area__title {
  font-size: var(--ai-text-base);
  font-weight: 600;
  color: var(--ai-text-primary);
  margin-bottom: 4px;
}
.ai-upload-area__desc {
  font-size: var(--ai-text-xs);
  color: var(--ai-text-muted);
}

/* 图片预览 */
.img-preview {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-md);
  padding: var(--ai-spacing-sm);
  background: var(--ai-bg-overlay);
  border-radius: var(--ai-radius-md);
}
.img-preview__img {
  max-height: 200px;
  max-width: 240px;
  border-radius: var(--ai-radius-sm);
  box-shadow: var(--ai-shadow-sm);
}
.img-preview__img--small {
  max-height: 140px;
  max-width: 180px;
}
.img-preview__meta {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-sm);
  flex: 1;
  min-width: 0;
}
.img-preview__name {
  font-size: var(--ai-text-xs);
  color: var(--ai-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 结果区 */
.result-section {
  display: flex;
  flex-direction: column;
  gap: var(--ai-spacing-md);
}
.result-alert {
  margin-bottom: var(--ai-spacing-sm);
}

/* 命中卡片网格 */
.hits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--ai-spacing-md);
}
.hit-card {
  transition: all var(--ai-transition-normal);
}
.hit-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ai-shadow-lg);
}
.hit-card__head {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-sm);
  margin-bottom: var(--ai-spacing-sm);
}
.hit-card__id {
  font-weight: 600;
  font-size: var(--ai-text-base);
  color: var(--ai-text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hit-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.meta-chip {
  font-size: var(--ai-text-xs);
  padding: 2px 8px;
  background: var(--ai-bg-overlay);
  border-radius: var(--ai-radius-sm);
  color: var(--ai-text-secondary);
}
.hit-card__content {
  font-size: var(--ai-text-xs);
  color: var(--ai-text-muted);
  margin-top: 4px;
}

/* 1:1 比对 */
.compare-row {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-md);
}
.compare-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--ai-spacing-sm);
}
.compare-vs {
  font-size: var(--ai-text-2xl);
  font-weight: 700;
  color: var(--ai-primary);
  background: var(--ai-bg-overlay);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 结果卡 */
.ai-result-card {
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-card-radius);
  padding: var(--ai-spacing-lg);
  box-shadow: var(--ai-shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-lg);
}
.ai-result-card__label {
  font-size: var(--ai-text-xs);
  font-weight: 600;
  color: var(--ai-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ai-result-card__value {
  font-size: var(--ai-text-2xl);
  font-weight: 700;
  color: var(--ai-text-primary);
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-md);
}
</style>
