<template>
  <sc-dialog
    v-model="visibleInner"
    title="增强版HTTP代理配置"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
    draggable
  >
    <div class="proxy-config-container thin-scrollbar">
      <!-- 基础配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="config-grid">
          <el-form-item label="启用状态">
            <el-switch
              v-model="config.enabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
          <el-form-item label="线程池类型">
            <el-select v-model="config.poolType" style="width: 180px">
              <el-option label="固定大小(Fixed)" value="FIXED">
                <span class="option-item"
                  ><IconifyIconOnline icon="ri:group-line" /> 固定大小</span
                >
              </el-option>
              <el-option label="缓存型(Cached)" value="CACHED">
                <span class="option-item"
                  ><IconifyIconOnline icon="ri:stack-line" /> 缓存型</span
                >
              </el-option>
              <el-option label="动态(Dynamic)" value="DYNAMIC">
                <span class="option-item"
                  ><IconifyIconOnline icon="ri:pulse-line" /> 动态调整</span
                >
              </el-option>
              <el-option label="工作窃取(WorkStealing)" value="WORK_STEALING">
                <span class="option-item"
                  ><IconifyIconOnline icon="ri:git-branch-line" />
                  工作窃取</span
                >
              </el-option>
            </el-select>
          </el-form-item>
        </div>
        <div class="pool-type-desc">
          <el-tag :type="getPoolTypeTagType(config.poolType) as any">{{
            getPoolTypeDesc(config.poolType)
          }}</el-tag>
        </div>
      </div>

      <!-- Netty线程配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:server-line" />
          Netty线程配置
        </h4>
        <div class="config-grid">
          <el-form-item label="Boss线程数">
            <el-input-number
              v-model="config.bossThreads"
              :min="1"
              :max="16"
              controls-position="right"
            />
            <div class="form-tip">接收连接的线程数（建议1-2）</div>
          </el-form-item>
          <el-form-item label="Worker线程数">
            <el-input-number
              v-model="config.workerThreads"
              :min="1"
              :max="256"
              controls-position="right"
            />
            <div class="form-tip">处理IO的线程数（建议CPU核心数*2）</div>
          </el-form-item>
        </div>
      </div>

      <!-- 业务线程池配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:cpu-line" />
          业务线程池配置
        </h4>
        <div class="config-grid">
          <el-form-item label="核心线程数">
            <el-input-number
              v-model="config.corePoolSize"
              :min="1"
              :max="500"
              controls-position="right"
            />
            <div class="form-tip">建议设置为CPU核心数</div>
          </el-form-item>
          <el-form-item label="最大线程数" v-if="config.poolType !== 'FIXED'">
            <el-input-number
              v-model="config.maxPoolSize"
              :min="config.corePoolSize"
              :max="1000"
              controls-position="right"
            />
            <div class="form-tip">建议设置为CPU核心数*4</div>
          </el-form-item>
          <el-form-item label="队列容量" v-if="config.poolType !== 'CACHED'">
            <el-input-number
              v-model="config.queueCapacity"
              :min="100"
              :max="100000"
              :step="1000"
              controls-position="right"
            />
            <div class="form-tip">等待队列的最大任务数</div>
          </el-form-item>
          <el-form-item label="空闲存活(秒)" v-if="config.poolType !== 'FIXED'">
            <el-input-number
              v-model="config.keepAliveSeconds"
              :min="0"
              :max="3600"
              :step="10"
              controls-position="right"
            />
            <div class="form-tip">非核心线程空闲后的存活时间</div>
          </el-form-item>
        </div>
      </div>

      <!-- 超时与策略 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:timer-line" />
          超时与策略
        </h4>
        <div class="config-grid">
          <el-form-item label="连接超时(ms)">
            <el-input-number
              v-model="config.connectionTimeout"
              :min="1000"
              :max="60000"
              :step="1000"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="读取超时(ms)">
            <el-input-number
              v-model="config.readTimeout"
              :min="1000"
              :max="300000"
              :step="1000"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="写入超时(ms)">
            <el-input-number
              v-model="config.writeTimeout"
              :min="1000"
              :max="300000"
              :step="1000"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="最大内容长度">
            <el-input-number
              v-model="config.maxContentLength"
              :min="1024"
              :max="104857600"
              :step="65536"
              controls-position="right"
            />
            <div class="form-tip">单位：字节</div>
          </el-form-item>
        </div>
        <div class="config-grid">
          <el-form-item label="分发策略">
            <el-select v-model="config.dispatchStrategy" style="width: 180px">
              <el-option label="轮询" value="ROUND_ROBIN" />
              <el-option label="随机" value="RANDOM" />
              <el-option label="最小负载" value="LEAST_LOAD" />
            </el-select>
          </el-form-item>
          <el-form-item label="拒绝策略">
            <el-select v-model="config.rejectionPolicy" style="width: 180px">
              <el-option label="调用者执行" value="CALLER_RUNS" />
              <el-option label="抛出异常" value="ABORT" />
              <el-option label="直接丢弃" value="DISCARD" />
              <el-option label="丢弃最旧" value="DISCARD_OLDEST" />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">线程池类型</div>
            <div class="stat-value">{{ config.poolType }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Netty线程</div>
            <div class="stat-value">
              {{ config.bossThreads }} / {{ config.workerThreads }}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">业务线程</div>
            <div class="stat-value">
              {{ config.corePoolSize }} /
              {{
                config.poolType === "FIXED"
                  ? config.corePoolSize
                  : config.maxPoolSize
              }}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">队列容量</div>
            <div class="stat-value">{{ config.queueCapacity }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave"
          >保存配置（热重载）</el-button
        >
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { message } from "@repo/utils";
import {
  getServletFilterConfig,
  saveServletFilterConfig,
} from "@/api/system-server-setting";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [boolean];
  success: [];
}>();

const visibleInner = ref(false);
const loading = ref(false);

const cpuCores = navigator.hardwareConcurrency || 4;

const config = reactive({
  enabled: true,
  poolType: "DYNAMIC",
  bossThreads: 1,
  workerThreads: cpuCores * 2,
  corePoolSize: cpuCores,
  maxPoolSize: cpuCores * 4,
  queueCapacity: 10000,
  keepAliveSeconds: 60,
  connectionTimeout: 10000,
  readTimeout: 30000,
  writeTimeout: 30000,
  maxContentLength: 65536,
  dispatchStrategy: "ROUND_ROBIN",
  rejectionPolicy: "CALLER_RUNS",
});

function getPoolTypeDesc(type: string) {
  const descMap: Record<string, string> = {
    FIXED: "固定大小线程池，类似Nginx worker_processes，线程数恒定",
    CACHED: "缓存型线程池，按需创建线程，空闲时回收",
    DYNAMIC: "动态线程池，核心线程+弹性扩展+有界队列",
    WORK_STEALING: "工作窃取线程池(ForkJoinPool)，适合递归任务",
  };
  return descMap[type] || type;
}

function getPoolTypeTagType(type: string) {
  const typeMap: Record<string, string> = {
    FIXED: "primary",
    CACHED: "success",
    DYNAMIC: "warning",
    WORK_STEALING: "info",
  };
  return typeMap[type] || "info";
}

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
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (res.success && res.data) {
      Object.assign(config, {
        enabled: res.data.enabled ?? true,
        poolType: res.data.poolType ?? "DYNAMIC",
        bossThreads: res.data.bossThreads ?? 1,
        workerThreads: res.data.workerThreads ?? cpuCores * 2,
        corePoolSize: res.data.corePoolSize ?? cpuCores,
        maxPoolSize: res.data.maxPoolSize ?? cpuCores * 4,
        queueCapacity: res.data.queueCapacity ?? 10000,
        keepAliveSeconds: res.data.keepAliveSeconds ?? 60,
        connectionTimeout: res.data.connectionTimeout ?? 10000,
        readTimeout: res.data.readTimeout ?? 30000,
        writeTimeout: res.data.writeTimeout ?? 30000,
        maxContentLength: res.data.maxContentLength ?? 65536,
        dispatchStrategy: res.data.dispatchStrategy ?? "ROUND_ROBIN",
        rejectionPolicy: res.data.rejectionPolicy ?? "CALLER_RUNS",
      });
    }
  } catch (e) {
    console.error("加载增强代理配置失败:", e);
  }
}

async function handleSave() {
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(
      props.filterSettingId,
      config as any
    );
    if (res.success) {
      message("增强代理配置保存成功，已热重载", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    console.error("保存增强代理配置失败:", error);
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}
</script>

<style scoped>
.proxy-config-container {
  max-height: 65vh;
  overflow-y: auto;
  padding: 4px;
}

.config-section {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.config-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px 0;
  padding-bottom: 10px;
  font-size: 14px;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 12px;
}

.config-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.config-grid :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pool-type-desc {
  padding: 10px 14px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  border-left: 3px solid var(--el-color-primary);
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  padding: 12px;
  background: linear-gradient(145deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
