<template>
  <div class="page-container system-container modern-bg">
    <div class="toolbar">
      <el-input v-model="search.keyword" placeholder="模板名称/通道" clearable style="width: 240px" />
      <el-select v-model="search.channel" placeholder="通道" clearable style="width: 180px; margin-left: 12px">
        <el-option v-for="item in channels" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-switch v-model="search.enabled" active-text="启用" inactive-text="停用" style="margin-left: 12px" />
      <el-button type="primary" @click="handleSearch" style="margin-left: 12px">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openEdit()">新增模板</el-button>
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
        <el-button type="warning" link @click="handleTest(row)">测试发送</el-button>
        <el-divider direction="vertical" />
        <el-popconfirm title="确认删除该模板？" @confirm="handleDelete(row)">
          <template #reference>
            <el-button type="danger" link>删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </data-table>

    <sc-dialog v-model="edit.visible" :title="edit.form.monitorSysGenMessagePushTemplateId ? '编辑模板' : '新增模板'" width="680px">
      <el-form :model="edit.form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="模板名称" prop="monitorSysGenMessagePushTemplateName">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateName" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="通道" prop="monitorSysGenMessagePushTemplateChannel">
          <el-select v-model="edit.form.monitorSysGenMessagePushTemplateChannel" placeholder="请选择通道">
            <el-option v-for="item in channels" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="edit.form.monitorSysGenMessagePushTemplateEnabled" />
        </el-form-item>
        <el-form-item label="Endpoint/Webhook">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateEndpoint" placeholder="https://... 或 邮箱/手机号等" />
        </el-form-item>
        <el-form-item label="主账号">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateMainAccount" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateUsername" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplatePassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="Token/密钥">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateToken" />
        </el-form-item>
        <el-form-item label="扩展参数(JSON)">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateExtra" type="textarea" :rows="3" placeholder='{"key":"value"}' />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="edit.form.monitorSysGenMessagePushTemplateRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="edit.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import DataTable from "@/components/common/DataTable.vue";
import { fetchAlertPushTemplatePage, fetchAlertPushTemplateSave, fetchAlertPushTemplateDelete, fetchAlertPushTemplateTestSend } from "@/api/monitor/alert-push";
import { message } from "@repo/utils";

const tableRef = ref();
const loading = ref(false);
const list = ref<any[]>([]);
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const search = reactive({
  keyword: "",
  channel: "",
  enabled: undefined as any
});

const channels = [
  { label: "Webhook", value: "WEBHOOK" },
  { label: "Email", value: "EMAIL" },
  { label: "钉钉", value: "DINGTALK" },
  { label: "企业微信", value: "WECHAT" },
  { label: "短信", value: "SMS" }
];

const columns = [
  { prop: "monitorSysGenMessagePushTemplateName", label: "模板名称" },
  {
    prop: "monitorSysGenMessagePushTemplateChannel",
    label: "通道",
    formatter: (_: any, row: any) => channelLabel(row.monitorSysGenMessagePushTemplateChannel)
  },
  {
    prop: "monitorSysGenMessagePushTemplateEnabled",
    label: "启用",
    formatter: (_: any, row: any) => (row.monitorSysGenMessagePushTemplateEnabled ? "是" : "否")
  },
  {
    prop: "monitorSysGenMessagePushTemplateEndpoint",
    label: "Endpoint/Webhook"
  },
  { prop: "monitorSysGenMessagePushTemplateMainAccount", label: "主账号" },
  { prop: "monitorSysGenMessagePushTemplateUsername", label: "用户名" },
  { prop: "monitorSysGenMessagePushTemplateRemark", label: "备注" },
  { prop: "actions", label: "操作" }
];

const edit = reactive({ visible: false, form: {} as any });
const formRef = ref();
const rules = {
  monitorSysGenMessagePushTemplateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  monitorSysGenMessagePushTemplateChannel: [{ required: true, message: "请选择通道", trigger: "change" }]
};

function openEdit(row?: any) {
  edit.visible = true;
  edit.form = row ? { ...row } : { monitorSysGenMessagePushTemplateEnabled: true };
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
        return message("扩展参数必须是合法JSON", { type: "error" });
      }
    }
    loading.value = true;
    const res = await fetchAlertPushTemplateSave(edit.form);
    if ((res as any).code === "00000" || (res as any).success) {
      message("保存成功", { type: "success" });
      edit.visible = false;
      load();
    } else {
      message((res as any, { type: "error" }).msg || "保存失败");
    }
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    loading.value = true;
    const res = await fetchAlertPushTemplateDelete(row.monitorSysGenMessagePushTemplateId);
    if ((res as any).code === "00000" || (res as any).success) {
      message("删除成功", { type: "success" });
      load();
    } else {
      message((res as any, { type: "error" }).msg || "删除失败");
    }
  } catch (e: any) {
    message(e?.message || "删除失败", { type: "error" });
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
    const res = await fetchAlertPushTemplateTestSend(row.monitorSysGenMessagePushTemplateId);
    if ((res as any).code === "00000" || (res as any).success) {
      message("测试发送成功", { type: "success" });
    } else {
      message((res as any, { type: "error" }).msg || "测试发送失败");
    }
  } catch (e: any) {
    message(e?.message || "测试发送失败", { type: "error" });
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
      monitorSysGenMessagePushTemplateEnabled: search.enabled
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
  const item = channels.find(c => c.value === code);
  return item?.label || code || "";
}

onMounted(load);
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.page-container {
  padding: 16px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
