<<<<<<< HEAD
<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <el-input
            v-model="keyword"
            placeholder="搜索爬虫编码 / 名称"
            clearable
            style="width: 280px"
            @keyup.enter="reload"
          />
          <el-tooltip content="查询" placement="top">
            <el-button :icon="Search" circle @click="reload" />
          </el-tooltip>
        </div>
        <el-tooltip content="新建" placement="top">
          <el-button :icon="Plus" type="primary" circle @click="openCreate" />
        </el-tooltip>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table
        v-loading="loading"
        :data="list"
        :row-key="'spiderCode'"
        empty-text="暂无数据，点击右上角“新建”创建"
        stripe
      >
        <el-table-column prop="spiderCode" label="编码" min-width="140" />
        <el-table-column prop="spiderName" label="名称" min-width="180" />
        <el-table-column
          prop="spiderEntryUrl"
          label="入口 URL"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column prop="spiderMaxDepth" label="最大深度" width="100" align="center" />
        <el-table-column prop="spiderMaxPages" label="最大页数" width="100" align="center" />
        <el-table-column label="定时" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.spiderScheduleEnable === 1 ? 'warning' : 'info'"
              size="small"
            >
              {{ row.spiderScheduleEnable === 1 ? "已启用" : "未启用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="代理池" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.spiderProxyPoolEnable === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.spiderProxyPoolEnable === 1 ? "已启用" : "未启用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.spiderStatus === 1 ? 'success' : 'info'" size="small">
              {{ row.spiderStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
<el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              type="success"
              :icon="VideoPlay"
              size="small"
              @click="runSpider(row)"
            >
              执行
            </el-button>
            <el-button
              link
              :type="row.spiderStatus === 1 ? 'warning' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.spiderStatus === 1 ? "禁用" : "启用" }}
            </el-button>
            <el-popconfirm
              :title="`确认删除 ${row.spiderCode} 吗？`"
              @confirm="remove(row)"
            >
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="() => { pageNo = 1; load(); }"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.spiderId ? '编辑爬虫定义' : '新建爬虫定义'"
      width="720"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" label-width="100">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="编码" required>
              <el-input
                v-model="form.spiderCode"
                :disabled="!!form.spiderId"
                placeholder="建议英文，业务唯一"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="form.spiderName" placeholder="例如：新闻门户采集" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="入口 URL" required>
          <el-input v-model="form.spiderEntryUrl" placeholder="https://example.com" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最大深度" required>
              <el-input-number v-model="form.spiderMaxDepth" :min="0" :max="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大页数" required>
              <el-input-number v-model="form.spiderMaxPages" :min="1" :max="100000" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="定时启用">
              <el-switch
                v-model="form.spiderScheduleEnable"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代理池启用">
              <el-switch
                v-model="form.spiderProxyPoolEnable"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="form.spiderScheduleEnable === 1" label="Cron 表达式">
          <ReCron v-model="form.spiderScheduleCron" />
        </el-form-item>

        <el-form-item
          v-if="form.spiderProxyPoolEnable === 1"
          label="代理池"
        >
          <el-select
            v-model="form.spiderProxyPoolCode"
            placeholder="选择已配置的代理池"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="p in poolOptions"
              :key="p.poolCode"
              :label="`${p.poolName} (${p.poolCode}, ${p.proxies?.length ?? 0} 节点)`"
              :value="p.poolCode"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="公共 Header">
          <el-input
            v-model="form.spiderHeaders"
            type="textarea"
            :rows="2"
            placeholder='{"User-Agent":"Mozilla/5.0 ..."}'
          />
        </el-form-item>

        <el-form-item label="公共 Cookie">
          <el-input
            v-model="form.spiderCookies"
            type="textarea"
            :rows="2"
            placeholder='[{"name":"sid","value":"abc","domain":".example.com"}]'
          />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.spiderDescription"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Search, VideoPlay } from "@element-plus/icons-vue";
import { definitionApi, executionApi, proxyPoolApi } from "@/api";
import type { SpiderDefinition, SpiderProxyPool, PageResult } from "@/types/spider";
import ReCron from "@repo/ui/re-cron";

const keyword = ref("");
const pageNo = ref(1);
const pageSize = ref(20);
const list = ref<SpiderDefinition[]>([]);
const total = ref(0);
const loading = ref(false);
const saving = ref(false);

const dialogVisible = ref(false);

const initialForm = (): SpiderDefinition => ({
  spiderCode: "",
  spiderName: "",
  spiderEntryUrl: "",
  spiderMaxDepth: 1,
  spiderMaxPages: 50,
  spiderStatus: 1,
  spiderScheduleEnable: 0,
  spiderScheduleCron: "",
  spiderProxyPoolEnable: 0,
  spiderProxyPoolCode: "",
  spiderHeaders: "",
  spiderCookies: "",
  spiderDescription: "",
});

const form = reactive<SpiderDefinition>(initialForm());

/**
 * 代理池下拉选项（用于表单选择绑定）。
 */
const poolOptions = ref<SpiderProxyPool[]>([]);

/**
 * 加载分页列表。
 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const kw = keyword.value.trim();
    const page = (await definitionApi.page(
      pageNo.value,
      pageSize.value,
      kw || undefined
    )) as PageResult<SpiderDefinition>;
    list.value = page.records ?? [];
    total.value = page.total ?? 0;
=======
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
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
  } finally {
    loading.value = false;
  }
}

<<<<<<< HEAD
/**
 * 刷新列表（关键字变化后重置页码）。
 */
function reload(): void {
  pageNo.value = 1;
  void load();
}

function openCreate(): void {
=======
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
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
  Object.assign(form, initialForm());
  dialogVisible.value = true;
}

<<<<<<< HEAD
function openEdit(row: SpiderDefinition): void {
  Object.assign(form, row);
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  if (!form.spiderCode || !form.spiderName || !form.spiderEntryUrl) {
    ElMessage.warning("请填写编码、名称、入口 URL");
    return;
  }
  saving.value = true;
  try {
    await definitionApi.save({ ...form });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: SpiderDefinition): Promise<void> {
  const next: 0 | 1 = row.spiderStatus === 1 ? 0 : 1;
  await definitionApi.status(row.spiderCode!, next);
  ElMessage.success(next === 1 ? "已启用" : "已禁用");
  await load();
}

async function remove(row: SpiderDefinition): Promise<void> {
  await definitionApi.remove(row.spiderCode!);
=======
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
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
  ElMessage.success("已删除");
  await load();
}

/**
<<<<<<< HEAD
 * 触发爬虫执行（异步）。
 *
 * <p>调用后端 /spider/executions/run，后端会启动后台线程执行爬虫，
 * 并写入 RUNNING 状态的执行记录。前端展示返回的批次号。</p>
 */
async function runSpider(row: SpiderDefinition): Promise<void> {
  try {
    const result = (await executionApi.run(row.spiderCode!)) as {
      executionNo?: string;
      status?: string;
      startTime?: string;
    };
    ElMessage.success(
      `已触发执行，批次号 ${result.executionNo}（${result.status}）`
    );
  } catch (e) {
    ElMessage.error('触发失败: ' + (e instanceof Error ? e.message : String(e)));
  }
}

onMounted(() => {
  load();
  loadProxyPools();
});

/**
 * 加载代理池列表（用于表单下拉选择）。
 */
async function loadProxyPools(): Promise<void> {
  try {
    const res = (await proxyPoolApi.page(1, 100)) as PageResult<SpiderProxyPool>;
    poolOptions.value = res.records ?? [];
  } catch {
    poolOptions.value = [];
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar :deep(.el-card__body) {
  padding: 12px 16px;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
.justify-end {
  justify-content: flex-end;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
.mt-3 {
  margin-top: 12px;
}
</style>
=======
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
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
