<template>
  <sc-dialog
    v-model="visibleInner"
    title="服务发现配置"
    width="960px"
    :close-on-click-modal="false"
    @close="handleClose"
    draggable
  >
    <div class="fc-container thin-scroller">
      <!-- 发现模式选择 -->
      <div class="fc-mode-section">
        <div class="fc-mode-label">选择服务发现模式</div>
        <div class="fc-mode-cards">
          <div v-for="mode in modeOptions" :key="mode.value" class="fc-mode-card" :class="{ active: config.serviceDiscoveryMode === mode.value }" @click="config.serviceDiscoveryMode = mode.value">
            <div class="fc-mode-icon">
              <IconifyIconOnline :icon="mode.icon" />
            </div>
            <div class="fc-mode-content">
              <div class="fc-mode-title">{{ mode.label }}</div>
              <div class="fc-mode-desc">{{ mode.describe }}</div>
            </div>
            <div v-if="config.serviceDiscoveryMode === mode.value" class="fc-mode-check">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </div>
      </div>

      <!-- 基础配置 -->
      <div class="fc-section">
        <div class="fc-section-lead">
          <div class="fc-lead-icon"><IconifyIconOnline icon="ri:settings-3-line" /></div>
          <div class="fc-lead-text">
            <h4>基础配置</h4>
            <p>配置负载均衡策略和启用状态</p>
          </div>
        </div>
        <div class="fc-basic-row">
          <div class="fc-field">
            <label>负载均衡策略</label>
            <ScSelect v-model="config.serviceDiscoveryBalance" placeholder="请选择负载均衡策略" style="width: 100%">
              <ScOption v-for="opt in balanceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ScSelect>
          </div>
          <div class="fc-field fc-field-status">
            <label>启用状态</label>
            <div class="fc-status-switch">
              <ScSwitch v-model="config.serviceDiscoveryEnabled" />
              <span class="fc-status-text" :class="{ enabled: config.serviceDiscoveryEnabled }">
                {{ config.serviceDiscoveryEnabled ? '已启用' : '已禁用' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Monitor 服务配置 -->
      <div v-if="config.serviceDiscoveryMode === 'MONITOR'" class="fc-section">
        <div class="fc-section-lead">
          <div class="fc-lead-icon" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);"><IconifyIconOnline icon="ri:radar-line" style="color:#10b981;" /></div>
          <div class="fc-lead-text">
            <h4>Monitor 长连接配置</h4>
            <p>使用已连接的长连接节点，自动发现服务</p>
          </div>
        </div>
        <div class="fc-tips fc-tips-success">
          <div class="fc-tips-icon"><IconifyIconOnline icon="ri:lightbulb-line" /></div>
          <div class="fc-tips-content">
            <strong>推荐使用</strong>
            <span>自动发现已连接到 SyncServer 的所有节点，无需手动配置服务器地址和端口</span>
          </div>
        </div>
      </div>

      <!-- Spring Bean 配置 -->
      <div v-else-if="config.serviceDiscoveryMode === 'SPRING'" class="fc-section">
        <div class="fc-section-lead">
          <div class="fc-lead-icon" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);"><IconifyIconOnline icon="devicon:spring" style="color:#6ee7b7;" /></div>
          <div class="fc-lead-text">
            <h4>Spring Bean 配置</h4>
            <p>选择 Spring 容器中的 ServiceDiscovery 实现</p>
          </div>
        </div>
        <div class="fc-field" style="max-width: 400px;">
          <label>Bean 名称</label>
          <ScSelect v-model="config.serviceDiscoveryBeanName" placeholder="选择或输入 Bean 名称" filterable allow-create style="width: 100%">
            <ScOption v-for="opt in springBeanOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ScSelect>
        </div>
        <div class="fc-tips fc-tips-info">
          <div class="fc-tips-icon"><IconifyIconOnline icon="ri:information-line" /></div>
          <div class="fc-tips-content"><span>从 Spring 容器中获取 ServiceDiscovery 实现 Bean</span></div>
        </div>
      </div>

      <!-- 表映射配置 -->
      <div v-else-if="config.serviceDiscoveryMode === 'TABLE'" class="fc-section">
        <div class="fc-section-lead">
          <div class="fc-lead-icon" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);"><IconifyIconOnline icon="ri:table-2" style="color:#3b82f6;" /></div>
          <div class="fc-lead-text">
            <h4>服务映射配置</h4>
            <p>管理服务名称与地址的映射关系</p>
          </div>
          <ScButton type="primary" size="small" @click="addMapping" class="fc-add-btn">
            <IconifyIconOnline icon="ri:add-line" /> 新增映射
          </ScButton>
        </div>

        <div class="fc-mapping-header">
          <span class="fc-mcol-name">服务名称</span>
          <span class="fc-mcol-addr">服务地址</span>
          <span class="fc-mcol-weight">权重</span>
          <span class="fc-mcol-status">状态</span>
          <span class="fc-mcol-action">操作</span>
        </div>

        <div class="fc-mapping-list">
          <div v-for="(m, idx) in mappings" :key="idx" class="fc-mapping-row">
            <div class="fc-mcol-name">
              <ScInput v-model="m.serviceDiscoveryName" placeholder="user-service" />
            </div>
            <div class="fc-mcol-addr">
              <ScInput v-model="m.serviceDiscoveryAddress" placeholder="http://localhost:8080" />
            </div>
            <div class="fc-mcol-weight">
              <ScInputNumber v-model="m.serviceDiscoveryWeight" :min="0" :max="100" />
            </div>
            <div class="fc-mcol-status">
              <ScSwitch v-model="m.serviceDiscoveryEnabled" size="small" />
            </div>
            <div class="fc-mcol-action">
              <ScButton type="danger" size="small" text @click="mappings.splice(idx, 1)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </ScButton>
            </div>
          </div>

          <div v-if="mappings.length === 0" class="fc-empty">
            <div class="fc-empty-icon"><IconifyIconOnline icon="ri:server-line" /></div>
            <div class="fc-empty-text">
              <span>暂无服务映射</span>
              <p>点击右上角「新增映射」按钮添加服务</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Hazelcast 配置 -->
      <div v-else-if="config.serviceDiscoveryMode === 'HAZELCAST'" class="fc-section">
        <div class="fc-section-lead">
          <div class="fc-lead-icon" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);"><IconifyIconOnline icon="simple-icons:hazelcast" style="color:#f59e0b;" /></div>
          <div class="fc-lead-text">
            <h4>Hazelcast 集群配置</h4>
            <p>配置 Hazelcast 集群连接参数</p>
          </div>
        </div>
        <div class="fc-detail-grid">
          <div class="fc-field">
            <label>集群名称</label>
            <ScInput v-model="config.serviceDiscoveryHazelcastClusterName" placeholder="如: dev-cluster">
              <template #prefix><IconifyIconOnline icon="ri:team-line" /></template>
            </ScInput>
          </div>
          <div class="fc-field">
            <label>端口</label>
            <ScInputNumber v-model="config.serviceDiscoveryHazelcastPort" :min="1" :max="65535" placeholder="5701" style="width: 100%" />
          </div>
          <div class="fc-field fc-field-full">
            <label>成员地址</label>
            <ScInput v-model="config.serviceDiscoveryHazelcastMembers" placeholder="如: 192.168.1.100:5701,192.168.1.101:5701">
              <template #prefix><IconifyIconOnline icon="ri:links-line" /></template>
            </ScInput>
          </div>
          <div class="fc-field">
            <label>连接超时 (秒)</label>
            <ScInputNumber v-model="config.serviceDiscoveryHazelcastTimeout" :min="1" :max="300" placeholder="30" style="width: 100%" />
          </div>
        </div>
        <div class="fc-tips fc-tips-warning">
          <div class="fc-tips-icon"><IconifyIconOnline icon="ri:alert-line" /></div>
          <div class="fc-tips-content">
            <strong>注意</strong>
            <span>需要确保 Hazelcast 集群已启动，并且网络可达</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="fc-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">保存配置</ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@repo/utils";
import {
  getServiceDiscoveryConfig, saveServiceDiscoveryConfig,
  getServiceDiscoveryMappings, saveServiceDiscoveryMappings,
  type ServiceDiscoveryConfig, type ServiceDiscoveryMapping,
} from "@/api/system-server-setting";
import { fetchOptionObjectsList } from "@/api/spi";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScOption } from "@repo/components/ScOption";

interface Props { visible: boolean; serverId: number; }
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const config = ref<ServiceDiscoveryConfig>({ serviceDiscoveryServerId: 0, serviceDiscoveryMode: "SPRING", serviceDiscoveryEnabled: true, serviceDiscoveryBalance: "weight" });
const mappings = ref<ServiceDiscoveryMapping[]>([]);
type Option = { name: string; value?: string; label?: string; describe?: string; };
const modeOptions = ref<Option[]>([{ name: "MONITOR", label: "Monitor 长连接", icon: "ri:radar-line", describe: "使用 SyncServer 长连接的在线节点" }, { name: "SPRING", label: "Spring Bean", icon: "devicon:spring", describe: "使用 Spring 容器中的 ServiceDiscovery Bean" }, { name: "TABLE", label: "表模式", icon: "ri:table-2", describe: "使用数据库映射表维护服务清单" }, { name: "HAZELCAST", label: "Hazelcast", icon: "simple-icons:hazelcast", describe: "基于 Hazelcast 集群的服务发现" }].map(it => ({ ...it, value: it.name })));
const balanceOptions = ref<Option[]>([]);
const springBeanOptions = ref<Option[]>([]);

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  config.value = { serviceDiscoveryServerId: props.serverId, serviceDiscoveryMode: "MONITOR", serviceDiscoveryEnabled: true, serviceDiscoveryBalance: "weight", serviceDiscoveryMonitorHost: "localhost", serviceDiscoveryMonitorPort: 9999, serviceDiscoveryHazelcastPort: 5701, serviceDiscoveryHazelcastTimeout: 30 };
  mappings.value = [];
  try {
    const cfg = await getServiceDiscoveryConfig(props.serverId);
    if (cfg.success && Array.isArray(cfg.data) && cfg.data.length > 0) {
      config.value = { ...config.value, ...cfg.data[0] };
      if (config.value.serviceDiscoveryMode === "DEFAULT") config.value.serviceDiscoveryMode = "TABLE";
    }
    if (config.value.serviceDiscoveryMode === "TABLE" || config.value.serviceDiscoveryMode === "DEFAULT") {
      const mp = await getServiceDiscoveryMappings(props.serverId);
      if (mp.success && Array.isArray(mp.data)) mappings.value = mp.data;
    }
    await Promise.all([loadBalanceOptions(), loadSpringBeanOptions()]);
  } catch { /* ignore */ }
}

function addMapping() { mappings.value.push({ serviceDiscoveryName: "", serviceDiscoveryAddress: "", serviceDiscoveryEnabled: true }); }

async function handleSave() {
  loading.value = true;
  try {
    config.value.serviceDiscoveryServerId = props.serverId;
    const res = await saveServiceDiscoveryConfig(config.value);
    if (!res.success) { message(res.msg || "保存失败", { type: "error" }); return; }
    if (config.value.serviceDiscoveryMode === "TABLE" || config.value.serviceDiscoveryMode === "DEFAULT") {
      const r = await saveServiceDiscoveryMappings(props.serverId, mappings.value);
      if (!r.success) { message(r.msg || "保存映射失败", { type: "error" }); return; }
    }
    message("保存成功，已热应用", { type: "success" });
    emit("success");
    visibleInner.value = false;
  } finally { loading.value = false; }
}

function handleClose() { visibleInner.value = false; }

async function loadBalanceOptions() {
  try {
    const res = await fetchOptionObjectsList({ type: "robin" });
    if (res?.success) {
      const list = (res.data || []).map((it: any) => { if (typeof it === "string") return { name: it, value: it, label: it }; const n = it?.name ?? it?.value ?? it?.label; return { name: n, value: n, label: it?.label ?? n, describe: it?.describe ?? it?.label }; }).filter((it: any) => !!it.name);
      const seen = new Set<string>();
      balanceOptions.value = list.filter((it: any) => seen.has(it.name) ? false : (seen.add(it.name), true));
      if (!config.value.serviceDiscoveryBalance && balanceOptions.value.length > 0) config.value.serviceDiscoveryBalance = balanceOptions.value[0].name as any;
    }
  } catch {}
}

async function loadSpringBeanOptions() {
  try {
    const res = await fetchOptionObjectsList({ type: "serviceDiscovery" });
    if (res?.success) {
      const list = (res.data || []).map((it: any) => { if (typeof it === "string") return { name: it, value: it, label: it }; const n = it?.name ?? it?.value ?? it?.label; return { name: n, value: n, label: it?.label ?? n, describe: it?.describe ?? it?.label }; }).filter((it: any) => !!it.name);
      const seen = new Set<string>();
      springBeanOptions.value = list.filter((it: any) => seen.has(it.name) ? false : (seen.add(it.name), true));
    }
  } catch {}
}
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.fc-container { max-height: 68vh; overflow-y: auto; padding: 0; }

/* 模式选择卡片 */
.fc-mode-section { margin-bottom: 20px; }
.fc-mode-label { font-size: 14px; font-weight: 600; color: $fc-title; margin-bottom: 12px; }
.fc-mode-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.fc-mode-card {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  background: $fc-surface; border: 2px solid $fc-border; border-radius: $fc-radius;
  cursor: pointer; transition: all 0.2s ease; position: relative;
  &:hover { border-color: $fc-primary; background: $fc-primary-light; }
  &.active {
    border-color: $fc-primary; background: $fc-primary-light;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
}

.fc-mode-icon {
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  background: rgba(59,130,246,0.12); border-radius: $fc-radius-sm; flex-shrink: 0;
  .iconify { font-size: 20px; color: $fc-primary; }
}

.fc-mode-content { flex: 1; min-width: 0; }
.fc-mode-title { font-size: 14px; font-weight: 600; color: $fc-title; margin-bottom: 4px; }
.fc-mode-desc { font-size: 12px; color: $fc-muted; line-height: 1.4; }

.fc-mode-check {
  position: absolute; top: 10px; right: 10px;
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
  background: $fc-primary; border-radius: 50%;
  .iconify { font-size: 12px; color: #fff; }
}

/* 配置区块 */
.fc-section {
  @include config-section;
  margin-bottom: 16px;
}

.fc-section-lead {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px;
  border-bottom: 1px solid $fc-border;
}

.fc-lead-icon {
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  border-radius: $fc-radius-sm; flex-shrink: 0;
  background: rgba(59,130,246,0.1);
  .iconify { font-size: 20px; color: $fc-primary; }
}

.fc-lead-text { flex: 1; h4 { margin: 0; font-size: 15px; font-weight: 600; color: $fc-title; } p { margin: 4px 0 0; font-size: 12px; color: $fc-muted; } }

.fc-add-btn { border-radius: $fc-radius-xs; }

/* 基础配置 */
.fc-basic-row { display: flex; gap: 24px; align-items: flex-start; }
.fc-field { flex: 1; label { display: block; font-size: 13px; font-weight: 500; color: $fc-body; margin-bottom: 8px; } }
.fc-field-status { flex: 0 0 180px; }
.fc-status-switch { display: flex; align-items: center; gap: 12px; height: 32px; }
.fc-status-text { font-size: 13px; font-weight: 500; color: $fc-danger; &.enabled { color: $fc-success; } }

/* 详情网格 */
.fc-detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.fc-field-full { grid-column: span 2; }

/* 提示 */
.fc-tips {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; margin-top: 16px;
  background: $fc-primary-light; border-radius: $fc-radius-sm;
}

.fc-tips-icon {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: rgba(59,130,246,0.15); border-radius: $fc-radius-xs; flex-shrink: 0;
  .iconify { font-size: 16px; color: $fc-primary; }
}

.fc-tips-content { flex: 1; font-size: 13px; line-height: 1.5; color: $fc-body; strong { display: block; font-weight: 600; color: $fc-title; margin-bottom: 2px; } }

.fc-tips-success { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); .fc-tips-icon { background: #a7f3d0; .iconify { color: #10b981; } } .fc-tips-content strong { color: #065f46; } }
.fc-tips-warning { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); .fc-tips-icon { background: #fde68a; .iconify { color: #f59e0b; } } .fc-tips-content strong { color: #92400e; } }
.fc-tips-info { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); .fc-tips-icon { background: #bfdbfe; .iconify { color: $fc-primary; } } }

/* 表映射 */
.fc-mapping-header {
  display: flex; align-items: center; padding: 10px 14px;
  background: $fc-surface-alt; border-radius: $fc-radius-xs;
  font-size: 12px; font-weight: 600; color: $fc-muted;
  text-transform: uppercase; letter-spacing: 0.5px;
}

.fc-mapping-list { max-height: 240px; overflow-y: auto; margin-top: 10px; }

.fc-mapping-row {
  display: flex; align-items: center; padding: 12px 14px; margin-bottom: 8px;
  background: $fc-surface-alt; border: 1px solid $fc-border; border-radius: $fc-radius-sm;
  transition: all 0.2s ease;
  &:hover { border-color: $fc-primary; background: $fc-primary-light; }
}

.fc-mcol-name { width: 150px; flex-shrink: 0; }
.fc-mcol-addr { flex: 1; margin: 0 10px; min-width: 180px; }
.fc-mcol-weight { width: 100px; flex-shrink: 0; }
.fc-mcol-status { width: 70px; flex-shrink: 0; display: flex; justify-content: center; }
.fc-mcol-action { width: 40px; flex-shrink: 0; text-align: center; }

.fc-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 20px; text-align: center;
}

.fc-empty-icon {
  width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;
  background: $fc-surface-alt; border-radius: 16px; margin-bottom: 16px;
  .iconify { font-size: 32px; color: $fc-muted; }
}

.fc-empty-text { span { font-size: 14px; font-weight: 500; color: $fc-muted; } p { margin: 6px 0 0; font-size: 12px; color: $fc-muted; } }

.fc-footer { @include action-row; }

@include mobile {
  .fc-mode-cards { grid-template-columns: 1fr; }
  .fc-basic-row { flex-direction: column; gap: 16px; }
  .fc-field-status { flex: 1; }
  .fc-detail-grid { grid-template-columns: 1fr; }
  .fc-field-full { grid-column: span 1; }
  .fc-mapping-row { flex-wrap: wrap; gap: 8px; }
  .fc-mcol-name, .fc-mcol-addr, .fc-mcol-weight { width: 100%; margin: 0; }
}
</style>
