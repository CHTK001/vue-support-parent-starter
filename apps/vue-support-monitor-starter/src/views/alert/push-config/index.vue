<template>
  <div class="page-container">
    <div class="toolbar">
      <el-input
        v-model="search.keyword"
        placeholder="服务器/类型/通道"
        clearable
        style="width: 260px"
      />
      <el-select
        v-model="search.type"
        placeholder="告警类型"
        clearable
        style="width: 180px; margin-left: 12px"
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
        style="width: 180px; margin-left: 12px"
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
        style="margin-left: 12px"
      />
      <el-button type="primary" @click="handleSearch" style="margin-left: 12px"
        >查询</el-button
      >
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openEdit()">新增配置</el-button>
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
          >不使用模板时可直接填写以下字段</el-divider
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
        <el-form-item label="主账号">
          <el-input
            v-model="edit.form.monitorSysGenAlertPushConfigMainAccount"
            :disabled="!!edit.form.monitorSysGenAlertPushConfigTemplateId"
          />
        </el-form-item>
        <el-form-item label="用户名">
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
import { ref, reactive, onMounted } from "vue";
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
      row.monitorSysGenAlertPushConfigEnabled ? "是" : "否",
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
    { required: true, message: "请选择通道", trigger: "change" },
  ],
};

function openEdit(row?: any) {
  edit.visible = true;
  edit.form = row ? { ...row } : { monitorSysGenAlertPushConfigEnabled: true };
  loadTemplateOptions();
}

async function loadTemplateOptions() {
  const res: any = await fetchAlertPushTemplatePage({
    pageNum: 1,
    pageSize: 50,
  });
  if (res && (res.code === "00000" || res.success)) {
    templateOptions.value = res.data?.records || [];
  }
}

async function handleSave() {
  try {
    // 校验
    const valid = await (formRef.value as any)?.validate?.();
    if (!valid && valid !== undefined) return;
    // 校验JSON（在未选择模板时才校验）
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
      list.value = res.data?.records || [];
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

<style scoped>
.page-container {
  padding: 16px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
