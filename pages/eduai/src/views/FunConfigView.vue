<template>
  <div class="page-container">
    <!-- 上区：页头 + 统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <h1 class="page-header__title">趣味模块配置</h1>
        <p class="page-header__sub">维护学生端功能卡片的学段、路径、配色与启用状态</p>
      </div>

      <div class="stats-row">
        <div v-for="st in statCards" :key="st.title" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">{{ st.title }}</div>
            <div class="stat-card__value">{{ st.value }}</div>
            <div class="stat-card__hint">{{ st.hint }}</div>
          </div>
          <div class="stat-card__icon" :style="{ background: st.bg }">
            <el-icon :size="22"><component :is="st.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <div class="filter-field">
          <label class="filter-field__label">模块名称</label>
          <el-input v-model="searchModel.moduleName" clearable placeholder="名称关键字" :prefix-icon="Search" @keyup.enter="commitSearch" @clear="commitSearch" />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">模块编码</label>
          <el-input v-model="searchModel.moduleCode" clearable placeholder="如 idiom-game" :prefix-icon="Search" @keyup.enter="commitSearch" @clear="commitSearch" />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">适用学段</label>
          <el-select v-model="searchModel.funConfigGradeLevel" clearable placeholder="全部学段" style="width: 100%" @change="commitSearch">
            <el-option label="小学" value="PRIMARY" />
            <el-option label="初中" value="JUNIOR" />
            <el-option label="高中" value="SENIOR" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">状态</label>
          <el-select v-model="searchModel.enabled" clearable placeholder="全部状态" style="width: 100%" @change="commitSearch">
            <el-option label="已启用" :value="1" />
            <el-option label="已停用" :value="0" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="commitSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetSearch">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 配置列表 -->
    <el-card shadow="never" class="table-card">
      <div class="table-wrap">
        <ReTable
          :data="filtered"
          :loading="loading"
          row-key="configId"
          stripe
          :settings="{ border: false }"
          :config="{ toolbar: { enable: false } }"
        >
          <template #toolbar>
            <ReButton type="primary" icon="Plus" @click="showAddDialog">添加模块</ReButton>
            <ReButton icon="RefreshLeft" @click="loadConfigs">刷新</ReButton>
          </template>
          <ReTableColumn prop="funConfigGradeLevel" label="学段" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.funConfigGradeLevel" type="primary" effect="plain">
                {{ stageText(row.funConfigGradeLevel) }}
              </el-tag>
              <span v-else class="text-gray-400">通用</span>
            </template>
          </ReTableColumn>
          <ReTableColumn prop="moduleCode" label="模块编码" width="140" />
          <ReTableColumn prop="moduleName" label="模块名称" width="150" />
          <ReTableColumn prop="funConfigSubtitle" label="卡片副标题" min-width="180" show-overflow-tooltip />
          <ReTableColumn prop="moduleIcon" label="图标" width="80" align="center">
            <template #default="{ row }">
              <span class="text-lg">{{ row.moduleIcon }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn prop="modulePath" label="路径" width="150" show-overflow-tooltip />
          <ReTableColumn prop="enabled" label="状态" width="100" align="center">
            <template #default="{ row }">
              <ReSwitch
                v-model="row.enabled"
                :active-value="1"
                :inactive-value="0"

                inline-prompt
                active-text="启"
                inactive-text="停"
                @change="toggleEnabled(row)"
              />
            </template>
          </ReTableColumn>
          <ReTableColumn prop="sortOrder" label="排序" width="80" align="center" />
          <ReTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <ReButton icon="Edit" :show-text="false" type="primary" @click="editConfig(row)">编辑</ReButton>
              <ReButton icon="Delete" :show-text="false" type="danger" @click="deleteConfig(row)">删除</ReButton>
            </template>
          </ReTableColumn>
          <template #empty>
            <el-empty description="暂无趣味模块配置" :image-size="80" />
          </template>
        </ReTable>
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑模块' : '添加模块'" width="500px">
      <el-form :model="formData" label-width="90px">
        <el-form-item label="适用学段">
          <el-select v-model="formData.funConfigGradeLevel" clearable placeholder="留空 = 各学段通用（管理端模块）" style="width: 100%">
            <el-option label="小学" value="PRIMARY" />
            <el-option label="初中" value="JUNIOR" />
            <el-option label="高中" value="SENIOR" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块编码">
          <el-input v-model="formData.moduleCode" :disabled="isEdit" placeholder="如: idiom-game" />
        </el-form-item>
        <el-form-item label="模块名称">
          <el-input v-model="formData.moduleName" placeholder="如: 成语消消乐" />
        </el-form-item>
        <el-form-item label="卡片副标题">
          <el-input v-model="formData.funConfigSubtitle" placeholder="学生端卡片上的一句话，如: 拼成语·练思维" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.moduleDesc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="formData.moduleIcon" placeholder="emoji，如: 🀄" />
        </el-form-item>
        <el-form-item label="路径">
          <el-input v-model="formData.modulePath" placeholder="如: /edu/fun/idiom" />
        </el-form-item>
        <el-form-item label="图标配色">
          <div class="flex items-center gap-3">
            <el-color-picker v-model="formData.funConfigColor" />
            <span class="text-gray-400">→</span>
            <el-color-picker v-model="formData.funConfigColorTo" />
            <span class="text-xs text-gray-400">渐变起止色</span>
          </div>
        </el-form-item>
        <el-form-item label="未完成角标">
          <el-switch v-model="formData.funConfigShowBadge" :active-value="1" :inactive-value="0" />
          <span class="ml-2 text-xs text-gray-400">小学端会在卡片右上角显示剩余进度</span>
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber v-model="formData.sortOrder" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="配置JSON">
          <el-input v-model="formData.configJson" type="textarea" :rows="3" placeholder='{"url":"..."}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, ref, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { FunConfig } from "../api/types";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";

interface FunSearchModel {
  moduleName: string;
  moduleCode: string;
  funConfigGradeLevel: string | null;
  enabled: number | null;
}

const configs = ref<FunConfig[]>([]);
const loading = ref(false);

/** 模块清单是一次性拉回的全量数据，检索只在本地做，不产生请求 */
const searchModel = ref<FunSearchModel>(blankSearchModel());

/**
 * 空筛选条件。
 *
 * <p>此前本页用 ReTable 内置检索时，「重置」事件没有处理者，点了毫无反应
 * （由全站点击遍历发现）。改为外置筛选卡后，查询/重置按钮直接调用下方两个函数。</p>
 *
 * @returns 全空的筛选条件
 */
function blankSearchModel(): FunSearchModel {
  return { moduleName: "", moduleCode: "", funConfigGradeLevel: null, enabled: null };
}

/**
 * 查询按钮（本地过滤，输入即生效，这里显式承接事件）。
 *
 * <p>本页数据是一次性拉全量再本地过滤，所以按约定不需要发请求；
 * 写成显式函数而不是留空，是为了让「这个按钮为什么没有请求」在代码里有交代。</p>
 */
function commitSearch(): void {
  // no-op on purpose: filtering is live via the `filtered` computed
}

/** 重置筛选：清空条件，列表随之恢复全量。 */
function resetSearch(): void {
  searchModel.value = blankSearchModel();
}

/**
 * 学段码转中文
 *
 * @param v 学段码
 * @returns 中文名
 */
function stageText(v?: string | null): string {
  if (v === "PRIMARY") return "小学";
  if (v === "JUNIOR") return "初中";
  if (v === "SENIOR") return "高中";
  return v ?? "";
}

const filtered = computed(() => {
  const name = String(searchModel.value.moduleName ?? "").trim().toLowerCase();
  const code = String(searchModel.value.moduleCode ?? "").trim().toLowerCase();
  const level = String(searchModel.value.funConfigGradeLevel ?? "");
  const enabled = searchModel.value.enabled;
  return configs.value.filter(
    (c) =>
      (!name || String(c.moduleName ?? "").toLowerCase().includes(name)) &&
      (!code || String(c.moduleCode ?? "").toLowerCase().includes(code)) &&
      (!level || c.funConfigGradeLevel === level) &&
      (typeof enabled !== "number" || c.enabled === enabled),
  );
});

const statCards = computed(() => {
  const total = configs.value.length;
  const enabled = configs.value.filter((c) => c.enabled === 1).length;
  const disabled = total - enabled;
  const covered = new Set(configs.value.map((c) => c.funConfigGradeLevel).filter(Boolean)).size;
  return [
    { title: "模块总数", value: total, hint: "全部趣味模块", icon: "Grid", bg: "var(--el-color-primary-light-9)" },
    { title: "已启用", value: enabled, hint: "学生端可见", icon: "CircleCheck", bg: "var(--el-color-success-light-9)" },
    { title: "已停用", value: disabled, hint: "仅本页可见", icon: "CircleClose", bg: "var(--el-color-danger-light-9)" },
    { title: "覆盖学段", value: covered, hint: "小学/初中/高中", icon: "School", bg: "var(--el-color-info-light-9)" },
  ];
});

const dialogVisible = ref(false);
const isEdit = ref(false);
const formData = ref<Partial<FunConfig>>({});

onMounted(() => {
  loadConfigs();
});

const loadConfigs = async () => {
  loading.value = true;
  try {
    configs.value = await eduaiApi.listAllFunConfigs();
  } catch (e) {
    message.error("加载配置失败");
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  formData.value = {
    moduleCode: "",
    moduleName: "",
    moduleDesc: "",
    moduleIcon: "",
    modulePath: "",
    enabled: 1,
    sortOrder: 0,
    configJson: "{}",
  };
  dialogVisible.value = true;
};

const editConfig = (config: FunConfig) => {
  isEdit.value = true;
  formData.value = { ...config };
  dialogVisible.value = true;
};

/**
 * 保存（新增/编辑共用）。
 *
 * <p>此前**零校验直接提交**：空表单点「保存」后端照单全收，列表里多出一条
 * 无编码、无名称、无路径的空模块（全站点击遍历发现的 FAIL）。
 * 编码是本地唯一键（`toggleEnabled`/`deleteConfig` 都按 `moduleCode` 定位），
 * 名称是删除确认与卡片主标题的数据源，缺失会让后续操作全部对不上号，
 * 因此前置拦截必填项；配置 JSON 同样前置校验，避免落一条解析不了的脏配置。</p>
 */
const saveConfig = async () => {
  const f = formData.value;
  if (!f.moduleCode?.trim()) {
    message.warning("请填写模块编码");
    return;
  }
  if (!f.moduleName?.trim()) {
    message.warning("请填写模块名称");
    return;
  }
  if (!f.modulePath?.trim()) {
    message.warning("请填写路径");
    return;
  }
  if (f.configJson?.trim()) {
    try {
      JSON.parse(f.configJson);
    } catch {
      message.warning("配置 JSON 格式不正确");
      return;
    }
  }
  try {
    await eduaiApi.saveFunConfig(f);
    message.success("保存成功");
    dialogVisible.value = false;
    loadConfigs();
  } catch (e) {
    message.error("保存失败");
  }
};

const toggleEnabled = async (config: FunConfig) => {
  try {
    await eduaiApi.toggleFunConfig(config.moduleCode, config.enabled);
    message.success("更新成功");
  } catch (e) {
    message.error("更新失败");
    config.enabled = config.enabled === 1 ? 0 : 1;
  }
};

const deleteConfig = async (config: FunConfig) => {
  try {
    await ElMessageBox.confirm(`确定要删除模块「${config.moduleName}」吗？`, "提示", {
      type: "warning",
    });
    await eduaiApi.deleteFunConfig(config.configId);
    message.success("删除成功");
    loadConfigs();
  } catch (e) {
    if (e !== "cancel") {
      message.error("删除失败");
    }
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--el-bg-color-page);
}
.top-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.page-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.page-header__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 170px;
  padding: 12px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}
.stat-card__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}
.stat-card__value {
  font-size: 24px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-card__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.stat-card__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--el-radius-lg, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
}
.filter-card,
.table-card {
  border-radius: var(--el-radius-lg, 12px);
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 12px 16px;
  align-items: end;
}
.filter-field__label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.filter-actions {
  display: flex;
  gap: 8px;
}
.table-wrap {
  /* 固定容器高度（同昆虫库）：消除滚动条液面高度随滚动反复重算的抖动。
     493 = 1440x980 实测值：表格卡正好贴到页面容器底边，不再留底空。
     min-height 取 300：更小视口下改走页面滚动，不把固定高度顶破。
     contain: layout size 让 ReTable 走 height:100%。 */
  height: calc(100vh - 493px);
  min-height: 300px;
  contain: layout size;
  overflow: hidden;
}
@media (max-width: 1100px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>