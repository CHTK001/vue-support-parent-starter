<template>
  <sc-dialog
    v-model="visibleInner"
    title="服务发现配置"
    width="960px"
    :close-on-click-modal="false"
    class="service-discovery-dialog"
    @close="handleClose"
    draggable
  >
    <div class="service-discovery-container">
      <!-- 发现模式选择 -->
      <div class="mode-selection">
        <div class="mode-label">选择服务发现模式</div>
        <div class="mode-cards">
          <div
            v-for="mode in modeOptions"
            :key="mode.value"
            class="mode-card"
            :class="{ active: config.serviceDiscoveryMode === mode.value }"
            @click="config.serviceDiscoveryMode = mode.value"
          >
            <div class="mode-card-icon">
              <IconifyIconOnline :icon="mode.icon" />
            </div>
            <div class="mode-card-content">
              <div class="mode-card-title">{{ mode.label }}</div>
              <div class="mode-card-desc">{{ mode.describe }}</div>
            </div>
            <div class="mode-card-check" v-if="config.serviceDiscoveryMode === mode.value">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </div>
      </div>

      <!-- 基础配置 -->
      <div class="config-section basic-section">
        <div class="section-header">
          <div class="section-icon">
            <IconifyIconOnline icon="ri:settings-3-line" />
          </div>
          <div class="section-title-text">
            <h4>基础配置</h4>
            <p>配置负载均衡策略和启用状态</p>
          </div>
        </div>
        <div class="basic-config-row">
          <div class="config-item">
            <label>负载均衡策略</label>
            <el-select
              v-model="config.serviceDiscoveryBalance"
              placeholder="请选择负载均衡策略"
              style="width: 100%"
            >
              <el-option
                v-for="opt in balanceOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
          <div class="config-item status-item">
            <label>启用状态</label>
            <div class="status-switch">
              <el-switch
                v-model="config.serviceDiscoveryEnabled"
                inline-prompt
                active-text="启用"
                inactive-text="禁用"
                style="--el-switch-on-color: #10b981; --el-switch-off-color: #ef4444"
              />
              <span class="status-text" :class="{ enabled: config.serviceDiscoveryEnabled }">
                {{ config.serviceDiscoveryEnabled ? '已启用' : '已禁用' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Monitor 服务配置 -->
      <div
        v-if="config.serviceDiscoveryMode === 'MONITOR'"
        class="config-section detail-section monitor-section"
      >
        <div class="section-header">
          <div class="section-icon monitor">
            <IconifyIconOnline icon="ri:radar-line" />
          </div>
          <div class="section-title-text">
            <h4>Monitor 长连接配置</h4>
            <p>使用已连接的长连接节点，自动发现服务</p>
          </div>
        </div>
        <div class="config-tips success">
          <div class="tip-icon">
            <IconifyIconOnline icon="ri:lightbulb-line" />
          </div>
          <div class="tip-content">
            <strong>推荐使用</strong>
            <span>自动发现已连接到 SyncServer 的所有节点，无需手动配置服务器地址和端口</span>
          </div>
        </div>
      </div>

      <!-- Spring Bean 配置 -->
      <div
        v-else-if="config.serviceDiscoveryMode === 'SPRING'"
        class="config-section detail-section spring-section"
      >
        <div class="section-header">
          <div class="section-icon spring">
            <IconifyIconOnline icon="devicon:spring" />
          </div>
          <div class="section-title-text">
            <h4>Spring Bean 配置</h4>
            <p>选择 Spring 容器中的 ServiceDiscovery 实现</p>
          </div>
        </div>
        <div class="config-field" style="max-width: 400px;">
          <label>Bean 名称</label>
          <el-select
            v-model="config.serviceDiscoveryBeanName"
            placeholder="选择或输入 Bean 名称"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option
              v-for="opt in springBeanOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <div class="config-tips info">
          <div class="tip-icon">
            <IconifyIconOnline icon="ri:information-line" />
          </div>
          <div class="tip-content">
            <span>从 Spring 容器中获取 ServiceDiscovery 实现 Bean</span>
          </div>
        </div>
      </div>

      <!-- 表映射配置 -->
      <div
        v-else-if="config.serviceDiscoveryMode === 'TABLE'"
        class="config-section detail-section table-section"
      >
        <div class="section-header">
          <div class="section-icon table">
            <IconifyIconOnline icon="ri:table-2" />
          </div>
          <div class="section-title-text">
            <h4>服务映射配置</h4>
            <p>管理服务名称与地址的映射关系</p>
          </div>
          <el-button type="primary" size="small" @click="addMapping" class="add-btn">
            <IconifyIconOnline icon="ri:add-line" />
            新增映射
          </el-button>
        </div>

        <!-- 表头 -->
        <div class="mapping-header">
          <span class="col-name">服务名称</span>
          <span class="col-address">服务地址</span>
          <span class="col-weight">权重</span>
          <span class="col-status">状态</span>
          <span class="col-action">操作</span>
        </div>

        <!-- 映射列表 -->
        <div class="mapping-list">
          <div class="mapping-row" v-for="(m, idx) in mappings" :key="idx">
            <div class="col-name">
              <el-input
                v-model="m.serviceDiscoveryName"
                placeholder="user-service"
              />
            </div>
            <div class="col-address">
              <el-input
                v-model="m.serviceDiscoveryAddress"
                placeholder="http://localhost:8080"
              />
            </div>
            <div class="col-weight">
              <el-input-number
                v-model="m.serviceDiscoveryWeight"
                :min="0"
                :max="100"
                controls-position="right"
              />
            </div>
            <div class="col-status">
              <el-switch 
                v-model="m.serviceDiscoveryEnabled" 
                inline-prompt
                active-text="开"
                inactive-text="关"
              />
            </div>
            <div class="col-action">
              <el-button
                type="danger"
                size="small"
                text
                @click="mappings.splice(idx, 1)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="mappings.length === 0" class="empty-state">
            <div class="empty-icon">
              <IconifyIconOnline icon="ri:server-line" />
            </div>
            <div class="empty-text">
              <span>暂无服务映射</span>
              <p>点击右上角「新增映射」按钮添加服务</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Hazelcast 配置 -->
      <div
        v-else-if="config.serviceDiscoveryMode === 'HAZELCAST'"
        class="config-section detail-section hazelcast-section"
      >
        <div class="section-header">
          <div class="section-icon hazelcast">
            <IconifyIconOnline icon="simple-icons:hazelcast" />
          </div>
          <div class="section-title-text">
            <h4>Hazelcast 集群配置</h4>
            <p>配置 Hazelcast 集群连接参数</p>
          </div>
        </div>
        <div class="detail-config-grid">
          <div class="config-field">
            <label>集群名称</label>
            <el-input
              v-model="config.serviceDiscoveryHazelcastClusterName"
              placeholder="如: dev-cluster"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:team-line" />
              </template>
            </el-input>
          </div>
          <div class="config-field">
            <label>端口</label>
            <el-input-number
              v-model="config.serviceDiscoveryHazelcastPort"
              :min="1"
              :max="65535"
              placeholder="5701"
              style="width: 100%"
            />
          </div>
          <div class="config-field full-width">
            <label>成员地址</label>
            <el-input
              v-model="config.serviceDiscoveryHazelcastMembers"
              placeholder="如: 192.168.1.100:5701,192.168.1.101:5701"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:links-line" />
              </template>
            </el-input>
          </div>
          <div class="config-field">
            <label>连接超时 (秒)</label>
            <el-input-number
              v-model="config.serviceDiscoveryHazelcastTimeout"
              :min="1"
              :max="300"
              placeholder="30"
              style="width: 100%"
            />
          </div>
        </div>
        <div class="config-tips warning">
          <div class="tip-icon">
            <IconifyIconOnline icon="ri:alert-line" />
          </div>
          <div class="tip-content">
            <strong>注意</strong>
            <span>需要确保 Hazelcast 集群已启动，并且网络可达</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave"
          >保存配置</el-button
        >
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@repo/utils";
import {
  getServiceDiscoveryConfig,
  saveServiceDiscoveryConfig,
  getServiceDiscoveryMappings,
  saveServiceDiscoveryMappings,
  type ServiceDiscoveryConfig,
  type ServiceDiscoveryMapping,
} from "@/api/system-server-setting";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { fetchOptionObjectsList } from "@/api/spi";

interface Props {
  visible: boolean;
  serverId: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const config = ref<ServiceDiscoveryConfig>({
  serviceDiscoveryServerId: 0,
  serviceDiscoveryMode: "SPRING",
  serviceDiscoveryEnabled: true,
  serviceDiscoveryBalance: "weight",
});
const mappings = ref<ServiceDiscoveryMapping[]>([]);
type Option = {
  name: string;
  value?: string;
  label?: string;
  describe?: string;
};
const modeOptions = ref<Option[]>(
  [
    {
      name: "MONITOR",
      label: "Monitor 长连接",
      icon: "ri:radar-line",
      describe: "使用 SyncServer 长连接的在线节点",
    },
    {
      name: "SPRING",
      label: "Spring Bean",
      icon: "devicon:spring",
      describe: "使用 Spring 容器中的 ServiceDiscovery Bean",
    },
    {
      name: "TABLE",
      label: "表模式",
      icon: "ri:table-2",
      describe: "使用数据库映射表维护服务清单",
    },
    {
      name: "HAZELCAST",
      label: "Hazelcast",
      icon: "simple-icons:hazelcast",
      describe: "基于 Hazelcast 集群的服务发现",
    },
  ].map((it) => ({ ...it, value: it.name }))
);
const balanceOptions = ref<Option[]>([]);
const springBeanOptions = ref<Option[]>([]);

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
    if (v) await loadData();
  },
  { immediate: true }
);
watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  config.value = {
    serviceDiscoveryServerId: props.serverId,
    serviceDiscoveryMode: "MONITOR",
    serviceDiscoveryEnabled: true,
    serviceDiscoveryBalance: "weight",
    serviceDiscoveryMonitorHost: "localhost",
    serviceDiscoveryMonitorPort: 9999,
    serviceDiscoveryHazelcastPort: 5701,
    serviceDiscoveryHazelcastTimeout: 30,
  };
  mappings.value = [];
  try {
    const cfg = await getServiceDiscoveryConfig(props.serverId);
    if (cfg.success && Array.isArray(cfg.data) && cfg.data.length > 0) {
      config.value = { ...config.value, ...cfg.data[0] };
      if (config.value.serviceDiscoveryMode === "DEFAULT") {
        // 兼容旧值，转为 TABLE
        config.value.serviceDiscoveryMode = "TABLE";
      }
    }
    if (
      config.value.serviceDiscoveryMode === "TABLE" ||
      config.value.serviceDiscoveryMode === "DEFAULT"
    ) {
      const mp = await getServiceDiscoveryMappings(props.serverId);
      if (mp.success && Array.isArray(mp.data)) {
        mappings.value = mp.data;
      }
    }
    await Promise.all([loadBalanceOptions(), loadSpringBeanOptions()]);
  } catch (e) {
    /* ignore */
  }
}

function addMapping() {
  mappings.value.push({
    serviceDiscoveryName: "",
    serviceDiscoveryAddress: "",
    serviceDiscoveryEnabled: true,
  });
}

async function handleSave() {
  loading.value = true;
  try {
    config.value.serviceDiscoveryServerId = props.serverId;
    const res = await saveServiceDiscoveryConfig(config.value);
    if (!res.success) {
      message(res.msg || "保存失败", { type: "error" });
      return;
    }
    if (
      config.value.serviceDiscoveryMode === "TABLE" ||
      config.value.serviceDiscoveryMode === "DEFAULT"
    ) {
      const r = await saveServiceDiscoveryMappings(
        props.serverId,
        mappings.value
      );
      if (!r.success) {
        message(r.msg || "保存映射失败", { type: "error" });
        return;
      }
    }
    message("保存成功，已热应用", { type: "success" });
    emit("success");
    visibleInner.value = false;
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}

async function loadBalanceOptions() {
  try {
    const res = await fetchOptionObjectsList({ type: "robin" });
    if (res?.success) {
      const list = (res.data || [])
        .map((it: any) => {
          if (typeof it === "string") return { name: it, value: it, label: it };
          const name = it?.name ?? it?.value ?? it?.label;
          return {
            name,
            value: name,
            label: it?.label ?? name,
            describe: it?.describe ?? it?.label,
          };
        })
        .filter((it: any) => !!it.name);
      const seen = new Set<string>();
      balanceOptions.value = list.filter((it: any) =>
        seen.has(it.name) ? false : (seen.add(it.name), true)
      );
      if (
        !config.value.serviceDiscoveryBalance &&
        balanceOptions.value.length > 0
      ) {
        config.value.serviceDiscoveryBalance = balanceOptions.value[0]
          .name as any;
      }
    }
  } catch {}
}

async function loadSpringBeanOptions() {
  try {
    const res = await fetchOptionObjectsList({ type: "serviceDiscovery" });
    if (res?.success) {
      const list = (res.data || [])
        .map((it: any) => {
          if (typeof it === "string") return { name: it, value: it, label: it };
          const name = it?.name ?? it?.value ?? it?.label;
          return {
            name,
            value: name,
            label: it?.label ?? name,
            describe: it?.describe ?? it?.label,
          };
        })
        .filter((it: any) => !!it.name);
      const seen = new Set<string>();
      springBeanOptions.value = list.filter((it: any) =>
        seen.has(it.name) ? false : (seen.add(it.name), true)
      );
    }
  } catch {}
}
</script>

<style scoped lang="scss">
.service-discovery-container {
  max-height: 68vh;
  overflow-y: auto;
  padding: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-light);
    border-radius: 3px;
  }
}

/* 模式选择卡片 */
.mode-selection {
  margin-bottom: 20px;

  .mode-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
  }

  .mode-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .mode-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: var(--el-bg-color);
    border: 2px solid var(--el-border-color-light);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }

    &.active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
    }

    .mode-card-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-color-primary-light-8);
      border-radius: 10px;
      flex-shrink: 0;

      :deep(.iconify) {
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    .mode-card-content {
      flex: 1;
      min-width: 0;

      .mode-card-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .mode-card-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.4;
      }
    }

    .mode-card-check {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-color-primary);
      border-radius: 50%;

      :deep(.iconify) {
        font-size: 12px;
        color: #fff;
      }
    }
  }
}

/* 配置区块 */
.config-section {
  margin-bottom: 16px;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    .section-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      flex-shrink: 0;
      background: var(--el-color-primary-light-9);

      :deep(.iconify) {
        font-size: 20px;
        color: var(--el-color-primary);
      }

      &.monitor {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        :deep(.iconify) { color: #10b981; }
      }

      &.spring {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        :deep(.iconify) { color: #6ee7b7; }
      }

      &.hazelcast {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        :deep(.iconify) { color: #f59e0b; }
      }

      &.table {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        :deep(.iconify) { color: #3b82f6; }
      }
    }

    .section-title-text {
      flex: 1;

      h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .add-btn {
      border-radius: 8px;
    }
  }
}

/* 基础配置 */
.basic-section {
  .basic-config-row {
    display: flex;
    gap: 24px;
    align-items: flex-start;

    .config-item {
      flex: 1;

      label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        margin-bottom: 8px;
      }

      &.status-item {
        flex: 0 0 180px;
      }

      .status-switch {
        display: flex;
        align-items: center;
        gap: 12px;
        height: 32px;

        .status-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--el-color-danger);

          &.enabled {
            color: var(--el-color-success);
          }
        }
      }
    }
  }
}

/* 详细配置区块 */
.detail-section {
  .detail-config-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .config-field {
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      margin-bottom: 8px;
    }

    &.full-width {
      grid-column: span 2;
    }

    :deep(.el-input__wrapper) {
      border-radius: 8px;
    }

    :deep(.el-input__prefix) {
      color: var(--el-text-color-placeholder);
    }
  }
}

/* 提示信息 */
.config-tips {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-top: 16px;
  background: var(--el-color-primary-light-9);
  border-radius: 10px;

  .tip-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-primary-light-8);
    border-radius: 8px;
    flex-shrink: 0;

    :deep(.iconify) {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .tip-content {
    flex: 1;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-regular);

    strong {
      display: block;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }
  }

  &.success {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);

    .tip-icon {
      background: #a7f3d0;
      :deep(.iconify) { color: #10b981; }
    }

    .tip-content strong { color: #065f46; }
  }

  &.warning {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);

    .tip-icon {
      background: #fde68a;
      :deep(.iconify) { color: #f59e0b; }
    }

    .tip-content strong { color: #92400e; }
  }

  &.info {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);

    .tip-icon {
      background: #bfdbfe;
      :deep(.iconify) { color: #3b82f6; }
    }
  }
}

/* 表映射 */
.table-section {
  .mapping-header {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .mapping-list {
    max-height: 240px;
    overflow-y: auto;
    margin-top: 10px;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-light);
      border-radius: 3px;
    }
  }

  .mapping-row {
    display: flex;
    align-items: center;
    padding: 12px 14px;
    margin-bottom: 8px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 10px;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }
  }

  .col-name {
    width: 150px;
    flex-shrink: 0;
  }

  .col-address {
    flex: 1;
    margin: 0 10px;
    min-width: 180px;
  }

  .col-weight {
    width: 100px;
    flex-shrink: 0;

    :deep(.el-input-number) {
      width: 100%;
    }
  }

  .col-status {
    width: 70px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
  }

  .col-action {
    width: 40px;
    flex-shrink: 0;
    text-align: center;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;

    .empty-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-fill-color-light);
      border-radius: 16px;
      margin-bottom: 16px;

      :deep(.iconify) {
        font-size: 32px;
        color: var(--el-text-color-placeholder);
      }
    }

    .empty-text {
      span {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
      }

      p {
        margin: 6px 0 0 0;
        font-size: 12px;
        color: var(--el-text-color-placeholder);
      }
    }
  }
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  :deep(.el-button) {
    border-radius: 8px;
    padding: 10px 24px;
    font-weight: 500;
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
