<template>
  <el-dialog
    v-model="visibleProxy"
    title="在线搜索软件"
    width="80%"
    class="online-search-dialog"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <!-- 搜索栏 -->
    <div class="search-header">
      <div class="search-box">
        <el-input
          v-model="keyword"
          placeholder="搜索 Docker 镜像..."
          size="large"
          clearable
          class="search-input"
          @input="onKeywordInput"
          @keyup.enter="onKeywordInput"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" class="search-icon" />
          </template>
        </el-input>
      </div>
      <div class="search-tip">
        <IconifyIconOnline icon="ri:information-line" />
        <span>从 Docker Hub 检索镜像，输入关键词开始搜索</span>
      </div>
    </div>

    <!-- 搜索结果 - 卡片模式 -->
    <ScTable
      ref="tableRef"
      :url="softwareApi.searchOnlineSoftware"
      :params="tableParams"
      row-key="systemSoftCode"
      table-name="docker-soft-online-search"
      layout="card"
      :col-size="3"
      :row-size="2"
      :page-size="6"
      :auto-load="false"
    >
      <template #empty>
        <div class="empty-state">
          <IconifyIconOnline icon="ri:search-eye-line" class="empty-icon" />
          <p>输入关键词搜索 Docker 镜像</p>
        </div>
      </template>

      <template #default="{ row }">
        <div class="soft-card">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="card-icon">
              <IconifyIconOnline
                :icon="row.systemSoftIcon || 'ri:docker-line'"
              />
            </div>
            <div class="card-title">
              <h3 class="name">{{ row.systemSoftName }}</h3>
              <span class="code">{{ row.systemSoftCode }}</span>
            </div>
            <el-tag
              v-if="row.systemSoftIsOfficial === 1"
              type="warning"
              size="small"
              effect="light"
              >官方</el-tag
            >
          </div>

          <!-- 镜像信息 -->
          <div class="card-image">
            <IconifyIconOnline icon="ri:box-3-line" class="label-icon" />
            <span class="image-name">{{
              row.systemSoftDockerImage || "-"
            }}</span>
          </div>

          <!-- 统计信息 -->
          <div class="card-stats">
            <div class="stat-item">
              <IconifyIconOnline icon="ri:star-line" />
              <span>{{ formatNumber(row.systemSoftStarCount) }}</span>
            </div>
            <div class="stat-item">
              <IconifyIconOnline icon="ri:download-2-line" />
              <span>{{ formatNumber(row.systemSoftPullCount) }}</span>
            </div>
          </div>

          <!-- 描述 -->
          <p class="card-desc">{{ row.systemSoftDesc || "暂无描述" }}</p>

          <!-- 操作按钮 -->
          <div class="card-actions">
            <el-button
              type="primary"
              size="small"
              @click="handleImportSingle(row)"
            >
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />添加到软件库
            </el-button>
          </div>
        </div>
      </template>
    </ScTable>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visibleProxy = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { softwareApi } from "@/api/docker";
import ScTable from "@repo/components/ScTable/index.vue";
import { message } from "@repo/utils";
import { computed, reactive, ref } from "vue";

interface Props {
  visible: boolean;
}
interface Emits {
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const tableRef = ref();
const keyword = ref("");
const saving = ref(false);
let timer: any = null;

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit("update:visible", v),
});

const tableParams = reactive({ keyword: "", page: 1, size: 10 });

function onOpen() {
  // 初次打开不自动搜索，等待输入
}

function onKeywordInput() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const kw = keyword.value.trim();
    tableParams.keyword = kw;
    if (!kw) return; // 关键词为空不触发请求
    tableRef.value?.reload?.(tableParams, 1);
  }, 400);
}

// 格式化数字
function formatNumber(num?: number) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// 单个导入
async function handleImportSingle(row: any) {
  try {
    saving.value = true;
    const payload = {
      items: [
        {
          systemSoftName: row.systemSoftName,
          systemSoftCode: row.systemSoftCode,
          systemSoftDesc: row.systemSoftDesc,
          systemSoftIcon: row.systemSoftIcon,
          systemSoftDockerImage: row.systemSoftDockerImage,
          systemSoftStatus: 1,
        },
      ],
    };
    const res = await softwareApi.importOnlineSoftware(payload);
    if (res.code === "00000") {
      message(`已添加 ${row.systemSoftName} 到软件库`, { type: "success" });
      emit("success");
    } else {
      message(res.msg || "添加失败", { type: "error" });
    }
  } catch (e) {
    message("添加失败", { type: "error" });
  } finally {
    saving.value = false;
  }
}

async function handleImport() {
  const selection = tableRef.value?.getSelection?.() || [];
  if (!selection.length) return message("请选择要导入的软件", { type: "warning" });
  try {
    saving.value = true;
    const payload = {
      items: selection.map((s: any) => ({
        systemSoftName: s.systemSoftName,
        systemSoftCode: s.systemSoftCode,
        systemSoftDesc: s.systemSoftDesc,
        systemSoftIcon: s.systemSoftIcon,
        systemSoftDockerImage: s.systemSoftDockerImage,
        systemSoftStatus: 1,
      })),
    };
    const res = await softwareApi.importOnlineSoftware(payload);
    if (res.code === "00000") {
      message(res.msg || "已异步提交保存任务", { type: "success" });
      emit("success");
      visibleProxy.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (e) {
    message("保存失败（接口不可用）", { type: "error" });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* 搜索头部 */
.search-header {
  margin-bottom: 16px;
}

.search-box {
  max-width: 500px;
  margin: 0 auto 12px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  padding: 4px 16px;
}

.search-icon {
  font-size: 18px;
  color: var(--el-text-color-placeholder);
}

.search-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--el-text-color-placeholder);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* 卡片样式 */
.soft-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.soft-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-5);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2496ed 0%, #1a7bc9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.card-title {
  flex: 1;
  min-width: 0;
}

.card-title .name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-title .code {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.card-image {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  margin-bottom: 8px;
}

.label-icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
}

.image-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.card-desc {
  flex: 1;
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
