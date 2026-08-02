<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import {
  deleteDefinition,
  pageDefinitions,
  saveDefinition,
  toggleStatus,
} from "@/api/spider";
import type { SpiderDefinition, SpiderDefinitionSaveRequest } from "@/types/spider";
import type { PageResult } from "@/types/spider";

/**
 * 列表状态。
 */
const list = ref<SpiderDefinition[]>([]);
const total = ref(0);
const loading = ref(false);

const query = reactive({
  pageNo: 1,
  pageSize: 20,
  keyword: "",
});

/**
 * 加载列表。
 */
async function load() {
  loading.value = true;
  try {
    const page = await pageDefinitions(
      query.pageNo,
      query.pageSize,
      query.keyword || undefined
    );
    list.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

const isEmpty = computed(() => !loading.value && list.value.length === 0);

/**
 * 表单对话框。
 */
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const formRef = ref();
const submitting = ref(false);

const initialForm = (): SpiderDefinitionSaveRequest => ({
  spiderCode: "",
  spiderName: "",
  spiderEntryUrl: "",
  spiderMaxDepth: 1,
  spiderMaxPages: 10,
  spiderStatus: 1,
  spiderDescription: "",
});

const form = reactive<SpiderDefinitionSaveRequest>(initialForm());

const rules = {
  spiderCode: [
    { required: true, message: "请输入爬虫编码", trigger: "blur" },
    {
      pattern: /^[A-Za-z0-9_-]+$/,
      message: "仅支持字母、数字、下划线、横线",
      trigger: "blur",
    },
  ],
  spiderName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  spiderEntryUrl: [
    { required: true, message: "请输入入口 URL", trigger: "blur" },
    { type: "url", message: "URL 格式不正确", trigger: "blur" },
  ],
  spiderMaxDepth: [
    { required: true, message: "请输入最大深度", trigger: "blur" },
  ],
  spiderMaxPages: [
    { required: true, message: "请输入最大页数", trigger: "blur" },
  ],
};

/**
 * 打开新增对话框。
 */
function openCreate() {
  dialogMode.value = "create";
  Object.assign(form, initialForm());
  dialogVisible.value = true;
}

/**
 * 打开编辑对话框。
 */
function openEdit(row: SpiderDefinition) {
  dialogMode.value = "edit";
  Object.assign(form, {
    ...initialForm(),
    ...row,
  });
  dialogVisible.value = true;
}

/**
 * 提交保存。
 */
async function submit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await saveDefinition({ ...form });
    ElMessage.success(dialogMode.value === "create" ? "创建成功" : "更新成功");
    dialogVisible.value = false;
    await load();
  } finally {
    submitting.value = false;
  }
}

/**
 * 删除。
 */
async function remove(row: SpiderDefinition) {
  if (!row.spiderCode) return;
  await ElMessageBox.confirm(
    `确认删除「${row.spiderName}」？该操作不可恢复`,
    "删除确认",
    { type: "warning" }
  );
  await deleteDefinition(row.spiderCode);
  ElMessage.success("已删除");
  await load();
}

/**
 * 切换启停。
 */
async function toggle(row: SpiderDefinition) {
  if (!row.spiderCode) return;
  const target: 0 | 1 = row.spiderStatus === 1 ? 0 : 1;
  await toggleStatus(row.spiderCode, target);
  ElMessage.success(target === 1 ? "已启用" : "已禁用");
  await load();
}

onMounted(load);
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="query.keyword"
          placeholder="按编码 / 名称搜索"
          clearable
          style="width: 240px"
          @keyup.enter="() => { query.pageNo = 1; load() }"
          @clear="() => { query.pageNo = 1; load() }"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="() => { query.pageNo = 1; load() }">搜索</el-button>
      </div>
      <div style="display: flex; gap: 8px">
        <el-button :icon="Refresh" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">
          新增爬虫定义
        </el-button>
      </div>
    </div>

    <div class="card-elplus" style="padding: 0">
      <el-table
        v-loading="loading"
        :data="list"
        :empty-text="isEmpty ? '暂无数据，点击右上角“新增爬虫定义”创建' : ''"
        style="width: 100%"
        row-key="spiderId"
      >
        <el-table-column prop="spiderCode" label="编码" min-width="140" />
        <el-table-column prop="spiderName" label="名称" min-width="180" />
        <el-table-column prop="spiderEntryUrl" label="入口 URL" min-width="240" show-overflow-tooltip />
        <el-table-column prop="spiderMaxDepth" label="最大深度" width="100" align="center" />
        <el-table-column prop="spiderMaxPages" label="最大页数" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span
              class="status-tag"
              :class="row.spiderStatus === 1 ? 'is-success' : 'is-idle'"
            >
              {{ row.spiderStatus === 1 ? "启用" : "禁用" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link @click="openEdit(row)">编辑</el-button>
            <el-button size="small" link @click="toggle(row)">
              {{ row.spiderStatus === 1 ? "禁用" : "启用" }}
            </el-button>
            <el-button size="small" link type="danger" @click="remove(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="display: flex; justify-content: flex-end; padding: 12px 16px">
        <el-pagination
          v-model:current-page="query.pageNo"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="() => { query.pageNo = 1; load() }"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增爬虫定义' : '编辑爬虫定义'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
        label-position="right"
      >
        <el-form-item label="爬虫编码" prop="spiderCode">
          <el-input
            v-model="form.spiderCode"
            placeholder="例如：REAL-GITEE"
            :disabled="dialogMode === 'edit'"
          />
        </el-form-item>
        <el-form-item label="名称" prop="spiderName">
          <el-input v-model="form.spiderName" placeholder="例如：真实采集-Gitee" />
        </el-form-item>
        <el-form-item label="入口 URL" prop="spiderEntryUrl">
          <el-input
            v-model="form.spiderEntryUrl"
            placeholder="https://example.com"
          />
        </el-form-item>
        <el-form-item label="最大深度" prop="spiderMaxDepth">
          <el-input-number v-model="form.spiderMaxDepth" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="最大页数" prop="spiderMaxPages">
          <el-input-number v-model="form.spiderMaxPages" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.spiderStatus">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.spiderDescription"
            type="textarea"
            :rows="3"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>