<template>
  <div class="p-4">
    <h3 class="text-xl font-bold text-gray-800 mb-3">趣味模块配置</h3>

    <!-- 配置列表 -->
    <ReTable
      :data="filtered"
      :loading="loading"
      :search="searchConfig"
      v-model:search-model="searchModel"
      row-key="configId"
      :pagination="false"
      border
      stripe
      style="width: 100%"
      @refresh="loadConfigs"
      @search="commitSearch"
      @search-reset="resetSearch"
    >
      <template #toolbar>
        <ReButton type="primary" icon="Plus" @click="showAddDialog">添加模块</ReButton>
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
    </ReTable>

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
import { eduaiApi } from "../api/eduaiApi";
import type { FunConfig } from "../api/types";
import type { ReTableSearchConfig } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";

const configs = ref<FunConfig[]>([]);
const loading = ref(false);

/** 模块清单是一次性拉回的全量数据，检索只在本地做，不产生请求 */
const searchModel = ref<Record<string, unknown>>(blankSearchModel());

/**
 * 空检索条件。
 *
 * <p>抽成函数是因为「重置」要用它：ReTable 的检索按钮发 {@code search} / {@code search-reset}
 * 两个事件，由页面自己决定行为。此前本页两个事件都没绑，{@code search} 按钮碰巧看起来有效
 * （因为过滤是 computed，输入即生效），但「重置」点了**毫无反应** —— 可见可点的按钮
 * 没有任何交代，属于真实缺陷（由全站点击遍历发现）。</p>
 *
 * @returns 全空的检索条件
 */
function blankSearchModel(): Record<string, unknown> {
  return { moduleName: "", moduleCode: "", funConfigGradeLevel: null, enabled: null };
}

/**
 * 检索按钮（本地过滤，输入即生效，这里显式承接事件）。
 *
 * <p>本页数据是一次性拉全量再本地过滤，所以按约定不需要发请求；
 * 写成显式函数而不是留空，是为了让「这个按钮为什么没有请求」在代码里有交代。</p>
 */
function commitSearch(): void {
  // no-op on purpose: filtering is live via the `filtered` computed
}

/**
 * 重置检索：清空条件，列表随之恢复全量。
 *
 * <p>之前没有这个处理，ReTable 发出的 {@code search-reset} 无人接收。</p>
 */
function resetSearch(): void {
  searchModel.value = blankSearchModel();
}

const searchConfig: ReTableSearchConfig = {
  title: "模块检索",
  filters: [
    {
      key: "funConfigGradeLevel",
      label: "适用学段",
      type: "select",
      options: [
        { label: "小学", value: "PRIMARY" },
        { label: "初中", value: "JUNIOR" },
        { label: "高中", value: "SENIOR" },
      ],
    },
    { key: "moduleName", label: "模块名称", placeholder: "名称关键字" },
    { key: "moduleCode", label: "模块编码", placeholder: "如 idiom-game" },
    {
      key: "enabled",
      label: "状态",
      type: "select",
      options: [
        { label: "已启用", value: 1 },
        { label: "已停用", value: 0 },
      ],
    },
  ],
};

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
