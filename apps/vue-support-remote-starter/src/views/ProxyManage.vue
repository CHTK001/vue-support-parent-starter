<template>
  <div class="proxy-page thin-scroller">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-left">
        <h3 class="page-title">SOCKS5 代理</h3>
        <el-tag size="small" type="info" effect="plain">{{ proxies.length }} 个代理</el-tag>
      </div>
      <div class="page-header-right">
        <el-button size="small" :loading="loading" @click="fetchProxies">刷新</el-button>
        <el-button size="small" type="primary" @click="showAddProxy = true">
          <el-icon><Plus /></el-icon> 添加代理
        </el-button>
      </div>
    </div>

    <!-- 代理统计卡片 -->
    <div class="proxy-body">
      <div class="metrics-grid">
        <div class="metric-card glass-card">
          <div class="metric-value" style="color: var(--app-primary, #006ae6)">{{ proxies.length }}</div>
          <div class="metric-label">代理总数</div>
        </div>
        <div class="metric-card glass-card">
          <div class="metric-value" style="color: var(--el-color-success)">{{ runningCount }}</div>
          <div class="metric-label">运行中</div>
        </div>
        <div class="metric-card glass-card">
          <div class="metric-value" style="color: var(--el-color-warning)">{{ stoppedCount }}</div>
          <div class="metric-label">已停止</div>
        </div>
      </div>

      <!-- 代理列表 -->
      <div class="proxy-list">
        <div v-if="proxies.length === 0" class="proxy-empty">暂无代理服务器，点击"添加代理"创建</div>
        <div v-for="p in proxies" :key="p.id" class="proxy-item glass-card">
          <div class="proxy-item-left">
            <el-tag size="small" :type="p.type.includes('socks') ? 'warning' : 'info'" effect="plain">
              {{ p.type === 'netty-socks5' ? 'SOCKS5' : 'TCP' }}
            </el-tag>
            <span class="proxy-name">{{ p.name }}</span>
            <code class="proxy-port">{{ p.port }}</code>
            <span v-if="p.targetHost && p.targetPort" class="proxy-target">
              <el-icon :size="12"><ArrowRight /></el-icon> {{ p.targetHost }}:{{ p.targetPort }}
            </span>
          </div>
          <div class="proxy-item-right">
            <el-tag size="small" :type="p.running ? 'success' : 'info'" effect="dark">
              {{ p.running ? '运行中' : '已停止' }}
            </el-tag>
            <div class="proxy-actions">
              <el-button v-if="!p.running" size="small" type="success" plain @click="proxyStart(p)">启动</el-button>
              <el-button v-else size="small" type="warning" plain @click="proxyStop(p)">停止</el-button>
              <el-button size="small" type="danger" plain @click="proxyDelete(p)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加代理弹窗 -->
    <el-dialog v-model="showAddProxy" title="添加代理服务器" width="480px" append-to-body>
      <el-form label-position="top" size="default">
        <el-form-item label="代理名称">
          <el-input v-model="proxyForm.name" placeholder="SOCKS5 代理 1" />
        </el-form-item>
        <el-form-item label="代理类型">
          <el-select v-model="proxyForm.type" style="width:100%">
            <el-option label="SOCKS5 代理" value="netty-socks5" />
            <el-option label="TCP 代理" value="netty-tcp-proxy" />
          </el-select>
        </el-form-item>
        <el-form-item label="监听端口">
          <el-input-number v-model="proxyForm.port" :min="1024" :max="65535" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="proxyForm.type === 'netty-tcp-proxy'" label="目标地址">
          <el-input v-model="proxyForm.targetHost" placeholder="127.0.0.1" style="width:60%" />
          <el-input-number v-model="proxyForm.targetPort" :min="1" :max="65535" placeholder="端口" style="width:40%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddProxy = false">取消</el-button>
        <el-button type="primary" :loading="proxyCreating" @click="proxyCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { Plus, ArrowRight } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Ref } from "vue";

const injectedToken = inject<Ref<string>>("clientToken");
const injectedAccessCode = inject<Ref<string>>("accessCode");

function getToken(): string {
  return injectedToken?.value || injectedAccessCode?.value || localStorage.getItem("remote-client-token") || "";
}

const proxies = ref<any[]>([]);
const showAddProxy = ref(false);
const proxyCreating = ref(false);
const loading = ref(false);
const proxyForm = ref({ name: "", type: "netty-socks5", port: 1080, targetHost: "", targetPort: 0 });

const runningCount = computed(() => proxies.value.filter(p => p.running).length);
const stoppedCount = computed(() => proxies.value.length - runningCount.value);

function getBase(): string {
  const token = getToken();
  return `${window.location.protocol}//${window.location.hostname}:3000/admin/api/proxies${token ? `?token=${token}` : ""}`;
}

async function fetchProxies() {
  loading.value = true;
  try {
    const resp = await fetch(getBase());
    if (resp.ok) proxies.value = await resp.json();
  } catch {}
  finally { loading.value = false; }
}

async function proxyCreate() {
  proxyCreating.value = true;
  try {
    const resp = await fetch(getBase(), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(proxyForm.value)
    });
    if (resp.ok) { ElMessage.success("代理已创建"); showAddProxy.value = false; await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("创建失败: " + t); }
  } catch (e: any) { ElMessage.error("创建异常: " + e.message); }
  finally { proxyCreating.value = false; }
}

async function proxyStart(p: any) {
  const base = getBase();
  try {
    const resp = await fetch(`${base}&id=${p.id}/start`, { method: "POST" });
    if (resp.ok) { ElMessage.success("代理已启动"); await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("启动失败: " + t); }
  } catch (e: any) { ElMessage.error("启动异常: " + e.message); }
}

async function proxyStop(p: any) {
  const base = getBase();
  try {
    const resp = await fetch(`${base}&id=${p.id}/stop`, { method: "POST" });
    if (resp.ok) { ElMessage.success("代理已停止"); await fetchProxies(); }
    else { const t = await resp.text(); ElMessage.error("停止失败: " + t); }
  } catch (e: any) { ElMessage.error("停止异常: " + e.message); }
}

async function proxyDelete(p: any) {
  try { await ElMessageBox.confirm(`确定删除代理 ${p.name}？`, "确认", { type: "warning" }); } catch { return; }
  const base = getBase();
  try {
    const resp = await fetch(`${base}&id=${p.id}`, { method: "DELETE" });
    if (resp.ok) { ElMessage.success("代理已删除"); await fetchProxies(); }
    else ElMessage.error("删除失败");
  } catch (e: any) { ElMessage.error("删除异常: " + e.message); }
}
</script>

<style scoped>
.proxy-page {
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

/* 页面头部 — 使用共享 page-header.scss */

.proxy-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 统计卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.metric-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  padding: 20px 24px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

html.dark .metric-card {
  background: rgba(30,41,59,0.75);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

html.dark .metric-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
  line-height: 1;
}

.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}

/* 代理列表 */
.proxy-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.proxy-empty {
  text-align: center;
  padding: 48px 24px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.proxy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.proxy-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  border-color: var(--el-color-primary-light-7);
}

html.dark .proxy-item {
  background: rgba(30,41,59,0.7);
  border-color: rgba(255,255,255,0.06);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

html.dark .proxy-item:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  border-color: var(--el-color-primary-light-5);
}

.proxy-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.proxy-item-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.proxy-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.proxy-port {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
  color: var(--el-color-info);
  background: var(--el-fill-color-lighter);
  padding: 2px 8px;
  border-radius: 4px;
}

.proxy-target {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.proxy-actions {
  display: flex;
  gap: 6px;
}
</style>
