<script setup lang="ts">
/**
 * 主机新增/编辑弹窗（独立子组件）
 * 从 AssetsView 拆出：弹窗打开/渲染只在自身组件内进行，不再触发 AssetsView 巨型组件全量 diff
 */
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import { getHost, listBoundIdentities, bindIdentity, saveHost } from "@pages/server/src/api";
/** 主机表单结构（与 AssetsView.Host 保持一致——避免跨 .vue 文件的类型导入解析问题） */
interface Host {
  id?: number;
  serverHostName?: string;
  serverHostAddress?: string;
  serverHostPort?: number;
  serverHostOsType?: string;
  serverHostCollectMode?: string;
  serverHostCollectEnabled?: number;
  serverHostCollectInterval?: number;
  serverHostOnlineEnabled?: number;
  serverHostOnlineInterval?: number;
  serverHostAgentEnabled?: number;
  serverHostRemoteEnabled?: number;
  serverGroupId?: number | null;
  serverHostTags?: string | null;
  serverHostDescription?: string | null;
  serverHostCode?: string | null;
  serverHostAccount?: string | null;
  serverHostPassword?: string | null;
  serverHostPrivateKey?: string | null;
  serverHostLastCollectTime?: string | null;
  serverHostOnlineTime?: string | null;
}

const props = defineProps<{
  modelValue: boolean;
  isEdit: boolean;
  /** 编辑时的行数据（打开后详情异步回填） */
  host: Host | null;
  identityOptions: { label: string; value: number }[];
  groupOptions: { label: string; value: number | null }[];
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "saved"): void;
}>();

// ---- 表单状态（从 AssetsView 迁入）----
const formSaving = ref(false);
/** 标签编辑用文本（逗号分隔），提交时写成 serverHostTags */
const tagsText = ref("");
const form = ref<Partial<Host>>({ serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED" });
/** 认证方式 */
const formAuthMethod = ref("IDENTITY");
/** 从身份列表选择 */
const formIdentityId = ref<number | null>(null);
const formIdentityChanged = ref(false);
/** 登录凭据（瞬态） */
const formAccount = ref("");
const formPassword = ref("");
const formPrivateKey = ref("");
const hostBoundIdentities = ref<number[]>([]);

const authMethods = [
  { label: "默认身份（绑定）", value: "IDENTITY" },
  { label: "账号密码", value: "PASSWORD" },
  { label: "SSH 私钥", value: "PUBLIC_KEY" },
];
const collectModes = [
  { label: "定时采集", value: "SCHEDULED" },
  { label: "Agent采集", value: "AGENT" },
  { label: "HTTP采集", value: "HTTP" },
  { label: "Prometheus采集", value: "PROMETHEUS" },
];

function splitTags(tags?: string | null): string[] {
  if (!tags) return [];
  // 同时兼容中英文逗号分隔（后端/手工录入可能用「，」）
  return tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}

function resetForm(): void {
  form.value = {
    serverHostName: "", serverHostAddress: "", serverHostPort: 22,
    serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED",
    serverGroupId: null, serverHostTags: "", serverHostDescription: "",
    serverHostCode: "",
    // 采集
    serverHostCollectEnabled: 1, serverHostCollectInterval: 3600,
    serverHostOnlineEnabled: 1, serverHostOnlineInterval: 60,
    // 远控
    serverHostRemoteEnabled: 1, serverHostAgentEnabled: 0,
  };
  tagsText.value = "";
  formAuthMethod.value = "IDENTITY";
  formIdentityId.value = null;
  formIdentityChanged.value = false;
  formAccount.value = "";
  formPassword.value = "";
  formPrivateKey.value = "";
  hostBoundIdentities.value = [];
}

/** 编辑弹窗里切换登录身份 */
function onFormIdentityChange(v: number | null): void {
  formIdentityChanged.value = true;
  formIdentityId.value = v;
}

function validForm(): boolean {
  if (!form.value.serverHostName?.trim()) { ElMessage.warning("请输入主机名"); return false; }
  if (!form.value.serverHostAddress?.trim()) { ElMessage.warning("请输入地址"); return false; }
  if (!form.value.serverHostPort) { ElMessage.warning("请输入端口"); return false; }
  return true;
}

async function submitForm(): Promise<void> {
  if (!validForm()) return;
  // 标签文本 → 逗号分隔字符串
  form.value.serverHostTags = tagsText.value.split(",").map(t => t.trim()).filter(Boolean).join(",");
  // 注入认证凭据（瞬态字段，后端不落库，用于 SSH 连接建立）
  if (formAuthMethod.value === "PASSWORD") {
    form.value.serverHostAccount = formAccount.value || null;
    form.value.serverHostPassword = formPassword.value || null;
    form.value.serverHostPrivateKey = null;
  } else if (formAuthMethod.value === "PUBLIC_KEY") {
    form.value.serverHostAccount = formAccount.value || null;
    form.value.serverHostPassword = null;
    form.value.serverHostPrivateKey = formPrivateKey.value || null;
  } else {
    form.value.serverHostAccount = null;
    form.value.serverHostPassword = null;
    form.value.serverHostPrivateKey = null;
  }
  formSaving.value = true;
  try {
    const res = await saveHost(props.isEdit ? form.value.id ?? null : null, form.value) as any;
    // 新主机：取回后端返回的 id（res 可能是保存后的实体或 id）
    const savedId = props.isEdit ? form.value.id : (res?.id ?? null);
    let hostId = props.isEdit ? form.value.id! : null;
    if (!hostId && savedId) hostId = Number(savedId);
    // 若表单选了身份，且是显式选择的，则绑定到（新/旧）主机
    if (hostId && formIdentityChanged.value && formIdentityId.value != null) {
      await bindIdentity(hostId, formIdentityId.value);
    }
    ElMessage.success(props.isEdit ? "已更新" : "已新增");
    emit("update:modelValue", false);
    emit("saved");
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    formSaving.value = false;
  }
}

// 打开时初始化：编辑 → 行数据立即填充 + 详情异步回填；新增 → 重置表单
watch(() => props.modelValue, (v) => {
  if (!v) return;
  if (props.isEdit && props.host) {
    form.value = { ...(props.host as any) };
    tagsText.value = splitTags(form.value.serverHostTags).join(", ");
    formAuthMethod.value = "IDENTITY";
    formAccount.value = "";
    formPassword.value = "";
    formPrivateKey.value = "";
    formIdentityChanged.value = false;
    formIdentityId.value = null;
    hostBoundIdentities.value = [];
    // 并行请求详情 + 已绑定身份，返回后回填（弹窗已先显示，用户可立即看到基础信息）
    void Promise.all([
      getHost(props.host.id!).catch(() => props.host),
      listBoundIdentities(props.host.id!).catch(() => []),
    ]).then(([full, bound]) => {
      if (!props.modelValue) return; // 弹窗已关闭则丢弃回填
      form.value = { ...(form.value as any), ...((full as any) ?? {}) };
      tagsText.value = splitTags(form.value.serverHostTags).join(", ");
      const bindList = Array.isArray(bound) ? bound : [];
      if (formIdentityId.value == null && bindList.length > 0) {
        formIdentityId.value = bindList[0];
      }
      hostBoundIdentities.value = bindList;
    });
  } else {
    resetForm();
  }
});
</script>

<template>
  <ReDialog
    :model-value="props.modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    :title="props.isEdit ? '编辑主机' : '新增主机'"
    width="880px"
    :height="640"
    :close-on-click-modal="false"
  >
    <ReForm :model="form" label-position="top" class="form-vertical">
      <div class="form-grid">
        <!-- ─── 基本信息 ─── -->
        <div class="form-section full">基本信息</div>
        <ReFormItem label="主机名称" class="col-span-2">
          <ReInput v-model="form.serverHostName" placeholder="如 prod-nginx-01" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="主机地址">
          <ReInput v-model="form.serverHostAddress" placeholder="IP 或域名" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="端口">
          <ReInputNumber v-model="form.serverHostPort" :min="1" :max="65535" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="平台" class="col-span-2">
          <ReSelect
            v-model="form.serverHostOsType"
            layout="square"
            style="width:100%"
            :options="[
              { label: 'Linux', value: 'LINUX' },
              { label: 'Windows', value: 'WINDOWS' },
              { label: 'macOS', value: 'MACOS' },
              { label: 'Android', value: 'ANDROID' },
            ]"
          />
        </ReFormItem>
        <ReFormItem label="主机编码" class="col-span-2">
          <ReInput v-model="form.serverHostCode" placeholder="唯一编码（可选）" style="width:100%" />
        </ReFormItem>

        <!-- ─── 认证方式 ─── -->
        <div class="form-section full">认证方式</div>
        <ReFormItem label="登录方式">
          <ReSelect v-model="formAuthMethod" size="small" style="width:100%" :options="authMethods" />
        </ReFormItem>
        <ReFormItem v-if="formAuthMethod === 'IDENTITY'" label="绑定身份" class="col-span-2">
          <ReSelect v-model="formIdentityId" placeholder="使用默认凭据" clearable size="small" style="width:100%" :options="props.identityOptions" />
        </ReFormItem>
        <template v-if="formAuthMethod === 'PASSWORD'">
          <ReFormItem label="登录账号">
            <ReInput v-model="formAccount" placeholder="如 root / ubuntu" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="登录密码" class="col-span-2">
            <ReInput v-model="formPassword" type="password" show-password placeholder="SSH 口令" style="width:100%" />
          </ReFormItem>
        </template>
        <template v-if="formAuthMethod === 'PUBLIC_KEY'">
          <ReFormItem label="登录账号">
            <ReInput v-model="formAccount" placeholder="如 root / ubuntu" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="SSH 私钥" class="col-span-2">
            <ReInput v-model="formPrivateKey" type="textarea" :rows="3" placeholder="粘贴 PEM 格式私钥内容" style="width:100%" />
          </ReFormItem>
        </template>

        <!-- ─── 分组与标签 ─── -->
        <div class="form-section full">分组与标签</div>
        <ReFormItem label="分组">
          <ReSelect v-model="form.serverGroupId" size="small" clearable placeholder="未分组" style="width:100%" :options="props.groupOptions" />
        </ReFormItem>
        <ReFormItem label="标签">
          <ReInput v-model="tagsText" placeholder="逗号分隔，如 prod,db,linux" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="描述" class="col-span-2">
          <ReInput v-model="form.serverHostDescription" type="textarea" :rows="1" placeholder="主机用途 / 备注（可选）" style="width:100%" />
        </ReFormItem>
      </div>
    </ReForm>
    <template #footer>
      <ReButton @click="emit('update:modelValue', false)">取消</ReButton>
      <ReButton type="primary" :loading="formSaving" @click="submitForm" icon="Check" :show-text="true">保存</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped lang="scss">
/* 弹窗表单两列布局（从 AssetsView 迁入，三列改为两列） */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
  padding: 8px 8px 8px;
}
/* 上下布局：label 独占一行在上，控件在下 */
.form-vertical {
  :deep(.el-form-item) {
    display: block;
    width: 100%;
    margin-bottom: 14px;
  }
  :deep(.el-form-item__label) {
    display: block;
    height: auto;
    margin-bottom: 6px;
    line-height: 1.4;
    padding: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  :deep(.el-form-item__content > .re-input),
  :deep(.el-form-item__content > .el-input-number) {
    width: 100%;
  }
}
/* 分节标题：左侧品牌色竖条 + 留白 */
.form-section {
  position: relative;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 0 0 8px 12px;
  margin-top: 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.form-section::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 10px;
  width: 3px;
  border-radius: 2px;
  background: var(--brand-500, #6d5dfc);
}
.form-section:first-child {
  margin-top: 0;
}
.form-section.full {
  grid-column: 1 / -1;
}
.col-span-2 {
  grid-column: span 2;
}
</style>
