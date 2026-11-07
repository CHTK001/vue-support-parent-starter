<!--
  APM 设置 —— 引擎开关、选型与「可热改」的引擎参数。

  为什么需要这一页：在此之前 plugin.apm.* 与 skywalking.url 只能靠启动参数决定，
  页面上只能看 /status。改个 OAP 地址要改脚本 + 重启进程，而重启会打断正在看的观测台。

  这里只放**运行期能生效**的项（enabled / type / detectInterval / 引擎级如 oapUrl），
  mode / path / port / serverType / host / settingsFile 决定 Servlet 与端口的注册方式，
  进程内改不了，因此只读展示并明确标注「需重启」——给个能点但没用的输入框比不给更糟。

  本页**不包 ApmGate**：模块关掉之后必须还能进来把它打开，而 ApmGate 在 present=false
  时会渲染降级视图，把设置入口一起挡住。/config 接口在「模块关闭」与「无引擎」时都能用。
-->
<template>
  <div class="apm-page">
    <ReSectionHead description="引擎开关、选型与可热改参数；进程级设置只读展示">
      <template #title>APM 设置</template>
      <template #actions>
        <!-- 页头只留「保存」：打开页面就已经读过设置，保存后也会把最新状态取回来，
             因此「刷新」不是日常动作；「重新探测」属于状态卡自己的操作，贴到那张卡头上。 -->
        <ReButton icon="Check" type="primary" show-text :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReSectionHead>

    <ReSkeleton v-if="loading && !settings" :rows="8" animated />

    <!-- 读不到设置 ≠ 没有 APM：一个是后端不可达，一个是设置文件问题，措辞必须分开 -->
    <div v-else-if="loadError" class="settings-error">
      <h3 class="settings-error__title">无法读取 APM 设置</h3>
      <p class="settings-error__msg">{{ loadError }}</p>
      <ReButton icon="Refresh" @click="load">重试</ReButton>
    </div>

    <template v-else-if="settings">
      <!-- 保存结果：落盘失败必须在页内常驻，toast 一闪而过会被当成成功 -->
      <div v-if="persistWarning" class="settings-notice is-warn">
        {{ persistWarning }}
      </div>

      <!-- 当前引擎状态 -->
      <div class="apm-card">
        <div class="apm-card-head">
          <span class="apm-card-h">当前状态</span>
          <span class="apm-bar__spacer" />
          <ReTag :type="settings.present ? 'primary' : 'info'" round>
            {{ settings.present ? "已连接" : "未连接" }}
          </ReTag>
          <ReTag :type="settings.enabled ? 'primary' : 'info'" round>
            {{ settings.enabled ? "模块已开启" : "模块已关闭" }}
          </ReTag>
          <!-- 两个动作都只影响「这张卡显示的当前状态」，因此放在卡头而不是页头 -->
          <ReButton
            icon="Aim"
            text
            :loading="detecting"
            title="清掉探测缓存并立即重新探活"
            @click="detect"
          >
            重新探测
          </ReButton>
          <ReButton icon="Refresh" text :loading="loading" title="从服务端重新读取设置" @click="load">
            重新读取
          </ReButton>
        </div>
        <div class="apm-kv">
          <div class="apm-kv__row">
            <span class="apm-kv__key">当前引擎</span>
            <span class="apm-mono">{{ settings.engine.name || "无" }}</span>
          </div>
          <div class="apm-kv__row">
            <span class="apm-kv__key">运行方式</span>{{ settings.engine.mode || "—" }}
          </div>
          <div class="apm-kv__row">
            <span class="apm-kv__key">版本</span>{{ settings.engine.version || "—" }}
          </div>
          <div class="apm-kv__row">
            <span class="apm-kv__key">端点</span>
            <span class="apm-mono">{{ settings.engine.endpoint || "—" }}</span>
          </div>
        </div>
        <p v-if="!settings.present" class="apm-muted settings-hint">
          {{ settings.message || "没有探测到可用的 APM 引擎。可在下方换一个引擎，或到引擎侧确认 OAP / agent 是否在运行。" }}
        </p>
      </div>

      <!-- 可热改项 -->
      <div class="apm-card">
        <div class="apm-card-head">
          <span class="apm-card-h">可运行期修改</span>
          <span class="apm-card-note">保存后立即生效，并写入设置文件供下次启动套用（受启动参数固定的项除外）</span>
        </div>

        <div class="settings-row">
          <label class="settings-label">APM 模块</label>
          <ReSwitch v-model="form.enabled" :disabled="settings.enabledLocked" />
          <span class="apm-muted">
            关闭后只有「状态」与「设置」接口可用，其余查询会明确提示模块已关闭
          </span>
        </div>
        <div v-if="settings.enabledLocked" class="settings-hint is-lock">
          开关由部署侧锁定（<span class="apm-mono">-Dplugin.apm.enabled.locked=true</span>）：
          设置文件不覆盖启动参数，页面上的修改重启后不会保留。
          要让这里的选择长期生效，请从启动参数里去掉该锁定。
        </div>

        <div class="settings-row">
          <label class="settings-label">引擎</label>
          <ReSelect
            v-model="form.type"
            :options="engineOptions"
            placeholder="自动选择"
            style="width: 320px"
          />
          <span class="apm-muted">留空 / 选「自动」= 按优先级取第一个可用引擎</span>
        </div>
        <div v-if="settings.typeFromDeployment" class="settings-hint is-lock">
          引擎由启动参数固定（
          <span class="apm-mono">-Dplugin.apm.type={{ settings.deploymentType }}</span>
          ）：这里的选择只对本次运行有效，重启后会回到启动参数。
          要让页面选择长期生效，请从启动参数里去掉 <span class="apm-mono">plugin.apm.type</span>。
        </div>

        <div class="settings-row">
          <label class="settings-label">探测缓存</label>
          <ReInputNumber
            v-model="form.detectInterval"
            layout="default"
            :min="1000"
            :step="1000"
            style="width: 200px"
          />
          <span class="apm-muted">状态接口的缓存时长（单位毫秒），最小 1000 毫秒（再小等于每次请求都去探活）</span>
        </div>
      </div>

      <!-- APM 数据源地址：SkyWalking OAP。独立成卡而不是埋在「引擎参数」里 ——
           它是整套观测的入口地址，排障时第一个要看/要改的就是它；放到最后一行
           很容易在候选引擎不可用时被当成「没配过」。 -->
      <div v-if="showOapCard" class="apm-card">
        <div class="apm-card-head">
          <span class="apm-card-h">APM 数据源地址</span>
          <span class="apm-card-note">SkyWalking OAP 查询地址 · 保存后立即生效并写入设置文件</span>
        </div>
        <div v-if="settings.oapUrlFromDeployment" class="settings-hint is-lock">
          该地址当前由启动参数指定（<span class="apm-mono">-Dskywalking.url</span> /
          <span class="apm-mono">SW_OAP_ADDRESS</span>）：这里修改本次运行立即生效，
          重启后会回到启动参数的值。
        </div>
        <div class="settings-row">
          <label class="settings-label">OAP 地址</label>
          <ReInput
            v-model="form.engine.oapUrl"
            placeholder="http://127.0.0.1:12800"
            style="width: 360px"
          />
          <span class="apm-muted">支持 http/https，末尾的 /graphql 会自动去掉；留空不改</span>
        </div>
      </div>

      <!-- 引擎级参数：键由 Provider 自己声明，前端不写死 skywalking -->
      <div class="apm-card">
        <div class="apm-card-head">
          <span class="apm-card-h">引擎参数</span>
          <span class="apm-card-note">
            {{ settings.engine.name ? `由引擎 ${settings.engine.name} 声明` : "当前没有引擎声明可改项" }}
          </span>
        </div>

        <template v-if="engineParamKeys.length">
          <div v-if="settings.oapUrlFromDeployment && engineParamKeys.includes('oapUrl')" class="settings-hint is-lock">
            OAP 地址当前由启动参数指定（<span class="apm-mono">-Dskywalking.url</span> /
            <span class="apm-mono">SW_OAP_ADDRESS</span>）：这里修改本次运行立即生效，
            重启后会回到启动参数的值。
          </div>
          <div v-for="key in engineParamKeys" :key="key" class="settings-row">
            <label class="settings-label">{{ labelOf(key) }}</label>
            <ReInput
              v-model="form.engine[key]"
              :placeholder="placeholderOf(key)"
              style="width: 320px"
            />
            <span class="apm-muted">{{ hintOf(key) }}</span>
          </div>
        </template>
        <p v-else class="apm-muted settings-hint">
          当前引擎没有声明可热改参数。切到 SkyWalking 后会出现 OAP 地址与超时。
        </p>
      </div>

      <!-- 引擎候选：不可用的原因必须写出来，否则「选了却没反应」无从排查 -->
      <div class="apm-card">
        <div class="apm-card-head">
          <span class="apm-card-h">候选引擎</span>
          <span class="apm-card-note">按优先级排序</span>
        </div>
        <div v-for="item in settings.candidates" :key="item.name" class="settings-candidate">
          <ReTag :type="item.available ? 'primary' : 'info'" round>
            {{ item.available ? "可用" : "不可用" }}
          </ReTag>
          <span class="apm-mono">{{ item.name }}</span>
          <span class="apm-muted">{{ item.mode }} · {{ item.version || "版本未知" }}</span>
          <span class="apm-muted">{{ item.endpoint || "—" }}</span>
          <span v-if="!item.available && item.message" class="apm-warn settings-candidate__msg">
            {{ item.message }}
          </span>
        </div>
        <p v-if="!settings.candidates.length" class="apm-muted settings-hint">
          没有引入任何 APM 引擎：需要在后端依赖里加上对应 starter（如 spring-support-apm-skywalking-starter）。
        </p>
      </div>

      <!-- 需重启项：只读，避免给个点了不生效的输入框 -->
      <div class="apm-card">
        <div class="apm-card-head">
          <span class="apm-card-h">进程级设置</span>
          <span class="apm-card-note">改这些必须重启服务，因此只做展示</span>
        </div>
        <div class="apm-kv">
          <div class="apm-kv__row"><span class="apm-kv__key">运行模式</span>{{ settings.mode }}</div>
          <div class="apm-kv__row"><span class="apm-kv__key">接口前缀</span><span class="apm-mono">{{ settings.path }}</span></div>
          <div class="apm-kv__row"><span class="apm-kv__key">监听地址</span><span class="apm-mono">{{ settings.host }}:{{ settings.port }}</span></div>
          <div class="apm-kv__row"><span class="apm-kv__key">服务实现</span>{{ settings.serverType }}</div>
          <div class="apm-kv__row settings-wide">
            <span class="apm-kv__key">设置文件</span><span class="apm-mono">{{ settings.settingsFile }}</span>
          </div>
        </div>
        <p class="apm-muted settings-hint">
          设置文件里已保存：
          <span v-if="savedEntries.length" class="apm-mono">{{ savedText }}</span>
          <span v-else>（空，尚未从界面保存过）</span>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReSwitch from "@repo/ui/re-switch";
import ReTag from "@repo/ui/re-tag";
import { detectApm, getApmSettings, saveApmSettings } from "../api/apmApi";
import type { ApmEngineSettings, ApmSettings, ApmSettingsInput } from "../api/apmApi";
import { refreshApmStatus } from "../composables/useApmStatus";

const loading = ref(false);
const saving = ref(false);
const detecting = ref(false);
const loadError = ref("");
const persistWarning = ref("");
const settings = ref<ApmSettings | null>(null);

const form = reactive({
  enabled: true,
  type: "",
  detectInterval: 10_000,
  engine: {} as Record<string, string>,
});

/** 引擎级参数的键：取「当前引擎 + 全部候选」的并集，切引擎前也能先配地址 */
const engineKeys = computed(() => {
  const keys: string[] = [];
  const collect = (source?: ApmEngineSettings) => {
    for (const key of Object.keys(source ?? {})) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
  };
  collect(settings.value?.engine.settings);
  for (const item of settings.value?.candidates ?? []) {
    collect(item.settings);
  }
  return keys;
});

/** 是否展示「APM 数据源地址」卡：SkyWalking 出现（当前引擎 / 已声明 oapUrl / 候选）时 */
const showOapCard = computed(() => {
  const s = settings.value;
  if (!s) return false;
  return (
    s.type === "skywalking" ||
    engineKeys.value.includes("oapUrl") ||
    (s.candidates ?? []).some((item) => item.name === "skywalking")
  );
});

/** 通用引擎参数：oapUrl 已单独成卡，这里排掉，避免同一字段出现两个输入框 */
const engineParamKeys = computed(() => engineKeys.value.filter((key) => key !== "oapUrl"));

/** 保存时要提交的引擎键：声明过的键 + 地址卡出现时的 oapUrl */
const formKeys = computed(() => {
  const keys = [...engineKeys.value];
  if (showOapCard.value && !keys.includes("oapUrl")) {
    keys.push("oapUrl");
  }
  return keys;
});

/**
 * 引擎下拉。
 *
 * <p>不可用的候选**不禁用**：固定一个「已引入但连不上」的引擎是排障手段 ——
 * 选中后 /status 会把这个引擎的原因原话带出来。禁用下拉只会让人以为没装。</p>
 */
const engineOptions = computed(() => {
  const list = [{ label: "自动（第一个可用引擎）", value: "" }];
  for (const item of settings.value?.candidates ?? []) {
    const reason = (item.message || "").trim();
    const suffix = item.available ? "" : `（不可用${reason ? `：${short(reason)}` : ""}）`;
    list.push({ label: `${item.name}${suffix}`, value: item.name });
  }
  const current = settings.value?.type ?? "";
  if (current && !list.some((item) => item.value === current)) {
    list.push({ label: `${current}（未引入）`, value: current });
  }
  return list;
});

const savedEntries = computed(() => Object.entries(settings.value?.saved ?? {}));

const savedText = computed(() =>
  savedEntries.value.map(([key, value]) => `${key}=${value || '""'}`).join("　"),
);

/** 参数键 → 界面文案 */
function labelOf(key: string): string {
  const labels: Record<string, string> = {
    oapUrl: "OAP 地址",
    oapTimeout: "查询超时",
  };
  return labels[key] || key;
}

/** 参数键 → 占位文案 */
function placeholderOf(key: string): string {
  const placeholders: Record<string, string> = {
    oapUrl: "http://127.0.0.1:12800",
    oapTimeout: "10000",
  };
  return placeholders[key] || "留空表示保持当前值";
}

/** 参数键 → 说明 */
function hintOf(key: string): string {
  const hints: Record<string, string> = {
    oapUrl: "留空不改；支持 http/https，末尾的 /graphql 会自动去掉",
    oapTimeout: "毫秒；留空不改。鉴权信息属于部署机密，请在部署配置里提供",
  };
  return hints[key] || "留空表示保持当前值";
}

function short(text: string, max = 48): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 把后端返回的设置套到表单上 */
function apply(data: ApmSettings) {
  settings.value = data;
  form.enabled = data.enabled;
  form.type = data.type ?? "";
  form.detectInterval = data.detectInterval || 10_000;
  const engine: Record<string, string> = {};
  for (const key of Object.keys(data.engine?.settings ?? {})) {
    engine[key] = data.engine.settings[key] ?? "";
  }
  // 未选中引擎时用「上次保存的值」回填，避免输入框全空、看起来像没配过
  for (const [key, value] of Object.entries(data.saved ?? {})) {
    if (engine[key] === undefined || engine[key] === "") {
      engine[key] = value ?? "";
    }
  }
  // 全部候选引擎声明过的键都要有初值，否则输入框绑到 undefined，看着像禁用
  for (const item of data.candidates ?? []) {
    for (const key of Object.keys(item.settings ?? {})) {
      if (engine[key] === undefined) {
        engine[key] = "";
      }
    }
  }
  // 地址卡始终要有可绑定的初值：候选没声明 oapUrl 时也不至于绑到 undefined
  if (engine.oapUrl === undefined) {
    engine.oapUrl = "";
  }
  form.engine = engine;
}

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    apply(await getApmSettings());
  } catch (e) {
    loadError.value = (e as Error)?.message || String(e);
  } finally {
    loading.value = false;
  }
}

function buildInput(): ApmSettingsInput {
  const engineSettings: ApmEngineSettings = {};
  for (const key of formKeys.value) {
    engineSettings[key] = (form.engine[key] ?? "").trim();
  }
  return {
    enabled: form.enabled,
    type: form.type,
    detectInterval: Math.round(Number(form.detectInterval) || 0),
    engineSettings,
  };
}

async function save() {
  const interval = Math.round(Number(form.detectInterval) || 0);
  if (!Number.isFinite(interval) || interval < 1000) {
    message.warning("探测缓存不能小于 1000 毫秒");
    return;
  }
  saving.value = true;
  persistWarning.value = "";
  try {
    const data = await saveApmSettings(buildInput());
    apply(data);
    // 其它页签共用同一份状态：开关/引擎改完要让它立刻跟上，不能等 15 秒缓存过期
    await refreshApmStatus();
    if (data.persisted === false) {
      persistWarning.value = data.persistMessage || "设置已生效，但写入设置文件失败（重启后会丢失）";
      message.warning("设置已生效，但落盘失败");
    } else {
      message.success("APM 设置已保存");
    }
  } catch (e) {
    message.error(`保存失败：${(e as Error)?.message ?? e}`);
  } finally {
    saving.value = false;
  }
}

async function detect() {
  detecting.value = true;
  try {
    const data = await detectApm();
    apply(data);
    await refreshApmStatus();
    message.success(data.present ? `探测完成：${data.engine.name} 可用` : "探测完成：没有可用的 APM 引擎");
  } catch (e) {
    message.error(`探测失败：${(e as Error)?.message ?? e}`);
  } finally {
    detecting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.settings-label {
  flex: 0 0 96px;
  font-size: 13px;
  color: var(--apm-faint, var(--el-text-color-secondary));
}

.settings-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.settings-hint.is-lock {
  padding: 8px 12px;
  border-radius: var(--apm-radius, 8px);
  border: 1px dashed var(--el-color-warning-light-5, #e6a23c);
  background: var(--el-color-warning-light-9, #fdf6ec);
  color: var(--el-color-warning-dark-2, #b88230);
}

.settings-wide {
  grid-column: 1 / -1;
}

.settings-candidate {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
  padding: 4px 0;
  border-top: 1px dashed var(--apm-line, var(--el-border-color-lighter));
}

.settings-candidate:first-of-type {
  border-top: 0;
}

.settings-candidate__msg {
  min-width: 0;
  white-space: pre-wrap;
}

.settings-notice {
  padding: 10px 14px;
  border-radius: var(--apm-radius, 8px);
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid var(--el-color-warning-light-5, #e6a23c);
  background: var(--el-color-warning-light-9, #fdf6ec);
  color: var(--el-color-warning-dark-2, #b88230);
}

.settings-error {
  padding: 18px 16px;
  border-radius: var(--apm-radius, 8px);
  border: 1px solid var(--el-color-danger-light-5, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}

.settings-error__title {
  margin: 0 0 6px;
  font-size: 15px;
  color: var(--el-color-danger-dark-2, #c45656);
}

.settings-error__msg {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}
</style>
