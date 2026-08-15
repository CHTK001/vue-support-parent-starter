<template>
  <PanelPage title="人脸识别" subtitle="人脸检测 / 特征 / 比对 / 登记 / 识别 / 核验 与 face 分组配置" :loading="loading">
    <template #actions>
      <el-button v-role="'admin'" type="primary" size="small" plain :loading="saving" @click="saveConfig">
        保存配置
      </el-button>
      <el-button size="small" plain @click="refresh">刷新</el-button>
    </template>

    <!-- ===== 模型清单 ===== -->
    <el-collapse v-model="activeCollapse">
      <el-collapse-item title="可用模型" name="models">
        <div v-for="(models, group) in modelMap" :key="group" class="model-group">
          <span class="model-group__label">{{ group }}</span>
          <el-tag
            v-for="m in models"
            :key="m"
            size="small"
            effect="plain"
            class="model-group__tag"
          >
            {{ m }}
          </el-tag>
        </div>
      </el-collapse-item>

      <!-- ===== 测试工具 ===== -->
      <el-collapse-item title="检测测试" name="detect">
        <div class="test-grid">
          <div class="test-item">
            <div class="test-item__label">图片（检测 / 特征提取）</div>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="onImageChange"
            >
              <el-button size="small" plain>选择图片</el-button>
            </el-upload>
          </div>
          <div class="test-item">
            <el-button size="small" type="primary" plain :disabled="!detectImage" :loading="detecting" @click="doDetect">
              人脸检测
            </el-button>
            <el-button size="small" plain :disabled="!detectImage" :loading="extracting" @click="doFeature">
              特征提取
            </el-button>
          </div>
          <div v-if="detectImage" class="test-item test-item--wide">
            <img :src="detectPreview" class="preview-img" alt="检测图片" />
          </div>
          <div v-if="detectResult" class="test-result">
            <el-alert type="success" :closable="false">
              <template #title>
                检测到 <strong>{{ detectResult.count }}</strong> 张人脸
              </template>
              <div v-for="(f, i) in detectResult.faces" :key="i" class="face-box-row">
                [{{ f.box.labelName }}] x={{ f.box.x.toFixed(3) }} y={{ f.box.y.toFixed(3) }}
                w={{ f.box.width.toFixed(3) }} h={{ f.box.height.toFixed(3) }}
                conf={{ f.box.confidence.toFixed(3) }}
              </div>
            </el-alert>
          </div>
          <div v-if="featureResult" class="test-result">
            <el-alert type="info" :closable="false">
              <template #title>特征向量维度 {{ featureResult.feature.length }}</template>
              <div class="feature-preview">{{ featurePreview }}</div>
            </el-alert>
          </div>
        </div>
      </el-collapse-item>

      <!-- ===== 1:1 比对 ===== -->
      <el-collapse-item title="1:1 人脸比对" name="compare">
        <div class="test-grid">
          <div class="test-item">
            <div class="test-item__label">图 A</div>
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onImageAChange">
              <el-button size="small" plain>选择图 A</el-button>
            </el-upload>
            <img v-if="imageAPreview" :src="imageAPreview" class="preview-img preview-img--small" alt="图A" />
          </div>
          <div class="test-item">
            <div class="test-item__label">图 B</div>
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onImageBChange">
              <el-button size="small" plain>选择图 B</el-button>
            </el-upload>
            <img v-if="imageBPreview" :src="imageBPreview" class="preview-img preview-img--small" alt="图B" />
          </div>
          <div class="test-item">
            <el-button size="small" type="primary" plain :disabled="!imageA || !imageB" :loading="comparing" @click="doCompare">
              开始比对
            </el-button>
          </div>
          <div v-if="compareResult" class="test-result">
            <el-alert :type="compareResult.matched ? 'success' : 'warning'" :closable="false">
              <template #title>
                相似度 {{ compareResult.score.toFixed(4) }} — {{ compareResult.matched ? '同一人' : '非同一人' }}
              </template>
            </el-alert>
          </div>
        </div>
      </el-collapse-item>

      <!-- ===== 1:N 登记 / 识别 / 核验 ===== -->
      <el-collapse-item title="1:N 登记 / 识别 / 核验" name="identify">
        <div class="test-grid">
          <div class="test-item">
            <div class="test-item__label">人脸 ID</div>
            <el-input v-model="enrollId" size="small" placeholder="如 user001" style="width: 180px" />
          </div>
          <div class="test-item">
            <div class="test-item__label">登记图片</div>
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onEnrollImageChange">
              <el-button size="small" plain>选择登记图</el-button>
            </el-upload>
          </div>
          <div class="test-item">
            <el-button size="small" type="primary" plain :disabled="!enrollId || !enrollImage" :loading="enrolling" @click="doEnroll">
              登记入库
            </el-button>
          </div>
          <div class="test-item">
            <el-button size="small" type="warning" plain :disabled="!detectImage" :loading="identifying" @click="doIdentify">
              识别（用上面的检测图片）
            </el-button>
          </div>
          <div class="test-item">
            <el-button size="small" plain :disabled="!enrollId || !detectImage" :loading="verifying" @click="doVerify">
              核验 {{ enrollId || '' }}
            </el-button>
          </div>
          <div v-if="identifyResult" class="test-result">
            <el-alert :type="identifyResult.matched ? 'success' : 'info'" :closable="false">
              <template #title>
                {{ identifyResult.matched ? `识别成功: ${identifyResult.bestId}` : '未匹配到人脸' }}
                <span v-if="identifyResult.bestScore !== undefined"> score={{ identifyResult.bestScore.toFixed(4) }}</span>
              </template>
            </el-alert>
          </div>
          <div v-if="verifyResult !== null" class="test-result">
            <el-alert :type="verifyResult ? 'success' : 'warning'" :closable="false">
              <template #title>{{ verifyResult ? '核验通过（同一人）' : '核验失败（非同一人）' }}</template>
            </el-alert>
          </div>
        </div>
      </el-collapse-item>

      <!-- ===== 辅助能力 ===== -->
      <el-collapse-item title="辅助能力（动漫 / 超分 / 修复 / 属性 / 表情 / 关键点 / 质量 / 换脸）" name="aux">
        <div class="test-grid">
          <div class="test-item">
            <div class="test-item__label">辅助图片</div>
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onAuxImageChange">
              <el-button size="small" plain>选择图片</el-button>
            </el-upload>
          </div>
          <div class="test-item test-item--wide" v-if="auxPreview">
            <img :src="auxPreview" class="preview-img" alt="辅助图片" />
          </div>
          <div class="test-item">
            <div class="test-item__label">能力调用</div>
            <div class="aux-buttons">
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('liveness_model')" :loading="auxLoading" @click="doAux('liveness')">
                活体检测
              </el-button>
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('anime_enabled')" :loading="auxLoading" @click="doAux('anime')">
                动漫人脸
              </el-button>
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('super_resolution_enabled')" :loading="auxLoading" @click="doAux('super')">
                超分
              </el-button>
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('restore_enabled')" :loading="auxLoading" @click="doAux('restore')">
                修复
              </el-button>
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('attribute_enabled')" :loading="auxLoading" @click="doAux('attributes')">
                属性
              </el-button>
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('emotion_enabled')" :loading="auxLoading" @click="doAux('emotion')">
                表情
              </el-button>
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('landmark_enabled')" :loading="auxLoading" @click="doAux('landmark')">
                关键点
              </el-button>
              <el-button size="small" plain :disabled="!auxImage || !capEnabled('quality_enabled')" :loading="auxLoading" @click="doAux('quality')">
                质量
              </el-button>
              <el-button size="small" type="danger" plain :disabled="!auxImage || !capEnabled('deepfake_enabled')" :loading="auxLoading" @click="doAux('deepfake')">
                换脸检测
              </el-button>
            </div>
          </div>
          <div v-if="auxResultText" class="test-result">
            <el-alert type="info" :closable="false" :title="auxResultText" />
          </div>
          <div v-if="auxResultImage" class="test-result">
            <div class="test-item__label">处理结果</div>
            <img :src="auxResultImage" class="preview-img" alt="处理结果" />
          </div>
        </div>
      </el-collapse-item>

      <!-- ===== 辅助能力配置 ===== -->
      <el-collapse-item v-role="'admin'" title="辅助能力配置（开关 + 模型）" name="auxConfig">
        <div class="aux-config">
          <div v-for="cap in auxCaps" :key="cap.enabledField" class="aux-config__row">
            <span class="aux-config__name">{{ cap.label }}</span>
            <el-switch
              :model-value="enabledOf(cap.enabledField)"
              active-value="true"
              inactive-value="false"
              @update:model-value="(v: boolean | string) => setEnabled(cap.enabledField, v)"
            />
            <el-select
              :model-value="valueOf(cap.modelField)"
              size="small"
              placeholder="选择模型"
              style="width: 260px"
              @update:model-value="(v: string) => setModel(cap.modelField, v)"
            >
              <el-option v-for="m in modelsOf(cap.modelGroup)" :key="m" :label="m" :value="m" />
            </el-select>
          </div>
        </div>
      </el-collapse-item>

      <!-- ===== face 分组配置 ===== -->
      <el-collapse-item v-role="'admin'" title="face 分组配置" name="config">
        <el-form label-position="top" class="face-config-form">
          <el-row :gutter="16">
            <el-col v-for="item in configItems" :key="item.field" :span="12">
              <el-form-item :label="item.description">
                <el-switch
                  v-if="item.valueType === 'BOOLEAN'"
                  v-model="item.value"
                  active-value="true"
                  inactive-value="false"
                />
                <el-input-number
                  v-else-if="item.valueType === 'NUMBER'"
                  v-model="item.value"
                  :controls="false"
                  style="width: 100%"
                />
                <el-input v-else v-model="item.value" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-collapse-item>
    </el-collapse>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 人脸识别面板 —— 配置管理 + 测试工具
 * 对接 /api/ai/v2/face/config 与 /v2/face/* 推理接口。
 */
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { faceApi, type FaceConfigItem } from '../../api/face';
import PanelPage from '../RePanelPage.vue';

defineProps<{ id?: string }>();

const loading = ref(false);
const saving = ref(false);
const activeCollapse = ref(['detect', 'compare', 'identify']);

/** 模型清单 */
const modelMap = ref<Record<string, string[]>>({});

/** 配置项 */
const configItems = ref<FaceConfigItem[]>([]);

/** 辅助能力配置描述（开关字段 + 模型字段 + 模型清单分组 + 显示名） */
const auxCaps = [
  { label: '动漫人脸检测', enabledField: 'anime_enabled', modelField: 'anime_detector_model', modelGroup: 'animeDetector' },
  { label: '人脸超分', enabledField: 'super_resolution_enabled', modelField: 'super_resolution_model', modelGroup: 'superResolution' },
  { label: '人脸修复', enabledField: 'restore_enabled', modelField: 'restore_model', modelGroup: 'restore' },
  { label: '属性分析', enabledField: 'attribute_enabled', modelField: 'attribute_model', modelGroup: 'attribute' },
  { label: '表情识别', enabledField: 'emotion_enabled', modelField: 'emotion_model', modelGroup: 'emotion' },
  { label: '关键点定位', enabledField: 'landmark_enabled', modelField: 'landmark_model', modelGroup: 'landmark' },
  { label: '换脸检测', enabledField: 'deepfake_enabled', modelField: 'deepfake_model', modelGroup: 'deepfake' },
];

/** 读取配置项值 */
function valueOf(field: string): string {
  return configItems.value.find((c) => c.field === field)?.value ?? '';
}

/** 读取启用开关（未配置默认开启） */
function enabledOf(field: string): boolean {
  const v = configItems.value.find((c) => c.field === field)?.value;
  if (v === undefined || v === null || v === '') return true;
  return v === 'true';
}

/** 更新启用开关 */
function setEnabled(field: string, v: boolean | string) {
  const item = configItems.value.find((c) => c.field === field);
  if (item) item.value = String(v === true || v === 'true');
}

/** 更新模型 */
function setModel(field: string, v: string) {
  const item = configItems.value.find((c) => c.field === field);
  if (item) item.value = v;
}

/** 取模型清单分组 */
function modelsOf(group: string): string[] {
  return modelMap.value[group] ?? [];
}

/** 能力是否启用（辅助能力开关；活体以 liveness_model 是否配置为准） */
function capEnabled(field: string): boolean {
  if (field === 'liveness_model') return !!valueOf('liveness_model');
  return enabledOf(field);
}

/** 检测图片 */
const detectImage = ref<File | null>(null);
const detectPreview = ref('');
const detectResult = ref<{ count: number; faces: Array<{ box: { x: number; y: number; width: number; height: number; confidence: number; labelName: string }; live: boolean; liveScore: number }> } | null>(null);
const featureResult = ref<{ feature: number[] } | null>(null);
const detecting = ref(false);
const extracting = ref(false);

/** 1:1 比对 */
const imageA = ref<File | null>(null);
const imageB = ref<File | null>(null);
const imageAPreview = ref('');
const imageBPreview = ref('');
const compareResult = ref<{ score: number; matched: boolean } | null>(null);
const comparing = ref(false);

/** 1:N */
const enrollId = ref('');
const enrollImage = ref<File | null>(null);
const identifyResult = ref<{ matched: boolean; bestId?: string; bestScore?: number } | null>(null);
const verifyResult = ref<boolean | null>(null);
const enrolling = ref(false);
const identifying = ref(false);
const verifying = ref(false);

/** 辅助能力 */
const auxImage = ref<File | null>(null);
const auxPreview = ref('');
const auxLoading = ref(false);
const auxResultText = ref('');
const auxResultImage = ref('');

const onAuxImageChange = (f: { raw?: File }) => {
  const file = f.raw as File;
  if (!file) return;
  auxImage.value = file;
  auxResultText.value = '';
  auxResultImage.value = '';
  previewOf(file, (u) => (auxPreview.value = u));
};

/** 执行辅助能力 */
async function doAux(kind: 'liveness' | 'anime' | 'super' | 'restore' | 'attributes' | 'emotion' | 'landmark' | 'quality' | 'deepfake') {
  if (!auxImage.value) return;
  auxLoading.value = true;
  auxResultText.value = '';
  auxResultImage.value = '';
  try {
    const file = auxImage.value;
    switch (kind) {
      case 'liveness': {
        const r = await faceApi.liveness(file);
        auxResultText.value = `活体: ${r.live ? '是' : '否'}，分数 ${r.score.toFixed(4)}`;
        break;
      }
      case 'anime': {
        const r = await faceApi.animeDetect(file);
        auxResultText.value = `动漫人脸 ${r.count} 张` + (r.faces?.length ? `：` + r.faces.map((f) => `[${f.labelName ?? 'face'}] x=${f.x?.toFixed(3)} y=${f.y?.toFixed(3)}`).join('；') : '');
        break;
      }
      case 'super': {
        const blob = await faceApi.superResolution(file);
        auxResultImage.value = URL.createObjectURL(blob);
        auxResultText.value = `超分完成（${Math.round(blob.size / 1024)}KB）`;
        break;
      }
      case 'restore': {
        const blob = await faceApi.restore(file);
        auxResultImage.value = URL.createObjectURL(blob);
        auxResultText.value = `修复完成（${Math.round(blob.size / 1024)}KB）`;
        break;
      }
      case 'attributes': {
        const r = await faceApi.attributes(file);
        auxResultText.value = `属性: ${r.attributes || '无'}`;
        break;
      }
      case 'emotion': {
        const r = await faceApi.emotion(file);
        auxResultText.value = `表情: ${r.emotion || '无'}`;
        break;
      }
      case 'landmark': {
        const r = await faceApi.landmark(file);
        auxResultText.value = `关键点 ${Math.floor((r.points?.length ?? 0) / 2)} 个（${r.points?.slice(0, 8).map((v) => v.toFixed(2)).join(', ') ?? ''} …）`;
        break;
      }
      case 'quality': {
        const r = await faceApi.quality(file);
        if (!r.enabled) {
          auxResultText.value = '质量评估未启用';
        } else {
          auxResultText.value = `人脸 ${r.faceCount ?? 0} 个，占比 ${(r.faceAreaRatio ?? 0).toFixed(3)}，模糊 ${(r.blurScore ?? 0).toFixed(3)}，亮度 ${(r.brightness ?? 0).toFixed(3)}，${r.faceOk ? '合格' : '不合格'}`;
        }
        break;
      }
      case 'deepfake': {
        const r = await faceApi.deepfake(file);
        auxResultText.value = r.deepfake ? '疑似 AI 换脸' : '未检测到换脸';
        break;
      }
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    auxLoading.value = false;
  }
}

const featurePreview = computed(() => {
  if (!featureResult.value) return '';
  const arr = featureResult.value.feature;
  return arr.slice(0, 12).map((v) => v.toFixed(4)).join(', ') + (arr.length > 12 ? ' …' : '');
});

/** 生成图片预览 URL */
function previewOf(file: File, target: (url: string) => void) {
  const url = URL.createObjectURL(file);
  target(url);
}

const onImageChange = (f: { raw?: File }) => {
  const file = f.raw as File;
  if (!file) return;
  detectImage.value = file;
  detectResult.value = null;
  featureResult.value = null;
  previewOf(file, (u) => (detectPreview.value = u));
};
const onImageAChange = (f: { raw?: File }) => {
  const file = f.raw as File;
  if (!file) return;
  imageA.value = file;
  compareResult.value = null;
  previewOf(file, (u) => (imageAPreview.value = u));
};
const onImageBChange = (f: { raw?: File }) => {
  const file = f.raw as File;
  if (!file) return;
  imageB.value = file;
  compareResult.value = null;
  previewOf(file, (u) => (imageBPreview.value = u));
};
const onEnrollImageChange = (f: { raw?: File }) => {
  const file = f.raw as File;
  if (!file) return;
  enrollImage.value = file;
};

async function doDetect() {
  if (!detectImage.value) return;
  detecting.value = true;
  try {
    detectResult.value = await faceApi.detect(detectImage.value);
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    detecting.value = false;
  }
}

async function doFeature() {
  if (!detectImage.value) return;
  extracting.value = true;
  try {
    featureResult.value = await faceApi.feature(detectImage.value);
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    extracting.value = false;
  }
}

async function doCompare() {
  if (!imageA.value || !imageB.value) return;
  comparing.value = true;
  try {
    compareResult.value = await faceApi.compare(imageA.value, imageB.value);
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    comparing.value = false;
  }
}

async function doEnroll() {
  if (!enrollId.value || !enrollImage.value) return;
  enrolling.value = true;
  try {
    await faceApi.enroll(enrollId.value.trim(), enrollImage.value);
    ElMessage.success(`已登记 ${enrollId.value}`);
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    enrolling.value = false;
  }
}

async function doIdentify() {
  if (!detectImage.value) return;
  identifying.value = true;
  try {
    identifyResult.value = await faceApi.identify(detectImage.value);
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    identifying.value = false;
  }
}

async function doVerify() {
  if (!enrollId.value || !detectImage.value) return;
  verifying.value = true;
  try {
    const res = await faceApi.verify(enrollId.value.trim(), detectImage.value);
    verifyResult.value = res.matched;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    verifying.value = false;
  }
}

async function refresh() {
  loading.value = true;
  try {
    const [models, config] = await Promise.all([faceApi.models(), faceApi.config()]);
    modelMap.value = models;
    configItems.value = config.map((c) => ({ ...c, value: String(c.value ?? '') }));
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  saving.value = true;
  try {
    await faceApi.updateConfig(configItems.value.map((c) => ({ field: c.field, value: c.value })));
    ElMessage.success('人脸识别配置已保存并热生效');
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    saving.value = false;
  }
}

onMounted(refresh);
</script>

<style scoped>
.test-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}
.test-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.test-item--wide {
  width: 220px;
}
.test-item__label {
  font-size: 12px;
  color: var(--ai-text-muted);
}
.preview-img {
  width: 200px;
  border-radius: 8px;
  border: 1px solid var(--ai-card-border);
}
.preview-img--small {
  width: 120px;
}
.test-result {
  width: 100%;
}
.face-box-row {
  font-family: monospace;
  font-size: 12px;
  margin-top: 4px;
}
.feature-preview {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}
.model-group {
  margin-bottom: 8px;
}
.model-group__label {
  display: inline-block;
  width: 120px;
  font-size: 12px;
  color: var(--ai-text-muted);
  vertical-align: middle;
}
.model-group__tag {
  margin: 0 4px 4px 0;
}
.face-config-form {
  max-width: 900px;
}
.aux-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 560px;
}
.aux-config__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}
.aux-config__name {
  width: 140px;
  font-size: 13px;
  color: var(--ai-text-muted);
}
</style>
