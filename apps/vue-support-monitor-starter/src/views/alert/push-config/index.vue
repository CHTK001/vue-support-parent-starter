<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline
              icon="ri:notification-4-line"
              class="title-icon"
            />
            告警推送配�?
          </h1>
          <p class="page-subtitle">管理系统告警消息的推送通道和配�?/p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ list.length }}</span>
            <span class="stat-label">配置数量</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{
              list.filter((i) => i.monitorSysGenAlertPushConfigEnabled).length
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
          placeholder="服务�?类型/通道"
          clearable
          style="width: 220px"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="search.type"
          placeholder="告警类型"
          clearable
          style="width: 160px"
        >
          <el-option
            v-for="item in types"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
          新增配置
        </el-button>
      </div>
    </div>

    <data-table
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
        <el-popconfirm title="确认删除该配置？" @confirm="handleDelete(row)">
          <template #reference>
            <el-button type="danger" link>删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </data-table>

    <el-dialog
      v-model="edit.visible"
      :title="
        edit.form.monitorSysGenAlertPushConfigId ? '编辑配置' : '新增配置'
      "
      width="780px"
    >
      <el-form
        :model="edit.form"
        :rules="rules"
        ref="formRef"
        label-width="140px"
      >
        <el-form-item label="服务器ID(可选全局)">
          <el-input-number
            v-model="edit.form.monitorSysGenServerId"
            :min="0"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="告警类型" prop="monitorSysGenAlertPushConfigType">
          <el-select
            v-model="edit.form.monitorSysGenAlertPushConfigType"
            placeholder="请选择告警类型"
          >
            <el-option
              v-for="item in types"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通道" prop="monitorSysGenAlertPushConfigChannel">
          <el-select
            v-model="edit.form.monitorSysGenAlertPushConfigChannel"
            placeholder="请选择通道"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          >
            <el-option
              v-for="item in channels"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="使用模板">
          <el-select
            v-model="edit.form.monitorSysGenAlertPushConfigTemplateId"
            placeholder="选择模板(优先)"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="tpl in templateOptions"
              :key="tpl.monitorSysGenMessagePushTemplateId"
              :label="tpl.monitorSysGenMessagePushTemplateName"
              :value="tpl.monitorSysGenMessagePushTemplateId"
            />
          </el-select>
        </el-form-item>

        <el-divider content-position="left"
          >不使用模板时可直接填写以下字�?/el-divider
        >
        <el-form-item label="是否启用">
          <el-switch v-model="edit.form.monitorSysGenAlertPushConfigEnabled" />
        </el-form-item>
        <el-form-item label="Endpoint/Webhook">
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigEndpoint"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          />
        </el-form-item>
        <el-form-item label="主账�?>
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigMainAccount"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          />
        </el-form-item>
        <el-form-item label="用户�?>
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigUsername"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigPassword"
            type="password"
            show-password
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          />
        </el-form-item>
        <el-form-item label="Token/密钥">
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigToken"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          />
        </el-form-item>
        <el-form-item label="扩展参数(JSON)">
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigExtra"
            type="textarea"
            :rows="3"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigRemark"
            type="textarea"
            :rows="2"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
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
import { ref, reactive, onMounted, watch } from "vue";
import DataTable from "@/components/common/DataTable.vue";
import { ElMessage } from "element-plus";
import {
  fetchAlertPushConfigPage,
  fetchAlertPushConfigSave,
  fetchAlertPushConfigDelete,
} from "@/api/monitor/alert-config";
import { fetchAlertPushTemplatePage } from "@/api/monitor/alert-push";

const loading = ref(false);
const list = ref<any[]>([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const search = reactive({
  keyword: "",
  type: "",
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
const types = [
  { label: "CPU", value: "CPU" },
  { label: "内存", value: "MEMORY" },
  { label: "磁盘", value: "DISK" },
  { label: "连接", value: "CONNECTION" },
  { label: "响应时间", value: "RESPONSE_TIME" },
];

const columns = [
  { prop: "monitorSysGenServerId", label: "服务器ID" },
  {
    prop: "monitorSysGenAlertPushConfigType",
    label: "类型",
    formatter: (_: any, row: any) =>
      typeLabel(row.monitorSysGenAlertPushConfigType),
  },
  {
    prop: "monitorSysGenAlertPushConfigChannel",
    label: "通道",
    formatter: (_: any, row: any) =>
      channelLabel(row.monitorSysGenAlertPushConfigChannel),
  },
  { prop: "monitorSysGenAlertPushConfigTemplateId", label: "模板ID" },
  {
    prop: "monitorSysGenAlertPushConfigEnabled",
    label: "启用",
    formatter: (_: any, row: any) =>
      row.monitorSysGenAlertPushConfigEnabled ? "�? : "�?,
  },
  { prop: "monitorSysGenAlertPushConfigEndpoint", label: "Endpoint" },
  { prop: "monitorSysGenAlertPushConfigRemark", label: "备注" },
  { prop: "actions", label: "操作" },
];

const edit = reactive({ visible: false, form: {} as any });
const templateOptions = ref<any[]>([]);
const formRef = ref();
const rules = {
  monitorSysGenAlertPushConfigType: [
    { required: true, message: "请选择告警类型", trigger: "change" },
  ],
  monitorSysGenAlertPushConfigChannel: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (edit.form.monitorSysGenAlertPushConfigTemplateId) return callback();
        if (!value) return callback(new Error("请选择通道"));
        callback();
      },
      trigger: "change",
    },
  ],
};

function openEdit(row?: any) {
  edit.visible = true;
  edit.form = row ? { ...row } : { monitorSysGenAlertPushConfigEnabled: true };
  loadTemplateOptions();
}

// 模板选择自动回填通道
watch(
  () => edit.form.monitorSysGenAlertPushConfigTemplateId,
  (tplId) => {
    const tpl = templateOptions.value.find(
      (t: any) => t.monitorSysGenMessagePushTemplateId === tplId
    );
    if (tpl) {
      edit.form.monitorSysGenAlertPushConfigChannel =
        tpl.monitorSysGenMessagePushTemplateChannel;
    }
  }
);

async function loadTemplateOptions() {
  const res: any = await fetchAlertPushTemplatePage({
    pageNum: 1,
    pageSize: 50,
  });
  if (res && (res.code === "00000" || res.success)) {
    templateOptions.value = res.data?.data || [];
  }
}

async function handleSave() {
  try {
    // 校验
    const valid = await (formRef.value as any)?.validate?.();
    if (!valid && valid !== undefined) return;
    // 校验JSON（在未选择模板时才校验�?
    const extra = edit.form.monitorSysGenAlertPushConfigExtra;
    if (!edit.form.monitorSysGenAlertPushConfigTemplateId && extra) {
      try {
        JSON.parse(extra);
      } catch {
        return ElMessage.error("扩展参数必须是合法JSON");
      }
    }
    loading.value = true;
    const res = await fetchAlertPushConfigSave(edit.form);
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
    const res = await fetchAlertPushConfigDelete(
      row.monitorSysGenAlertPushConfigId
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
  search.type = "";
  search.channel = "";
  search.enabled = undefined as any;
  pagination.page = 1;
  load();
}

async function load() {
  try {
    loading.value = true;
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      monitorSysGenServerId: search.keyword || undefined,
      monitorSysGenAlertPushConfigType: search.type || undefined,
      monitorSysGenAlertPushConfigChannel: search.channel || undefined,
      monitorSysGenAlertPushConfigEnabled: search.enabled,
    };
    const res: any = await fetchAlertPushConfigPage(params);
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
function typeLabel(code: string) {
  const item = types.find((c) => c.value === code);
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
