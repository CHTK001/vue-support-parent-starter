<template>
  <RePage data-page="reid" fill title="人脸重识别" subtitle="跨摄像头 / 跨帧追踪同一个人：观测画面自动归并轨迹，以图搜人确认身份">
    <template #actions>
      <el-button :disabled="busy" @click="loadTracks">
        <el-icon><Refresh /></el-icon>
        刷新轨迹
      </el-button>
      <el-button :disabled="busy || !tracks.length" type="danger" plain @click="clearTracks">
        <el-icon><Delete /></el-icon>
        清空轨迹
      </el-button>
    </template>

    <!-- 能力未就绪：先引导配置，别让用户对着空列表猜 -->
    <el-alert
      v-if="!available"
      type="warning"
      show-icon
      :closable="false"
      class="mb-4"
      title="人脸重识别能力未启用"
      description="请到「系统设置 → 人脸重识别配置」中选择人脸检测模型与人脸特征模型，保存后立即生效。"
    >
      <template #default>
        <el-button link type="primary" @click="gotoSettings">前往配置</el-button>
      </template>
    </el-alert>

    <div class="reid-grid">
      <!-- ============ 左：观测 / 以图搜人 ============ -->
      <section class="reid-panel">
        <el-tabs v-model="tab">
          <!-- ---------- 观测 ---------- -->
          <el-tab-pane label="观测画面" name="observe">
            <div class="reid-stage">
              <!-- 空态 -->
              <div v-if="!previewUrl" class="reid-drop" @click="pickImage">
                <el-icon :size="42" class="reid-drop-icon"><Picture /></el-icon>
                <p class="reid-drop-title">上传一帧监控画面</p>
                <p class="reid-drop-desc">同一个人在不同摄像头出现时，会自动并入同一条轨迹</p>
                <el-button type="primary" :disabled="busy || !available" @click.stop="pickImage">
                  <el-icon><FolderOpened /></el-icon>选择图片
                </el-button>
              </div>

              <!-- 预览 -->
              <div v-else class="reid-canvas">
                <img :src="previewUrl" class="reid-img" alt="待观测画面" />
                <div v-if="observing" class="reid-mask">
                  <ReLoader loading size="lg" :fullscreen="false" />
                  <span class="reid-mask-text">正在观测…</span>
                </div>
                <div v-else-if="observeResult" class="reid-found">
                  <div class="reid-found-title">
                    <el-icon><Aim /></el-icon>
                    观测完成
                  </div>
                  <div class="reid-found-sub">
                    检出 {{ observeResult.faceCount }} 张脸 ·
                    命中既有轨迹 {{ observeResult.matched }} · 新建轨迹 {{ observeResult.newTracks }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 观测参数 -->
            <el-form v-if="previewUrl" label-width="96px" class="reid-form">
              <el-form-item label="摄像头">
                <el-input v-model="cameraId" placeholder="留空则用配置的默认摄像头" />
              </el-form-item>
              <el-form-item label="来源帧">
                <el-input v-model="sourceId" placeholder="留空则自动生成" />
              </el-form-item>
              <el-form-item label="纬度">
                <el-input-number v-model="lat" :precision="7" :step="0.0001" :controls="false"
                                 placeholder="非必填，如 31.2304" style="width: 220px" />
              </el-form-item>
              <el-form-item label="经度">
                <el-input-number v-model="lng" :precision="7" :step="0.0001" :controls="false"
                                 placeholder="非必填，如 121.4737" style="width: 220px" />
              </el-form-item>
            </el-form>

            <div v-if="previewUrl" class="reid-actions">
              <el-button :disabled="busy || !available" @click="pickImage">
                <el-icon><FolderOpened /></el-icon>更换图片
              </el-button>
              <el-button
                type="primary"
                :loading="observing"
                :disabled="busy || !available"
                @click="runObserve"
              >
                <el-icon><Aim /></el-icon>观测并归并轨迹
              </el-button>
            </div>

            <!-- 观测命中的轨迹 -->
            <div v-if="observedTracks.length" class="reid-observed">
              <div class="reid-section-title">本帧涉及的轨迹</div>
              <div v-for="t in observedTracks" :key="t.trackId" class="reid-track-chip">
                <span class="reid-track-id">{{ t.trackId }}</span>
                <el-tag v-if="t.crossCamera" type="warning" size="small">跨镜</el-tag>
                <el-tag type="info" size="small">{{ t.observations }} 次</el-tag>
                <span class="reid-track-cams">{{ t.cameraIds.join(" → ") }}</span>
              </div>
            </div>
          </el-tab-pane>

          <!-- ---------- 以图搜人 ---------- -->
          <el-tab-pane label="以图搜人" name="search">
            <div class="reid-stage">
              <div v-if="!searchPreviewUrl" class="reid-drop" @click="pickSearchImage">
                <el-icon :size="42" class="reid-drop-icon"><Search /></el-icon>
                <p class="reid-drop-title">上传一张人脸照片</p>
                <p class="reid-drop-desc">在已有轨迹中检索最相似的人</p>
                <el-button type="primary" :disabled="busy || !available" @click.stop="pickSearchImage">
                  <el-icon><FolderOpened /></el-icon>选择图片
                </el-button>
              </div>
              <div v-else class="reid-canvas">
                <img :src="searchPreviewUrl" class="reid-img" alt="待检索人脸" />
                <div v-if="searching" class="reid-mask">
                  <ReLoader loading size="lg" :fullscreen="false" />
                  <span class="reid-mask-text">正在检索…</span>
                </div>
              </div>
            </div>

            <div v-if="searchPreviewUrl" class="reid-actions">
              <el-button :disabled="busy" @click="pickSearchImage">
                <el-icon><FolderOpened /></el-icon>更换图片
              </el-button>
              <el-button type="primary" :loading="searching" :disabled="busy || !available" @click="runSearchFromButton">
                <el-icon><Search /></el-icon>检索轨迹
              </el-button>
            </div>

            <div v-if="searchHits.length" class="reid-hits">
              <div class="reid-section-title">命中 {{ searchHits.length }} 条轨迹</div>
              <div v-for="hit in searchHits" :key="hit.trackId" class="reid-hit">
                <div class="reid-hit-head">
                  <span class="reid-track-id">{{ hit.trackId }}</span>
                  <el-tag v-if="hit.summary.crossCamera" type="warning" size="small">跨镜</el-tag>
                  <el-tag type="success" size="small">相似度 {{ hit.similarity.toFixed(3) }}</el-tag>
                </div>
                <div class="reid-hit-meta">
                  摄像头 {{ hit.summary.cameraIds.join(" → ") }} ·
                  {{ hit.summary.observations }} 次观测 ·
                  {{ formatTime(hit.summary.lastSeen) }}
                </div>
              </div>
            </div>
            <el-empty
              v-else-if="searchDone && !searchHits.length"
              description="没有命中任何轨迹（可能还没有观测记录，或相似度未达阈值）"
              :image-size="70"
            />
          </el-tab-pane>
        </el-tabs>
      </section>

      <!-- ============ 右：轨迹列表 ============ -->
      <section class="reid-panel">
        <div class="reid-list-head">
          <span class="font-bold">跨帧轨迹</span>
          <div class="reid-list-filters">
            <el-checkbox v-model="crossOnly" @change="loadTracks">只看跨镜</el-checkbox>
            <el-input
              v-model="cameraFilter"
              placeholder="按摄像头过滤"
              size="small"
              style="width: 160px"
              @keyup.enter="loadTracks"
              @clear="loadTracks"
            />
          </div>
        </div>

        <el-table
          :data="tracks"
          size="small"
          stripe
          height="100%"
          empty-text="暂无轨迹，先在「观测画面」上传一帧"
        >
          <el-table-column prop="trackId" label="轨迹 ID" width="150" />
          <el-table-column label="摄像头" min-width="160">
            <template #default="{ row }">
              <span class="reid-track-cams">{{ row.cameraIds.join(" → ") }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="observations" label="观测" width="70" />
          <el-table-column label="跨镜" width="70">
            <template #default="{ row }">
              <el-tag v-if="row.crossCamera" type="warning" size="small">是</el-tag>
              <span v-else class="reid-muted">否</span>
            </template>
          </el-table-column>
          <el-table-column label="最近出现" width="160">
            <template #default="{ row }">{{ formatTime(row.lastSeen) }}</template>
          </el-table-column>
        </el-table>
      </section>
    </div>
  </RePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { useRouter } from "vue-router";
import { Aim, Delete, FolderOpened, Picture, Refresh, Search } from "@element-plus/icons-vue";
import RePage from "@/components/re/RePage.vue";
import ReLoader from "@repo/ui/re-loader";
import { apiService } from "@/services/ApiService";
import type { ReidHit, ReidObserveResult, ReidTrack } from "@/services/modules/reid.api";

/**
 * 人脸重识别页面。
 *
 * <p>两个区块对应两种用法：</p>
 * <ul>
 *   <li><b>观测画面</b>——上传一帧监控画面，后端检测人脸并归并进轨迹；同一个人在不同
 *       摄像头出现时会自动并入同一条轨迹（这是 Re-ID 的核心价值）。</li>
 *   <li><b>以图搜人</b>——拿一张人脸照片在已有轨迹里检索，确认「这个人是谁、走过哪里」。</li>
 * </ul>
 *
 * <p><b>配置不在这里。</b>检测/特征模型与轨迹归并参数统一在
 * 「系统设置 → 人脸重识别配置」（{@code reid-config}）里改。原先本页还有一个「配置」
 * 页签，通过 {@code /v2/reid/config} 直接读写 reid 分组 —— 那是同一批字段的第二个入口，
 * 与设置中心各自保存会互相覆盖（本仓库其它能力一律「配置只留设置中心一处」，
 * 见 {@code SPLIT_GROUPS} 的注释）。</p>
 *
 * <p>轨迹按账号隔离（后端口径），页面只显示当前登录账号的观测记录。</p>
 */

const router = useRouter();

/** 当前标签页。 */
const tab = ref("observe");

/** 观测图片预览地址。 */
const previewUrl = ref("");

/** 检索图片预览地址。 */
const searchPreviewUrl = ref("");

/** 观测结果。 */
const observeResult = ref<ReidObserveResult | null>(null);

/** 观测命中的轨迹（点开列表用）。 */
const observedTracks = ref<ReidTrack[]>([]);

/** 以图搜人命中。 */
const searchHits = ref<ReidHit[]>([]);

/** 是否已执行过检索（区分「没搜过」与「搜了没结果」）。 */
const searchDone = ref(false);

/** 轨迹列表。 */
const tracks = ref<ReidTrack[]>([]);

/** 只看跨镜轨迹。 */
const crossOnly = ref(false);

/** 摄像头过滤。 */
const cameraFilter = ref("");

/** 摄像头标识。 */
const cameraId = ref("");

/** 来源帧标识。 */
const sourceId = ref("");

/**
 * 观测位置：纬度 / 经度（非必填）。
 *
 * <p>很多摄像头没有定位能力，因此**不做必填校验**；留空即落库为 NULL。
 * 位置只作为这条观测的附加信息存储（数据库 DECIMAL 列），
 * <b>不参与特征向量</b> —— 向量里永远只有人脸特征。</p>
 */
const lat = ref<number | null>(null);
const lng = ref<number | null>(null);

/** 能力是否就绪。 */
const available = ref(false);

/** 观测中。 */
const observing = ref(false);

/** 检索中。 */
const searching = ref(false);

/** 上次观测的图片文件。 */
const lastObserveFile = ref<File | Blob | null>(null);

/** 上次检索的图片文件。 */
const lastSearchFile = ref<File | Blob | null>(null);

/** 任一操作进行中。 */
const busy = computed(() => observing.value || searching.value);

/**
 * 跳到设置中心的「人脸重识别配置」页。
 *
 * <p>配置只在设置中心维护一处；能力未启用时给一个直达入口，
 * 免得用户自己去层层翻菜单。</p>
 */
function gotoSettings() {
  router.push({ name: "SystemSettings", params: { tab: "reid-config" } });
}

/**
 * 时间戳格式化。
 *
 * @param ts 毫秒时间戳
 * @returns 本地时间字符串
 */
function formatTime(ts: number): string {
  if (!ts) {
    return "-";
  }
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 选择观测图片。 */
function pickImage() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    lastObserveFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    observeResult.value = null;
    observedTracks.value = [];
  };
  input.click();
}

/** 选择检索图片。 */
function pickSearchImage() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    searchPreviewUrl.value = URL.createObjectURL(file);
    searchHits.value = [];
    searchDone.value = false;
    await runSearch(file);
  };
  input.click();
}

/**
 * 观测当前图片。
 *
 * <p>观测后顺带刷新轨迹列表：观测会新建或更新轨迹，
 * 不刷新的话用户会看到「刚观测完，列表还是空的」。</p>
 */
async function runObserve() {
  const file = lastObserveFile.value;
  if (!file) {
    message.warning("请先选择图片");
    return;
  }
  observing.value = true;
  try {
    const result = await apiService.observeReid(
      file,
      cameraId.value || undefined,
      sourceId.value || undefined,
      undefined,
      lat.value,
      lng.value,
    );
    observeResult.value = result;
    // 拉取本帧涉及的轨迹详情，供下方展示
    const details = await Promise.all(result.trackIds.map((id) => apiService.getReidTrack(id)));
    observedTracks.value = details.filter((t): t is ReidTrack => !!t);
    message.success(`观测完成：检出 ${result.faceCount} 张脸`);
    await loadTracks();
  } catch (e) {
    message.error(`观测失败：${(e as Error)?.message ?? e}`);
  } finally {
    observing.value = false;
  }
}

/**
 * 按钮触发的检索（复用上次选中的图片）。
 *
 * <p>单独包一层而不是直接绑 {@code runSearch}：{@code @click} 会把 MouseEvent
 * 传给处理函数，而 {@code runSearch(file?)} 的参数是图片 —— 事件对象会被误当图片用。
 * </p>
 */
async function runSearchFromButton() {
  await runSearch();
}

/**
 * 检索轨迹。
 *
 * @param file 待检索图片；不传则用上次选的
 */
async function runSearch(file?: File | Blob) {
  const target = file ?? lastSearchFile.value;
  if (!target) {
    return;
  }
  lastSearchFile.value = target;
  searching.value = true;
  searchDone.value = true;
  try {
    searchHits.value = await apiService.searchReid(target);
  } catch (e) {
    message.error(`检索失败：${(e as Error)?.message ?? e}`);
  } finally {
    searching.value = false;
  }
}

/** 加载轨迹列表。 */
async function loadTracks() {
  try {
    tracks.value = await apiService.listReidTracks({
      cameraId: cameraFilter.value || undefined,
      crossOnly: crossOnly.value,
    });
  } catch (e) {
    message.error(`加载轨迹失败：${(e as Error)?.message ?? e}`);
  }
}

/** 清空轨迹。 */
async function clearTracks() {
  try {
    const cleared = await apiService.clearReidTracks();
    message.success(`已清空 ${cleared} 条轨迹`);
    await loadTracks();
  } catch (e) {
    message.error(`清空失败：${(e as Error)?.message ?? e}`);
  }
}

/** 初始化。 */
onMounted(async () => {
  try {
    const stats = await apiService.getReidStats();
    available.value = stats.available;
  } catch {
    available.value = false;
  }
  await loadTracks();
});
</script>

<style scoped>
.reid-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
}

@media (max-width: 1100px) {
  .reid-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.reid-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
}

.reid-stage {
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.reid-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  cursor: pointer;
  text-align: center;
}

.reid-drop:hover .reid-drop-title {
  color: var(--el-color-primary);
}

.reid-drop-icon {
  color: var(--el-text-color-secondary);
}

.reid-drop-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.reid-drop-desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.reid-canvas {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.reid-img {
  max-width: 100%;
  max-height: 420px;
  object-fit: contain;
}

.reid-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 70%, transparent);
}

.reid-mask-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.reid-found {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
  border: 1px solid var(--el-border-color-lighter);
}

.reid-found-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
}

.reid-found-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.reid-form {
  margin-top: 12px;
}

.reid-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.reid-section-title {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.reid-track-chip,
.reid-hit {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px;
  margin-bottom: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  font-size: 13px;
}

.reid-hit {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.reid-hit-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reid-hit-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.reid-track-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.reid-track-cams {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.reid-muted {
  color: var(--el-text-color-secondary);
}

.reid-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
}

.reid-list-filters {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
