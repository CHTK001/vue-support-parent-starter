<script setup lang="ts">
/**
 * 消息管理页面（管理端）
 *
 * 顶部 Tab：消息列表 / 消息模板。
 * 消息列表：分页查询 + 发送消息 + 撤回 + 删除。
 * 消息模板：分页查询 + 新增/编辑/删除。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  pageForMessageAdmin,
  sendMessage,
  recallMessage,
  deleteMessage,
  pageForMessageTemplate,
  listForMessageTemplate,
  saveMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
} from "../api/systemApi";
import type { SysMessageAdmin, SysMessageTemplate, SysMessageSendRequest } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

/* ================== 字典 ================== */
const typeOptions = [
  { value: "system", label: "系统" },
  { value: "notice", label: "公告" },
  { value: "message", label: "消息" },
  { value: "warning", label: "警告" },
  { value: "info", label: "通知" },
];

const levelOptions = [
  { value: "low", label: "低" },
  { value: "normal", label: "普通" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];

const msgStatusOptions = [
  { value: 0, label: "草稿" },
  { value: 1, label: "已发送" },
  { value: 2, label: "已撤回" },
];

const templateStatusOptions = [
  { value: 0, label: "禁用" },
  { value: 1, label: "启用" },
];

function typeLabel(v?: string) {
  return typeOptions.find((o) => o.value === v)?.label ?? v ?? "-";
}
function levelTagType(v?: string): "info" | "warning" | "danger" {
  if (v === "urgent" || v === "high") return "danger";
  if (v === "low") return "info";
  return "warning";
}
function levelLabel(v?: string) {
  return levelOptions.find((o) => o.value === v)?.label ?? v ?? "-";
}
function msgStatusLabel(v?: number) {
  return msgStatusOptions.find((o) => o.value === v)?.label ?? "-";
}
function msgStatusTagType(v?: number): "info" | "success" | "danger" {
  if (v === 2) return "info";
  if (v === 1) return "success";
  return "warning";
}

/* ================== 当前 Tab ================== */
const activeTab = ref("message");

/* ================== 消息列表 ================== */
const msgQuery = ref<{
  page: number;
  pageSize: number;
  sysMessageTitle?: string;
  sysMessageType?: string;
  sysMessageStatus?: number;
  sysMessageReceiverId?: number;
}>({
  page: 1,
  pageSize: 10,
});

const msgTableRef = ref();
const msgActionLoading = ref<number>(0);

async function loadMessages({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForMessageAdmin({
    page,
    pageSize,
    sysMessageTitle: (params.sysMessageTitle as string) || undefined,
    sysMessageType: (params.sysMessageType as string) || undefined,
    sysMessageStatus:
      params.sysMessageStatus === "" || params.sysMessageStatus === undefined
        ? undefined
        : (params.sysMessageStatus as number),
    sysMessageReceiverId:
      params.sysMessageReceiverId === "" || params.sysMessageReceiverId === undefined
        ? undefined
        : (params.sysMessageReceiverId as number),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

function handleMsgReset() {
  msgQuery.value = { page: 1, pageSize: 10 };
  msgTableRef.value?.reload();
}

async function handleRecall(row: Record<string, unknown>) {
  const msg = row as unknown as SysMessageAdmin;
  if (msgActionLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认撤回消息「${msg.sysMessageTitle}」？`, "撤回确认", {
      type: "warning",
      confirmButtonText: "确定撤回",
    });
  } catch {
    return;
  }
  msgActionLoading.value = msg.sysMessageId!;
  try {
    await recallMessage(msg.sysMessageId!);
    ElMessage.success("已撤回");
    msgTableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "撤回失败");
  } finally {
    msgActionLoading.value = 0;
  }
}

async function handleDeleteMsg(row: Record<string, unknown>) {
  const msg = row as unknown as SysMessageAdmin;
  if (msgActionLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除消息「${msg.sysMessageTitle}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  msgActionLoading.value = msg.sysMessageId!;
  try {
    await deleteMessage(msg.sysMessageId!);
    ElMessage.success("删除成功");
    msgTableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    msgActionLoading.value = 0;
  }
}

/* ================== 发送消息弹窗 ================== */
const sendVisible = ref(false);
const sendSaving = ref(false);
const templates = ref<SysMessageTemplate[]>([]);
const sendForm = ref<SysMessageSendRequest>({ sysMessageTitle: "" });

async function loadTemplates() {
  try {
    const res = await listForMessageTemplate();
    templates.value = (res?.data ?? []) as SysMessageTemplate[];
  } catch (e) {
    console.warn("[message] 模板列表加载失败", e);
  }
}

function handleAdd() {
  sendForm.value = { sysMessageTitle: "", sysMessageType: "notice", sysMessageLevel: "normal" };
  sendVisible.value = true;
}

/** 选择模板后自动填充标题与内容 */
function onTemplateChange(code?: string) {
  if (!code) return;
  const tpl = templates.value.find((t) => t.sysMessageTemplateCode === code);
  if (!tpl) return;
  sendForm.value = {
    ...sendForm.value,
    sysMessageTitle: tpl.sysMessageTemplateTitle || sendForm.value.sysMessageTitle,
    sysMessageContent: tpl.sysMessageTemplateContent || sendForm.value.sysMessageContent,
    templateCode: code,
  };
}

async function handleSend() {
  if (!sendForm.value.sysMessageTitle) {
    ElMessage.warning("请输入消息标题");
    return;
  }
  sendSaving.value = true;
  try {
    await sendMessage(sendForm.value);
    ElMessage.success("发送成功");
    sendVisible.value = false;
    msgTableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "发送失败");
  } finally {
    sendSaving.value = false;
  }
}

/* ================== 消息模板 ================== */
const tplQuery = ref<{
  page: number;
  pageSize: number;
  sysMessageTemplateName?: string;
  sysMessageTemplateCode?: string;
}>({
  page: 1,
  pageSize: 10,
});

const tplTableRef = ref();
const tplActionLoading = ref<number>(0);

async function loadTemplatesPage({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForMessageTemplate({
    page,
    pageSize,
    sysMessageTemplateName: (params.sysMessageTemplateName as string) || undefined,
    sysMessageTemplateCode: (params.sysMessageTemplateCode as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

function handleTplReset() {
  tplQuery.value = { page: 1, pageSize: 10 };
  tplTableRef.value?.reload();
}

const tplDialogVisible = ref(false);
const tplSaving = ref(false);
const tplIsEdit = ref(false);
const tplForm = ref<SysMessageTemplate>({} as SysMessageTemplate);

function handleTplAdd() {
  tplIsEdit.value = false;
  tplForm.value = { sysMessageTemplateName: "", sysMessageTemplateCode: "", sysMessageTemplateStatus: 1 };
  tplDialogVisible.value = true;
}

function handleTplEdit(row: Record<string, unknown>) {
  tplIsEdit.value = true;
  tplForm.value = { ...(row as unknown as SysMessageTemplate) };
  tplDialogVisible.value = true;
}

async function handleTplSubmit() {
  if (!tplForm.value.sysMessageTemplateName) {
    ElMessage.warning("请输入模板名称");
    return;
  }
  if (!tplForm.value.sysMessageTemplateCode) {
    ElMessage.warning("请输入模板编码");
    return;
  }
  tplSaving.value = true;
  try {
    if (tplIsEdit.value) {
      await updateMessageTemplate(tplForm.value);
      ElMessage.success("修改成功");
    } else {
      await saveMessageTemplate(tplForm.value);
      ElMessage.success("新增成功");
    }
    tplDialogVisible.value = false;
    tplTableRef.value?.reload();
    loadTemplates();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    tplSaving.value = false;
  }
}

async function handleTplDelete(row: Record<string, unknown>) {
  const tpl = row as unknown as SysMessageTemplate;
  if (tplActionLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除模板「${tpl.sysMessageTemplateName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  tplActionLoading.value = tpl.sysMessageTemplateId!;
  try {
    await deleteMessageTemplate(tpl.sysMessageTemplateId!);
    ElMessage.success("删除成功");
    tplTableRef.value?.reload();
    loadTemplates();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    tplActionLoading.value = 0;
  }
}

/* ================== 列定义 ================== */
const msgColumns: ReTableColumn[] = [
  { prop: "sysMessageTitle", label: "标题", minWidth: 200, showOverflowTooltip: true },
  { prop: "sysMessageType", label: "类型", width: 100, slot: "type", align: "center" },
  { prop: "sysMessageLevel", label: "级别", width: 90, slot: "level", align: "center" },
  { prop: "sysMessageSenderName", label: "发送者", width: 120 },
  { prop: "sysMessageReceiverName", label: "接收者", width: 120, slot: "receiver" },
  { prop: "sysMessageSendTime", label: "发送时间", width: 170 },
  { prop: "sysMessageStatus", label: "状态", width: 100, slot: "mstatus", align: "center" },
  { prop: "action", label: "操作", width: 170, slot: "action", fixed: "right" },
];

const tplColumns: ReTableColumn[] = [
  { prop: "sysMessageTemplateName", label: "模板名称", minWidth: 160 },
  { prop: "sysMessageTemplateCode", label: "模板编码", minWidth: 150 },
  { prop: "sysMessageTemplateTitle", label: "模板标题", minWidth: 180, showOverflowTooltip: true },
  { prop: "sysMessageTemplateStatus", label: "状态", width: 100, slot: "tstatus", align: "center" },
  { prop: "action", label: "操作", width: 170, slot: "action", fixed: "right" },
];

onMounted(() => {
  loadTemplates();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <el-tabs v-model="activeTab">
        <!-- ============ 消息列表 ============ -->
        <el-tab-pane label="消息列表" name="message">
          <ReSearch :is-expanded="true" :add-button="false">
            <div class="system-page__search">
              <ReInput
                layout="modern"
                v-model="msgQuery.sysMessageTitle"
                placeholder="消息标题"
                clearable
                class="!w-48"
                @keyup.enter="msgTableRef?.reload()"
              />
              <ReSelect
                v-model="msgQuery.sysMessageType"
                placeholder="消息类型"
                clearable
                class="!w-40"
                :data="typeOptions"
              />
              <ReSelect
                v-model="msgQuery.sysMessageStatus"
                placeholder="状态"
                clearable
                class="!w-32"
                :data="msgStatusOptions"
              />
              <ReInput
                layout="modern"
                v-model="msgQuery.sysMessageReceiverId"
                placeholder="接收者ID"
                clearable
                class="!w-36"
                @keyup.enter="msgTableRef?.reload()"
              />
            </div>
            <template #footer>
              <ReButton layout="modern" type="primary" icon="Search" @click="msgTableRef?.reload()">查询</ReButton>
              <ReButton layout="modern" icon="Refresh" @click="handleMsgReset">重置</ReButton>
              <ReButton layout="modern" icon="Refresh" @click="msgTableRef?.reload()">刷新</ReButton>
              <span class="system-page__divider" />
              <ReButton layout="modern" type="success" icon="Plus" v-admin @click="handleAdd">发送消息</ReButton>
            </template>
          </ReSearch>

          <ReTable
            ref="msgTableRef"
            table-id="system-message-admin"
            :loader="loadMessages"
            :columns="msgColumns"
            :pagination="true"
            :params="msgQuery"
            row-key="sysMessageId"
            v-model:page="msgQuery.page"
            v-model:page-size="msgQuery.pageSize"
            class="mt-2"
          >
            <template #type="{ row }">
              <ReTag type="primary" effect="plain" size="small">{{ typeLabel(row.sysMessageType) }}</ReTag>
            </template>
            <template #level="{ row }">
              <ReTag :type="levelTagType(row.sysMessageLevel)" effect="plain" size="small">
                {{ levelLabel(row.sysMessageLevel) }}
              </ReTag>
            </template>
            <template #receiver="{ row }">
              <span v-if="!row.sysMessageReceiverId || row.sysMessageReceiverId === 0" class="text-xs text-[--el-text-color-secondary]">
                全体用户
              </span>
              <span v-else>{{ row.sysMessageReceiverName || row.sysMessageReceiverId }}</span>
            </template>
            <template #mstatus="{ row }">
              <ReTag :type="msgStatusTagType(row.sysMessageStatus)" size="small">{{ msgStatusLabel(row.sysMessageStatus) }}</ReTag>
            </template>
            <template #action="{ row }">
              <ReButton
                layout="square"
                type="warning"
                v-admin
                :disabled="row.sysMessageStatus === 2"
                :loading="msgActionLoading === row.sysMessageId"
                @click="handleRecall(row)"
              >
                撤回
              </ReButton>
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                v-admin
                :loading="msgActionLoading === row.sysMessageId"
                @click="handleDeleteMsg(row)"
              >
                删除
              </ReButton>
            </template>
          </ReTable>
        </el-tab-pane>

        <!-- ============ 消息模板 ============ -->
        <el-tab-pane label="消息模板" name="template">
          <ReSearch :is-expanded="true" :add-button="false">
            <div class="system-page__search">
              <ReInput
                layout="modern"
                v-model="tplQuery.sysMessageTemplateName"
                placeholder="模板名称"
                clearable
                class="!w-48"
                @keyup.enter="tplTableRef?.reload()"
              />
              <ReInput
                layout="modern"
                v-model="tplQuery.sysMessageTemplateCode"
                placeholder="模板编码"
                clearable
                class="!w-48"
                @keyup.enter="tplTableRef?.reload()"
              />
            </div>
            <template #footer>
              <ReButton layout="modern" type="primary" icon="Search" @click="tplTableRef?.reload()">查询</ReButton>
              <ReButton layout="modern" icon="Refresh" @click="handleTplReset">重置</ReButton>
              <ReButton layout="modern" icon="Refresh" @click="tplTableRef?.reload()">刷新</ReButton>
              <span class="system-page__divider" />
              <ReButton layout="modern" type="success" icon="Plus" v-admin @click="handleTplAdd">新增</ReButton>
            </template>
          </ReSearch>

          <ReTable
            ref="tplTableRef"
            table-id="system-message-template"
            :loader="loadTemplatesPage"
            :columns="tplColumns"
            :pagination="true"
            :params="tplQuery"
            row-key="sysMessageTemplateId"
            v-model:page="tplQuery.page"
            v-model:page-size="tplQuery.pageSize"
            class="mt-2"
          >
            <template #tstatus="{ row }">
              <ReTag :type="row.sysMessageTemplateStatus === 1 ? 'success' : 'info'" size="small">
                {{ row.sysMessageTemplateStatus === 1 ? "启用" : "禁用" }}
              </ReTag>
            </template>
            <template #action="{ row }">
              <ReButton layout="square" type="primary" icon="Edit" v-admin @click="handleTplEdit(row)">编辑</ReButton>
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                v-admin
                :loading="tplActionLoading === row.sysMessageTemplateId"
                @click="handleTplDelete(row)"
              >
                删除
              </ReButton>
            </template>
          </ReTable>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 发送消息弹窗 -->
    <ReDialog
      v-model="sendVisible"
      title="发送消息"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="sendSaving"
      @ok="handleSend"
    >
      <el-form label-width="90px" :model="sendForm">
        <el-form-item label="模板选择">
          <ReSelect
            v-model="sendForm.templateCode"
            placeholder="选择模板自动填充"
            clearable
            class="!w-full"
            :data="templates.map((t) => ({ label: t.sysMessageTemplateName, value: t.sysMessageTemplateCode }))"
            @change="onTemplateChange"
          />
        </el-form-item>
        <el-form-item label="消息标题" required>
          <ReInput layout="modern" v-model="sendForm.sysMessageTitle" placeholder="请输入消息标题" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="消息内容">
          <ReInput layout="modern" v-model="sendForm.sysMessageContent" type="textarea" :rows="4" placeholder="请输入消息内容" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="消息类型">
          <ReSelect v-model="sendForm.sysMessageType" placeholder="消息类型" class="!w-full" :data="typeOptions" />
        </el-form-item>
        <el-form-item label="消息级别">
          <ReSelect v-model="sendForm.sysMessageLevel" placeholder="消息级别" class="!w-full" :data="levelOptions" />
        </el-form-item>
        <el-form-item label="接收者ID">
          <ReInputNumber layout="modern" v-model="sendForm.sysMessageReceiverId" :min="0" class="!w-full" placeholder="留空或填 0 表示广播给全体用户" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <ReInput layout="modern" v-model="sendForm.sysMessageUrl" placeholder="选填，如 /system/xxx" maxlength="255" />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 模板新增/编辑弹窗 -->
    <ReDialog
      v-model="tplDialogVisible"
      :title="tplIsEdit ? '编辑模板' : '新增模板'"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="tplSaving"
      @ok="handleTplSubmit"
    >
      <el-form label-width="90px" :model="tplForm">
        <el-form-item label="模板名称" required>
          <ReInput layout="modern" v-model="tplForm.sysMessageTemplateName" placeholder="请输入模板名称" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="模板编码" required>
          <ReInput layout="modern" v-model="tplForm.sysMessageTemplateCode" placeholder="请输入模板编码" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="模板标题">
          <ReInput layout="modern" v-model="tplForm.sysMessageTemplateTitle" placeholder="请输入模板标题" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="模板内容">
          <ReInput
            layout="modern"
            v-model="tplForm.sysMessageTemplateContent"
            type="textarea"
            :rows="5"
            placeholder="支持变量 {username}、{date}"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="tplForm.sysMessageTemplateStatus" :options="templateStatusOptions" />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
.system-page__divider {
  display: inline-block;
  width: 1px;
  height: 18px;
  background: var(--el-border-color);
}
</style>
