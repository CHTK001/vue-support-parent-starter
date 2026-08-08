<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center justify-between">
        <el-input
          v-model="keyword"
          placeholder="搜索代理池编码 / 名称"
          clearable
          style="width: 280px"
          @keyup.enter="reload"
        />
        <el-tooltip content="新建" placement="top">
          <el-button :icon="Plus" type="primary" circle @click="openCreate" />
        </el-tooltip>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table v-loading="loading" :data="list" stripe :row-key="'poolCode'" empty-text="暂无代理池">
        <el-table-column prop="poolCode" label="编码" min-width="140" />
        <el-table-column prop="poolName" label="名称" min-width="180" />
        <el-table-column label="策略" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.poolStrategy === "RANDOM" ? "随机" : "轮询" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="代理数" width="100" align="center">
          <template #default="{ row }">
            {{ row.proxies?.length ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.poolStatus === 1 ? 'success' : 'info'" size="small">
              {{ row.poolStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="warning" size="small" @click="testPool(row)">测试</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm :title="`确认删除 ${row.poolCode} 吗？`" @confirm="remove(row)">
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

    <!-- 代理池连通性测试结果 -->
    <el-dialog
      v-model="testDialogVisible"
      :title="`代理池测试结果 — ${testPoolCode}`"
      width="640"
      destroy-on-close
    >
      <el-table
        v-if="testResults"
        :data="(testResults.nodes as any[]) ?? []"
        stripe
        empty-text="无代理节点"
      >
        <el-table-column label="地址" min-width="200">
          <template #default="{ row }">
            {{ row.host }}:{{ row.port }}
          </template>
        </el-table-column>
        <el-table-column prop="protocol" label="协议" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.ok ? 'success' : 'danger'"
              size="small"
            >
              {{ row.ok ? 'OK' : 'FAIL' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="80">
          <template #default="{ row }">
            {{ row.elapsedMs }} ms
          </template>
        </el-table-column>
        <el-table-column
          v-if="(testResults.nodes as any[])?.some((n: any) => n.error)"
          prop="error"
          label="错误信息"
          min-width="200"
          show-overflow-tooltip
        />
      </el-table>
      <div v-if="testResults" class="test-summary">
        汇总：成功 {{ testResults.success }} / 总数 {{ testResults.total }}
      </div>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      :title="form.poolId ? '编辑代理池' : '新建代理池'"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" label-width="100">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="编码" required>
              <el-input v-model="form.poolCode" placeholder="建议英文，业务唯一" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="form.poolName" placeholder="例如：国内代理池" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="策略">
          <el-radio-group v-model="form.poolStrategy">
            <el-radio value="ROUND">轮询</el-radio>
            <el-radio value="RANDOM">随机</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="代理列表">
          <div class="proxies">
            <div
              v-for="(p, idx) in form.proxies"
              :key="idx"
              class="proxy-row"
            >
              <el-input
                v-model="p.proxyHost"
                placeholder="IP / 域名"
                style="width: 180px"
              />
              <el-input-number
                v-model="p.proxyPort"
                :min="1"
                :max="65535"
                placeholder="端口"
                style="width: 110px"
              />
              <el-select v-model="p.proxyProtocol" style="width: 100px">
                <el-option label="HTTP" value="HTTP" />
                <el-option label="HTTPS" value="HTTPS" />
                <el-option label="SOCKS5" value="SOCKS5" />
              </el-select>
              <el-input
                v-model="p.proxyUsername"
                placeholder="用户名（可选）"
                style="width: 120px"
              />
              <el-input
                v-model="p.proxyPassword"
                type="password"
                placeholder="密码（可选）"
                show-password
                style="width: 120px"
              />
              <el-button
                link
                type="danger"
                :icon="Delete"
                @click="form.proxies.splice(idx, 1)"
              />
            </div>
            <el-button :icon="Plus" @click="addProxy">添加代理</el-button>
          </div>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.poolStatus">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
import { Delete, Plus, VideoCameraFilled } from "@element-plus/icons-vue";
import { proxyPoolApi } from "@/api";
import type { SpiderProxyPool, SpiderProxy, PageResult } from "@/types/spider";

const keyword = ref("");
const pageNo = ref(1);
const pageSize = ref(20);
const list = ref<SpiderProxyPool[]>([]);
const total = ref(0);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);

/**
 * 代理池连通性测试结果对话框
 */
const testDialogVisible = ref(false);
const testPoolCode = ref("");
const testResults = ref<Record<string, unknown> | null>(null);
const testing = ref(false);

const initialForm = (): SpiderProxyPool => ({
  poolCode: "",
  poolName: "",
  poolStrategy: "ROUND",
  poolStatus: 1,
  proxies: [],
});

const form = reactive<SpiderProxyPool>(initialForm());

/**
 * 加载分页。
 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const page = (await proxyPoolApi.page(
      pageNo.value,
      pageSize.value
    )) as PageResult<SpiderProxyPool>;
    list.value = page.records ?? [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

/**
 * 刷新列表。
 */
function reload(): void {
  pageNo.value = 1;
  void load();
}

/**
 * 新建：打开弹窗。
 */
function openCreate(): void {
  Object.assign(form, initialForm());
  dialogVisible.value = true;
}

/**
 * 编辑：加载回显并打开弹窗。
 */
function openEdit(row: SpiderProxyPool): void {
  Object.assign(form, JSON.parse(JSON.stringify(row)));
  dialogVisible.value = true;
}

/**
 * 保存代理池（新增或更新）。
 */
async function save(): Promise<void> {
  if (!form.poolCode || !form.poolName) {
    ElMessage.warning("请填写编码和名称");
    return;
  }
  if (!form.proxies.length) {
    ElMessage.warning("请至少添加一个代理节点");
    return;
  }
  saving.value = true;
  try {
    await proxyPoolApi.save({ ...form });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

/**
 * 删除代理池。
 */
async function remove(row: SpiderProxyPool): Promise<void> {
  await proxyPoolApi.remove(row.poolCode);
  ElMessage.success("已删除");
  await load();
}

/**
 * 测试代理池节点连通性。
 *
 * <p>调用后端 /spider/proxy-pools/test，弹出结果列表展示每个节点 OK 状态与耗时。</p>
 */
async function testPool(row: SpiderProxyPool): Promise<void> {
  testing.value = true;
  try {
    const result = (await proxyPoolApi.test(row.poolCode)) as {
      total?: number;
      success?: number;
      nodes?: Array<Record<string, unknown>>;
    };
    testDialogVisible.value = true;
    testPoolCode.value = row.poolCode;
    testResults.value = result;
    ElMessage.success(
      `测试完成：${result.success ?? 0}/${result.total ?? 0} 节点可用`
    );
  } catch (e) {
    ElMessage.error('测试失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    testing.value = false;
  }
}

/**
 * 新增一个空代理行。
 */
function addProxy(): void {
  form.proxies.push({
    proxyHost: "",
    proxyPort: 8080,
    proxyProtocol: "HTTP",
  } as SpiderProxy);
}

onMounted(load);
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
.proxies {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.proxy-row {
  display: flex;
  align-items: center;
  gap: 8px;
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
.mt-3 {
  margin-top: 12px;
}
</style>
