<template>
  <div class="ngt">
    <ReAlert type="info" class="ngt-alert">
      <template #title>
        不确定怎么写？挑一个最接近你需求的模板，填几个空就能生成一份能直接用的配置。
        生成后建议先在测试机用「校验配置」确认，再重载。
      </template>
    </ReAlert>

    <div class="ngt-grid">
      <div
        v-for="t in templates"
        :key="t.key"
        class="ngt-card"
        :class="{ active: picked?.key === t.key }"
        @click="pick(t)"
      >
        <div class="ngx-card-head">
          <span class="ngx-card-title">{{ t.title }}</span>
          <ReTag :type="t.difficulty === 'easy' ? 'success' : 'warning'">
            {{ t.difficulty === "easy" ? "简单" : "进阶" }}
          </ReTag>
        </div>
        <div class="ngt-summary">{{ t.summary }}</div>
        <div class="ngt-scene">适用：{{ t.scene }}</div>
      </div>
    </div>

    <!-- 向导 -->
    <ReDialog
      v-model="wizardVisible"
      :title="picked ? `向导：${picked.title}` : '向导'"
      width="760px"
      :height="600"
    >
      <div v-if="picked" class="ngw">
        <div class="ngw-steps">
          <div
            v-for="(label, i) in ['填写参数', '确认配置', '保存']"
            :key="i"
            class="ngw-step"
            :class="{ active: step === i, done: step > i }"
          >
            <span class="ngw-step-no">{{ step > i ? "✓" : i + 1 }}</span>
            <span>{{ label }}</span>
          </div>
        </div>

        <!-- 第 1 步：填参数 -->
        <div v-show="step === 0" class="ngw-body">
          <div class="ngw-intro">{{ picked.summary }}</div>
          <ReForm label-width="150px">
            <ReFormItem
              v-for="f in fields"
              :key="f"
              :label="fieldLabel(f)"
              :required="true"
            >
              <ReInput
                v-model="form[f]"
                :placeholder="fieldPlaceholder(f)"
                @update:model-value="onFieldInput"
              />
              <div class="ngw-hint">{{ fieldHint(f) }}</div>
            </ReFormItem>
          </ReForm>
        </div>

        <!-- 第 2 步：确认 -->
        <div v-show="step === 1" class="ngw-body">
          <ReAlert
            :type="missing.length ? 'error' : 'success'"
            :title="missing.length ? `还有必填项没填：${missing.join('、')}` : '参数已齐，下面就是将要写入的配置'"
          />
          <pre class="ngw-conf mono">{{ rendered }}</pre>
          <ul v-if="picked.tips.length" class="ngw-tips">
            <li v-for="(t, i) in picked.tips" :key="i">{{ t }}</li>
          </ul>
        </div>

        <!-- 第 3 步：保存 -->
        <div v-show="step === 2" class="ngw-body">
          <ReForm label-width="150px">
            <ReFormItem label="写入文件" required>
              <ReSelect v-model="targetPath" filterable allow-create placeholder="选择或输入目标 .conf 路径">
                <ReOption v-for="f in files" :key="f.path" :value="f.path" :label="f.path" />
              </ReSelect>
            </ReFormItem>
            <ReFormItem label="保存前备份">
              <ReSwitch v-model="optBackup" />
              <span class="ngw-hint">强烈建议开启。配置写错了可以从「备份」页回退。</span>
            </ReFormItem>
            <ReFormItem label="保存后校验">
              <ReSwitch v-model="optValidate" />
              <span class="ngw-hint">用 nginx -t 检查语法，不通过就不会生效。</span>
            </ReFormItem>
            <ReFormItem label="校验通过后重载">
              <ReSwitch v-model="optReload" />
              <span class="ngw-hint">勾上后一步到位；建议先只校验，确认无误再手动重载。</span>
            </ReFormItem>
          </ReForm>
          <ReAlert
            v-if="!targetPath"
            type="warning"
            title="请选择要写入的配置文件路径"
          />
        </div>
      </div>

      <template #footer>
        <ReButton @click="wizardVisible = false">取消</ReButton>
        <ReButton v-if="step > 0" @click="step--">上一步</ReButton>
        <ReButton v-if="step === 0" type="primary" :disabled="missing.length > 0" @click="step = 1">
          下一步
        </ReButton>
        <ReButton v-else-if="step === 1" type="primary" @click="step = 2">下一步</ReButton>
        <ReButton v-else type="primary" :loading="saving" :disabled="!targetPath" @click="doSave">
          写入配置
        </ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReForm from "@repo/ui/re-form";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTag from "@repo/ui/re-tag";
import { ReAlert, ReFormItem, ReOption } from "@repo/ui/re-kit";
import {
  applyNginxConfig,
  fetchNginxConfigFiles,
  fetchNginxTemplates,
  type NginxApplyResult,
  type NginxConfigFile,
  type NginxTemplate,
} from "../../api/nginx/api";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
}>();

const emit = defineEmits<{
  (e: "saved", result: NginxApplyResult): void;
}>();

/** 每个占位符的中文标签与提示，缺省则直接显示占位符名 */
const FIELD_META: Record<string, { label: string; hint: string; placeholder: string }> = {
  DOMAIN: { label: "域名", hint: "用户浏览器里输入的地址，例如 www.example.com", placeholder: "www.example.com" },
  ROOT: { label: "网站目录", hint: "网页文件在服务器上的绝对路径", placeholder: "/var/www/html" },
  UPSTREAM: { label: "后端地址", hint: "要转发到的后端，如 http://127.0.0.1:3000", placeholder: "http://127.0.0.1:3000" },
  LOCATION: { label: "路径前缀", hint: "只有这个前缀的请求会被转发；填 / 表示全部", placeholder: "/" },
  TIMEOUT: { label: "超时时间", hint: "等待后端响应的最长时间，跑批任务要调大", placeholder: "60s" },
  API_PREFIX: { label: "接口前缀", hint: "后端接口的路径前缀，末尾带斜杠", placeholder: "/api/" },
  API_UPSTREAM: { label: "后端地址", hint: "后端服务地址", placeholder: "http://127.0.0.1:8080" },
  CERT_PATH: { label: "证书路径", hint: "fullchain.pem 的绝对路径", placeholder: "/etc/letsencrypt/live/example.com/fullchain.pem" },
  KEY_PATH: { label: "私钥路径", hint: "privkey.pem 的绝对路径", placeholder: "/etc/letsencrypt/live/example.com/privkey.pem" },
  WEBROOT: { label: "验证目录", hint: "证书自动续签用的目录，一般是 /var/www/html", placeholder: "/var/www/html" },
  UPSTREAM_NAME: { label: "上游名", hint: "给这组后端起的名字，proxy_pass 里会引用它", placeholder: "backend" },
  BACKEND1: { label: "后端 1", hint: "第一台后端地址", placeholder: "10.0.0.11:8080" },
  BACKEND2: { label: "后端 2", hint: "第二台后端地址", placeholder: "10.0.0.12:8080" },
  PASSWD_FILE: { label: "密码文件", hint: "用 htpasswd 工具生成", placeholder: "/etc/nginx/.htpasswd" },
  MAX_SIZE: { label: "最大上传", hint: "允许的上传体积，默认只有 1m", placeholder: "100m" },
  UPLOAD_PATH: { label: "上传路径", hint: "上传接口的路径", placeholder: "/upload/" },
};

const templates = ref<NginxTemplate[]>([]);
const files = ref<NginxConfigFile[]>([]);
const picked = ref<NginxTemplate | null>(null);
const wizardVisible = ref(false);
const step = ref(0);
const form = ref<Record<string, string>>({});
const targetPath = ref("");
const optBackup = ref(true);
const optValidate = ref(true);
const optReload = ref(false);
const saving = ref(false);

const fields = computed(() => picked.value?.requiredFields || []);
const missing = computed(() => fields.value.filter(f => !form.value[f]?.trim()));
const rendered = computed(() => {
  let out = picked.value?.content || "";
  for (const [k, v] of Object.entries(form.value)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
});

function fieldLabel(f: string): string {
  return FIELD_META[f]?.label || f;
}

function fieldHint(f: string): string {
  return FIELD_META[f]?.hint || "";
}

function fieldPlaceholder(f: string): string {
  return FIELD_META[f]?.placeholder || "";
}

function onFieldInput() {
  // 占位符替换是纯计算，v-model 已更新；这里留作将来加实时校验的挂点
}

function pick(t: NginxTemplate) {
  picked.value = t;
  form.value = {};
  step.value = 0;
  targetPath.value = files.value.find(f => /conf\.d|\/sites-enabled/.test(f.path))?.path
    || files.value[0]?.path
    || "";
  wizardVisible.value = true;
}

async function load() {
  if (!props.datasourceId) {
    return;
  }
  try {
    const [t, f] = await Promise.allSettled([
      fetchNginxTemplates(),
      fetchNginxConfigFiles(props.datasourceId),
    ]);
    templates.value = t.status === "fulfilled" ? t.value || [] : [];
    files.value = f.status === "fulfilled" ? f.value || [] : [];
  } catch (e) {
    ElMessage.error(`读取模板失败：${(e as Error).message}`);
  }
}

async function doSave() {
  if (!props.datasourceId || !picked.value || !targetPath.value) {
    return;
  }
  saving.value = true;
  try {
    const r = await applyNginxConfig({
      datasourceId: props.datasourceId,
      path: targetPath.value,
      mode: "FILE",
      content: rendered.value,
      backup: optBackup.value,
      validate: optValidate.value,
      reload: optReload.value,
    });
    wizardVisible.value = false;
    if (r.saved) {
      ElMessage.success(r.message);
      emit("saved", r);
    } else {
      ElMessage.error(r.message);
    }
  } catch (e) {
    ElMessage.error(`写入失败：${(e as Error).message}`);
  } finally {
    saving.value = false;
  }
}

watch(() => props.datasourceId, load, { immediate: true });

defineExpose({ load, templates });
</script>

<style scoped lang="scss">
.ngt {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.ngt-alert {
  margin: 0;
}

.ngt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 6px;
}

.ngt-card {
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  cursor: pointer;
  transition: border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--brand-500) 35%, transparent);
    background: var(--brand-50);
  }

  &.active {
    border-color: var(--brand-500);
    background: var(--brand-50);
  }
}

/* 卡片头：与总览面板同名同款，保证跨面板一致 */
.ngx-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ngx-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.ngt-summary {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.ngt-scene {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 向导 */
.ngw {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ngw-steps {
  display: flex;
  gap: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.ngw-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-secondary);

  &.active {
    color: var(--brand-500);
    font-weight: 600;
  }

  &.done {
    color: var(--status-success);
  }
}

.ngw-step-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 1px solid currentColor;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.ngw-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ngw-intro {
  font-size: 12.5px;
  color: var(--text-secondary);
}

.ngw-hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-top: 2px;
}

.ngw-conf {
  margin: 0;
  padding: 12px;
  max-height: 300px;
  overflow: auto;
  border-radius: 6px;
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  font-size: 12px;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
  white-space: pre-wrap;
  word-break: break-all;
}

.ngw-tips {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-secondary);

  li::marker {
    color: var(--brand-500);
  }
}
</style>
