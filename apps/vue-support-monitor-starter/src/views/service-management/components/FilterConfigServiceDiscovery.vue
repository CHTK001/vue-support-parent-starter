<template>
  <el-dialog
    v-model="visibleInner"
    title="服务发现配置"
    width="960px"
    :close-on-click-modal="false"
    class="service-discovery-dialog"
    @close="handleClose"
    draggable
  >
    <div class="service-discovery-container">
      <!-- 基础配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:compass-discover-line" />
          基础配置
        </h4>
        <div class="config-grid">
          <el-form-item label="发现模式">
            <ScSelect
              v-model="config.serviceDiscoveryMode"
              :options="modeOptions"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="负载均衡">
            <ScSelect
              v-model="config.serviceDiscoveryBalance"
              :options="balanceOptions"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch
              v-model="config.serviceDiscoveryEnabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </div>
      </div>

      <!-- Monitor 服务配置 -->
      <div
        v-if="config.serviceDiscoveryMode === 'MONITOR'"
        class="config-section monitor-section"
      >
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:radar-line" />
          Monitor 服务配置 (SyncServer)
        </h4>
        <div class="monitor-config-grid">
          <el-form-item label="服务地址">
            <el-input
              v-model="config.serviceDiscoveryMonitorHost"
              placeholder="如: localhost 或 192.168.1.100"
            />
          </el-form-item>
          <el-form-item label="服务端口">
            <el-input-number
              v-model="config.serviceDiscoveryMonitorPort"
              :min="1"
              :max="65535"
              placeholder="如: 9999"
              style="width: 100%"
            />
          </el-form-item>
        </div>
        <div class="config-tips success">
          <IconifyIconOnline icon="ri:check-double-line" />
          <span
            >推荐使用：内置的SyncServer服务发现，无需额外依赖，即开即用</span
          >
        </div>
      </div>

      <!-- Spring Bean 配置 -->
      <div
        v-else-if="config.serviceDiscoveryMode === 'SPRING'"
        class="config-section spring-section"
      >
        <h4 class="section-title">
          <IconifyIconOnline icon="devicon:spring" />
          Spring Bean 配置
        </h4>
        <el-form-item label="Bean名称">
          <ScSelect
            v-model="config.serviceDiscoveryBeanName"
            :options="springBeanOptions"
            placeholder="选择或输入ServiceDiscovery Bean名称"
            filterable
            allow-create
            style="width: 100%; max-width: 400px"
          />
        </el-form-item>
        <div class="config-tips">
          <IconifyIconOnline icon="ri:information-line" />
          <span>从Spring容器中获取ServiceDiscovery实现Bean</span>
        </div>
      </div>

      <!-- 表映射配置 -->
      <div
        v-else-if="config.serviceDiscoveryMode === 'TABLE'"
        class="config-section"
      >
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:table-2" />
          服务映射配置
        </h4>

        <!-- 表头 -->
        <div class="mapping-header">
          <span class="col-name">服务名称</span>
          <span class="col-address">服务地址</span>
          <span class="col-weight">权重</span>
          <span class="col-status">状态</span>
          <span class="col-action">操作</span>
        </div>

        <!-- 映射列表 -->
        <div class="mapping-list thin-scrollbar">
          <div class="mapping-row" v-for="(m, idx) in mappings" :key="idx">
            <div class="col-name">
              <el-input
                v-model="m.serviceDiscoveryName"
                placeholder="如: user-service"
              />
            </div>
            <div class="col-address">
              <el-input
                v-model="m.serviceDiscoveryAddress"
                placeholder="如: http://localhost:8080"
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
              <el-switch v-model="m.serviceDiscoveryEnabled" />
            </div>
            <div class="col-action">
              <el-button
                type="danger"
                size="small"
                circle
                @click="mappings.splice(idx, 1)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="mappings.length === 0" class="empty-state">
            <IconifyIconOnline icon="ri:server-line" />
            <span>暂无服务映射，点击下方按钮添加</span>
          </div>
        </div>

        <!-- 添加按钮 -->
        <div class="add-mapping-btn">
          <el-button type="primary" @click="addMapping">
            <IconifyIconOnline icon="ri:add-line" />
            新增映射
          </el-button>
        </div>
      </div>

      <!-- Hazelcast 配置 -->
      <div
        v-else-if="config.serviceDiscoveryMode === 'HAZELCAST'"
        class="config-section hazelcast-section"
      >
        <h4 class="section-title">
          <IconifyIconOnline icon="simple-icons:hazelcast" />
          Hazelcast 集群配置
        </h4>
        <div class="hazelcast-config-grid">
          <el-form-item label="集群名称">
            <el-input
              v-model="config.serviceDiscoveryHazelcastClusterName"
              placeholder="如: dev-cluster"
            />
          </el-form-item>
          <el-form-item label="成员地址">
            <el-input
              v-model="config.serviceDiscoveryHazelcastMembers"
              placeholder="如: 192.168.1.100:5701,192.168.1.101:5701"
            />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number
              v-model="config.serviceDiscoveryHazelcastPort"
              :min="1"
              :max="65535"
              placeholder="默认: 5701"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="连接超时(秒)">
            <el-input-number
              v-model="config.serviceDiscoveryHazelcastTimeout"
              :min="1"
              :max="300"
              placeholder="默认: 30"
              style="width: 100%"
            />
          </el-form-item>
        </div>
        <div class="config-tips warning">
          <IconifyIconOnline icon="ri:alert-line" />
          <span>需要确保Hazelcast集群已启动，并且网络可达</span>
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
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
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
      label: "Monitor 服务",
      icon: "ri:radar-line",
      describe: "基于SyncServer的内置服务发现",
    },
    {
      name: "SPRING",
      label: "Spring Bean",
      icon: "devicon:spring",
      describe: "使用Spring容器中的ServiceDiscovery实现",
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
      describe: "基于Hazelcast集群的服务发现",
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
      ElMessage.error(res.msg || "保存失败");
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
        ElMessage.error(r.msg || "保存映射失败");
        return;
      }
    }
    ElMessage.success("保存成功，已热应用");
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

<style scoped>
.service-discovery-container {
  max-height: 68vh;
  overflow-y: auto;
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
}

.config-section {
  margin-bottom: 20px;
  padding: 24px;
  border: none;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.config-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
}

.config-section:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Monitor 配置特殊样式 */
.monitor-section::before {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
}

/* Spring 配置特殊样式 */
.spring-section::before {
  background: linear-gradient(180deg, #6ee7b7 0%, #10b981 100%);
}

/* Hazelcast 配置特殊样式 */
.hazelcast-section::before {
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
}

.monitor-config-grid,
.hazelcast-config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 2px solid var(--el-color-primary-light-8);
}

.section-title :deep(.iconify) {
  color: var(--el-color-primary);
  font-size: 18px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.config-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.config-tips {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  margin-top: 20px;
  background: linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
  color: #1e40af;
  font-size: 13px;
  font-weight: 500;
}

.config-tips.success {
  background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%);
  border-left-color: #10b981;
  color: #065f46;
}

.config-tips.warning {
  background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%);
  border-left-color: #f59e0b;
  color: #92400e;
}

.config-tips :deep(.iconify) {
  font-size: 18px;
}

.mapping-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.mapping-list {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.mapping-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.mapping-row:hover {
  border-color: #67c23a;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.1);
}

.col-name {
  width: 160px;
  flex-shrink: 0;
}
.col-address {
  flex: 1;
  margin: 0 12px;
  min-width: 200px;
}
.col-weight {
  width: 100px;
  flex-shrink: 0;
}
.col-status {
  width: 60px;
  flex-shrink: 0;
  margin: 0 12px;
}
.col-action {
  width: 50px;
  flex-shrink: 0;
  text-align: center;
}

.col-name :deep(.el-input__wrapper),
.col-address :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.col-weight :deep(.el-input-number) {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
  gap: 12px;
}

.empty-state :deep(.iconify) {
  font-size: 40px;
  color: #c0c4cc;
}

.add-mapping-btn {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e8e8e8;
}

.add-mapping-btn :deep(.el-button) {
  width: 100%;
  border-radius: 8px;
  height: 40px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  border-radius: 8px;
  padding: 10px 24px;
}
</style>
