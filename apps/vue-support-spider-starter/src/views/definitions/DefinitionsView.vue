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
    const page = (await definitionApi.page(
      pageNo.value,
      pageSize.value
    )) as PageResult<SpiderDefinition>;
    list.value = page.records ?? [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

/**
 * 刷新列表（关键字变化后重置页码）。
 */
function reload(): void {
  pageNo.value = 1;
  void load();
}

function openCreate(): void {
  Object.assign(form, initialForm());
  dialogVisible.value = true;
}

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
  ElMessage.success("已删除");
  await load();
}

/**
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
