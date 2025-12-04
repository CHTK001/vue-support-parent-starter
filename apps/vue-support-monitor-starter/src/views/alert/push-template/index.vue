<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:file-list-3-line" class="title-icon" />
            推送模板管�?
          </h1>
          <p class="page-subtitle">管理消息推送模板，支持多种通道配置</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ list.length }}</span>
            <span class="stat-label">模板数量</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{
              list.filter((i) => i.monitorSysGenMessagePushTemplateEnabled)
                .length
            }}</span>
            <span class="stat-label">已启�?/span>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具�?-->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="search.keyword"
          placeholder="模板名称/通道"
          clearable
          style="width: 200px"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="search.channel"
          placeholder="通道"
          clearable
          style="width: 160px"
        >
          <el-option
            v-for="item in channels"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-switch
          v-model="search.enabled"
          active-text="启用"
          inactive-text="停用"
        />
      </div>
      <div class="toolbar-right">
        <el-button @click="handleReset">
          <IconifyIconOnline icon="ri:refresh-line" />
          重置
        </el-button>
        <el-button type="primary" @click="handleSearch">
          <IconifyIconOnline icon="ri:search-line" />
          查询
        </el-button>
        <el-button type="success" @click="openEdit()">
          <IconifyIconOnline icon="ri:add-line" />
          新增模板
        </el-button>
      </div>
    </div>

    <data-table
      ref="tableRef"
      :columns="columns"
      :data="list"
      :loading="loading"
      :total="pagination.total"
      :current-page="pagination.page"
      :page-size="pagination.pageSize"
      @size-change="
        (size: number) => {
          pagination.pageSize = size;
          load();
        }
      "
      @current-change="
        (page: number) => {
          pagination.page = page;
          load();
        }
      "
    >
      <template #actions="{ row }">
        <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
        <el-divider direction="vertical" />
        <el-button type="warning" link @click="handleTest(row)"
          >测试发�?/el-button
        >
        <el-divider direction="vertical" />
        <el-popconfirm title="确认删除该模板？" @confirm="handleDelete(row)">
          <template #reference>
            <el-button type="danger" link>删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </data-table>

    <el-dialog
      v-model="edit.visible"
      :title="
        edit.form.monitorSysGenMessagePushTemplateId ? '编辑模板' : '新增模板'
      "
      width="680px"
    >
      <el-form
        :model="edit.form"
        :rules="rules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item
          label="模板名称"
          prop="monitorSysGenMessagePushTemplateName"
        >
          <el-input
            v-model="edit.form.monitorSysGenMessagePushTemplateName"
            placeholder="请输入模板名�?
          />
        </el-form-item>
        <el-form-item
          label="通道"
          prop="monitorSysGenMessagePushTemplateChannel"
        >
          <el-select
            v-model="edit.form.monitorSysGenMessagePushTemplateChannel"
            placeholder="请选择通道"
          >
            <el-option
              v-for="item in channels"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch
            v-model="edit.form.monitorSysGenMessagePushTemplateEnabled"
          />
        </el-form-item>
        <el-form-item label="Endpoint/Webhook">
          <el-input
            v-model="edit.form.monitorSysGenMessagePushTemplateEndpoint"
            placeholder="https://... �?邮箱/手机号等"
          />
        </el-form-item>
        <el-form-item label="主账�?>
          <el-input
            v-model="edit.form.monitorSysGenMessagePushTemplateMainAccount"
          />
        </el-form-item>
        <el-form-item label="用户�?>
          <el-input
            v-model="edit.form.monitorSysGenMessagePushTemplateUsername"
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="edit.form.monitorSysGenMessagePushTemplatePassword"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="Token/密钥">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateToken" />
        </el-form-item>
        <el-form-item label="扩展参数(JSON)">
          <el-input
            v-model="edit.form.monitorSysGenMessagePushTemplateExtra"
            type="textarea"
            :rows="3"
            placeholder='{"key":"value"}'
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="edit.form.monitorSysGenMessagePushTemplateRemark"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="edit.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import DataTable from "@/components/common/DataTable.vue";
import {
  fetchAlertPushTemplatePage,
  fetchAlertPushTemplateSave,
  fetchAlertPushTemplateDelete,
  fetchAlertPushTemplateTestSend,
} from "@/api/monitor/alert-push";
import { ElMessage } from "element-plus";

const tableRef = ref();
const loading = ref(false);
const list = ref<any[]>([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const search = reactive({
  keyword: "",
  channel: "",
  enabled: undefined as any,
});

const channels = [
  { label: "Webhook", value: "WEBHOOK" },
  { label: "Email", value: "EMAIL" },
  { label: "钉钉", value: "DINGTALK" },
  { label: "企业微信", value: "WECHAT" },
  { label: "短信", value: "SMS" },
];

const columns = [
  { prop: "monitorSysGenMessagePushTemplateName", label: "模板名称" },
  {
    prop: "monitorSysGenMessagePushTemplateChannel",
    label: "通道",
    formatter: (_: any, row: any) =>
      channelLabel(row.monitorSysGenMessagePushTemplateChannel),
  },
  {
    prop: "monitorSysGenMessagePushTemplateEnabled",
    label: "启用",
    formatter: (_: any, row: any) =>
      row.monitorSysGenMessagePushTemplateEnabled ? "�? : "�?,
  },
  {
    prop: "monitorSysGenMessagePushTemplateEndpoint",
    label: "Endpoint/Webhook",
  },
  { prop: "monitorSysGenMessagePushTemplateMainAccount", label: "主账�? },
  { prop: "monitorSysGenMessagePushTemplateUsername", label: "用户�? },
  { prop: "monitorSysGenMessagePushTemplateRemark", label: "备注" },
  { prop: "actions", label: "操作" },
];

const edit = reactive({ visible: false, form: {} as any });
const formRef = ref();
const rules = {
  monitorSysGenMessagePushTemplateName: [
    { required: true, message: "请输入模板名�?, trigger: "blur" },
  ],
  monitorSysGenMessagePushTemplateChannel: [
    { required: true, message: "请选择通道", trigger: "change" },
  ],
};

function openEdit(row?: any) {
  edit.visible = true;
  edit.form = row
    ? { ...row }
    : { monitorSysGenMessagePushTemplateEnabled: true };
}

async function handleSave() {
  try {
    // 校验
    const valid = await (formRef.value as any)?.validate?.();
    if (!valid && valid !== undefined) return;
    // 校验JSON
    const extra = edit.form.monitorSysGenMessagePushTemplateExtra;
    if (extra) {
      try {
        JSON.parse(extra);
      } catch {
        return ElMessage.error("扩展参数必须是合法JSON");
      }
    }
    loading.value = true;
    const res = await fetchAlertPushTemplateSave(edit.form);
    if ((res as any).code === "00000" || (res as any).success) {
      ElMessage.success("保存成功");
      edit.visible = false;
      load();
    } else {
      ElMessage.error((res as any).msg || "保存失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "保存失败");
  } finally {
    loading.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    loading.value = true;
    const res = await fetchAlertPushTemplateDelete(
      row.monitorSysGenMessagePushTemplateId
    );
    if ((res as any).code === "00000" || (res as any).success) {
      ElMessage.success("删除成功");
      load();
    } else {
      ElMessage.error((res as any).msg || "删除失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "删除失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  load();
}

function handleReset() {
  search.keyword = "";
  search.channel = "";
  search.enabled = undefined as any;
  pagination.page = 1;
  load();
}

async function handleTest(row: any) {
  try {
    const res = await fetchAlertPushTemplateTestSend(
      row.monitorSysGenMessagePushTemplateId
    );
    if ((res as any).code === "00000" || (res as any).success) {
      ElMessage.success("测试发送成�?);
    } else {
      ElMessage.error((res as any).msg || "测试发送失�?);
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "测试发送失�?);
  }
}

async function load() {
  try {
    loading.value = true;
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      monitorSysGenMessagePushTemplateName: search.keyword || undefined,
      monitorSysGenMessagePushTemplateChannel: search.channel || undefined,
      monitorSysGenMessagePushTemplateEnabled: search.enabled,
    };
    const res: any = await fetchAlertPushTemplatePage(params);
    if (res && (res.code === "00000" || res.success)) {
      list.value = res.data?.data || [];
      pagination.total = res.data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function channelLabel(code: string) {
  const item = channels.find((c) => c.value === code);
  return item?.label || code || "";
}

onMounted(load);
</script>

<style lang="scss" scoped>
.page-container {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 24px 32px;
  border-radius: 8px;
  margin: 16px 16px 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .title-icon {
        font-size: 28px;
        color: var(--el-color-primary);
      }
    }

    .page-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .header-stats {
    display: flex;
    gap: 32px;

    .stat-item {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
        color: var(--el-color-primary);
      }

      .stat-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

:deep(.data-table) {
  flex: 1;
  margin: 0 16px 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
</style>
