<template>
  <div class="task-manage-page">
    <!-- Header -->
    <div class="task-header">
      <div class="task-header-left">
        <button class="back-btn" @click="goBack">
          <IconifyIconOnline icon="ep:arrow-left" />
        </button>
        <div>
          <h1 class="task-title">采集任务管理</h1>
          <p class="task-desc">管理定时视频采集任务</p>
        </div>
      </div>
      <button class="add-task-btn" @click="showAddDialog = true">
        <IconifyIconOnline icon="ep:plus" />
        新建任务
      </button>
    </div>

    <!-- Task Stats -->
    <div class="task-stats">
      <div class="stat-card">
        <span class="stat-value">{{ tasks.length }}</span>
        <span class="stat-label">总任务</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ tasks.filter(t => t.enabled).length }}</span>
        <span class="stat-label">运行中</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ tasks.filter(t => !t.enabled).length }}</span>
        <span class="stat-label">已停用</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ tasks.filter(t => t.lastRun).length }}</span>
        <span class="stat-label">已执行</span>
      </div>
    </div>

    <!-- Task List -->
    <div class="task-list">
      <div v-for="task in tasks" :key="task.id" class="task-card">
        <div class="task-card-left">
          <div class="task-status-dot" :class="{ active: task.enabled }"></div>
          <div class="task-info">
            <div class="task-name-row">
              <h3 class="task-name">{{ task.name }}</h3>
              <span class="task-source">{{ task.source }}</span>
            </div>
            <div class="task-meta">
              <span class="task-meta-item">
                <IconifyIconOnline icon="ep:clock" />
                定时: {{ task.schedule }}
              </span>
              <span class="task-meta-item">
                <IconifyIconOnline icon="ep:calendar" />
                上次: {{ task.lastRun || '未执行' }}
              </span>
              <span class="task-meta-item" v-if="task.nextRun">
                <IconifyIconOnline icon="ep:alarm-clock" />
                下次: {{ task.nextRun }}
              </span>
            </div>
          </div>
        </div>
        <div class="task-card-right">
          <span class="task-status-badge" :class="task.enabled ? 'running' : 'stopped'">
            {{ task.enabled ? '运行中' : '已停用' }}
          </span>
          <button class="task-action-btn toggle" @click="toggleTask(task.id)" :title="task.enabled ? '停用' : '启用'">
            <IconifyIconOnline :icon="task.enabled ? 'ep:video-pause' : 'ep:video-play'" />
          </button>
          <button class="task-action-btn edit" @click="editTask(task)" title="编辑">
            <IconifyIconOnline icon="ep:edit" />
          </button>
          <button class="task-action-btn run" @click="runTask(task.id)" title="立即执行">
            <IconifyIconOnline icon="ep:refresh" />
          </button>
          <button class="task-action-btn delete" @click="deleteTask(task.id)" title="删除">
            <IconifyIconOnline icon="ep:delete" />
          </button>
        </div>
      </div>

      <div v-if="tasks.length === 0" class="empty-state">
        <IconifyIconOnline icon="ep:document" class="empty-icon" />
        <p>暂无采集任务</p>
        <span>点击上方「新建任务」开始</span>
      </div>
    </div>

    <!-- Add Task Dialog -->
    <Teleport to="body">
      <div v-if="showAddDialog" class="dialog-overlay" @click.self="showAddDialog = false">
        <div class="dialog-panel">
          <div class="dialog-header">
            <h2>{{ editTaskId ? '编辑采集任务' : '新建采集任务' }}</h2>
            <button class="dialog-close" @click="closeDialog">
              <IconifyIconOnline icon="ep:close" />
            </button>
          </div>
          <div class="dialog-body">
            <div class="form-group">
              <label>任务名称</label>
              <input v-model="form.name" class="form-input" placeholder="例如：每日电影采集" />
            </div>
            <div class="form-group">
              <label>采集源</label>
              <select v-model="form.source" class="form-input">
                <option value="pkmp4">PKMP4</option>
                <option value="pansou">盘搜</option>
              </select>
            </div>
            <div class="form-group">
              <label>分类</label>
              <select v-model="form.category" class="form-input">
                <option value="ALL">全部</option>
                <option value="MV">电影</option>
                <option value="TV">电视剧</option>
                <option value="AC">动漫</option>
                <option value="VAR">综艺</option>
                <option value="DOC">纪录片</option>
              </select>
            </div>
            <div class="form-group">
              <label>定时策略</label>
              <select v-model="form.schedulePreset" class="form-input" @change="onScheduleChange">
                <option value="*/30 * * * *">每30分钟</option>
                <option value="0 * * * *">每小时</option>
                <option value="0 */3 * * *">每3小时</option>
                <option value="0 0 * * *">每天凌晨</option>
                <option value="0 0 */2 * *">每2天</option>
                <option value="0 0 * * 0">每周</option>
                <option value="custom">自定义</option>
              </select>
              <input v-if="form.schedulePreset === 'custom'" v-model="form.customSchedule" class="form-input mt-2" placeholder="例: 0 */6 * * *" />
            </div>
            <div class="form-group">
              <label>采集数量</label>
              <input v-model.number="form.limit" type="number" class="form-input" min="1" max="100" />
            </div>
          </div>
          <div class="dialog-footer">
            <button class="dialog-btn cancel" @click="showAddDialog = false">取消</button>
            <button class="dialog-btn confirm" @click="addTask">确认创建</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

interface TaskItem {
  id: number;
  name: string;
  source: string;
  category: string;
  schedule: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
}

const router = useRouter();

const tasks = ref<TaskItem[]>([
  {
    id: 1,
    name: "每日电影采集",
    source: "pkmp4",
    category: "MV",
    schedule: "0 0 * * *",
    enabled: true,
    lastRun: "2026-05-12 00:00:23",
    nextRun: "2026-05-13 00:00:00",
  },
  {
    id: 2,
    name: "电视剧定时同步",
    source: "pkmp4",
    category: "TV",
    schedule: "0 */6 * * *",
    enabled: true,
    lastRun: "2026-05-12 18:00:15",
    nextRun: "2026-05-13 00:00:00",
  },
  {
    id: 3,
    name: "动漫每周更新",
    source: "pansou",
    category: "AC",
    schedule: "0 0 * * 0",
    enabled: false,
    lastRun: "2026-05-10 00:00:42",
    nextRun: null,
  },
]);

const showAddDialog = ref(false);

const form = ref({
  name: "",
  source: "pkmp4",
  category: "MV",
  schedulePreset: "0 * * * *",
  customSchedule: "",
  limit: 20,
});

let nextId = 4;

function onScheduleChange() {
  // preset selected
}

function addTask() {
  const schedule = form.value.schedulePreset === "custom" ? form.value.customSchedule : form.value.schedulePreset;
  if (!form.value.name.trim() || !schedule) return;

  tasks.value.push({
    id: nextId++,
    name: form.value.name,
    source: form.value.source,
    category: form.value.category,
    schedule,
    enabled: true,
    lastRun: null,
    nextRun: "等待调度",
  });

  form.value = { name: "", source: "pkmp4", category: "MV", schedulePreset: "0 * * * *", customSchedule: "", limit: 20 };
  showAddDialog.value = false;
}

function toggleTask(id: number) {
  const task = tasks.value.find(t => t.id === id);
  if (task) task.enabled = !task.enabled;
}

function runTask(id: number) {
  const task = tasks.value.find(t => t.id === id);
  if (task) {
    task.lastRun = new Date().toLocaleString("zh-CN", { hour12: false });
  }
}

function deleteTask(id: number) {
  tasks.value = tasks.value.filter(t => t.id !== id);
}

function goBack() {
  router.push("/video/search");
}
</script>

<style scoped>
.task-manage-page {
  width: 100%;
  min-height: 100vh;
  background: #08080f;
  padding: 32px;
}

/* Header */
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.task-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.back-btn {
  width: 42px; height: 42px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.5);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  transition: all .25s ease;
}
.back-btn:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc;
  border-color: rgba(99,102,241,.3);
}
.task-title {
  font-size: 26px; font-weight: 700; color: #e0e7ff;
  margin: 0 0 4px;
}
.task-desc {
  font-size: 14px; color: rgba(255,255,255,.35);
  margin: 0;
}

.add-task-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 28px;
  border: none; border-radius: 14px;
  font-size: 15px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg,#6366f1,#a855f7);
  cursor: pointer;
  transition: all .3s ease;
  box-shadow: 0 4px 20px rgba(99,102,241,.3);
}
.add-task-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(99,102,241,.4);
}

/* Stats */
.task-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.stat-card {
  padding: 20px;
  background: rgba(255,255,255,.02);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.06);
  text-align: center;
}
.stat-value {
  font-size: 32px; font-weight: 800;
  background: linear-gradient(135deg,#818cf8,#a855f7);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px; color: rgba(255,255,255,.35);
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(255,255,255,.02);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.06);
  transition: all .3s ease;
  gap: 20px;
}
.task-card:hover {
  border-color: rgba(99,102,241,.15);
  background: rgba(255,255,255,.04);
}

.task-card-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}
.task-status-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,.15);
  flex-shrink: 0;
  transition: all .3s ease;
}
.task-status-dot.active {
  background: #4ade80;
  box-shadow: 0 0 12px rgba(74,222,128,.4);
}

.task-info { flex: 1; }
.task-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.task-name {
  font-size: 16px; font-weight: 600; color: #e0e7ff;
  margin: 0;
}
.task-source {
  font-size: 11px; padding: 2px 10px;
  border-radius: 6px;
  background: rgba(99,102,241,.1);
  color: #a5b4fc;
  font-weight: 500;
}
.task-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.task-meta-item {
  font-size: 13px; color: rgba(255,255,255,.3);
  display: flex; align-items: center; gap: 4px;
}

.task-card-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.task-status-badge {
  font-size: 12px; font-weight: 600;
  padding: 4px 14px;
  border-radius: 100px;
}
.task-status-badge.running {
  background: rgba(74,222,128,.1);
  color: #4ade80;
  border: 1px solid rgba(74,222,128,.2);
}
.task-status-badge.stopped {
  background: rgba(255,255,255,.05);
  color: rgba(255,255,255,.3);
  border: 1px solid rgba(255,255,255,.06);
}

.task-action-btn {
  width: 36px; height: 36px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.4);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  transition: all .2s ease;
}
.task-action-btn.toggle:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc;
  border-color: rgba(99,102,241,.25);
}
.task-action-btn.run:hover {
  background: rgba(74,222,128,.1);
  color: #4ade80;
  border-color: rgba(74,222,128,.2);
}
.task-action-btn.delete:hover {
  background: rgba(239,68,68,.1);
  color: #ef4444;
  border-color: rgba(239,68,68,.2);
}

/* Dialog */
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.dialog-panel {
  width: 480px; max-width: 90vw;
  background: #12121a;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 24px 80px rgba(0,0,0,.5);
  animation: slideUp .3s ease;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 28px 0;
}
.dialog-header h2 {
  font-size: 20px; font-weight: 700; color: #e0e7ff;
  margin: 0;
}
.dialog-close {
  width: 32px; height: 32px;
  border: none; border-radius: 8px;
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.4);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.dialog-close:hover { background: rgba(255,255,255,.1); color: #fff; }

.dialog-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label {
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,.5);
}
.form-input {
  padding: 10px 14px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all .2s;
}
.form-input:focus {
  border-color: rgba(99,102,241,.4);
  box-shadow: 0 0 0 1px rgba(99,102,241,.1);
}
.form-input::placeholder { color: rgba(255,255,255,.2); }
select.form-input { cursor: pointer; }
select.form-input option { background: #1a1a2e; color: #fff; }
.mt-2 { margin-top: 8px; }

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 0 28px 24px;
}
.dialog-btn {
  padding: 10px 28px;
  border: none; border-radius: 12px;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all .25s ease;
}
.dialog-btn.cancel {
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.5);
}
.dialog-btn.cancel:hover { background: rgba(255,255,255,.1); }
.dialog-btn.confirm {
  background: linear-gradient(135deg,#6366f1,#a855f7);
  color: #fff;
  box-shadow: 0 4px 16px rgba(99,102,241,.3);
}
.dialog-btn.confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(99,102,241,.4);
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}
.empty-icon { font-size: 64px; color: rgba(255,255,255,.06); margin-bottom: 16px; }
.empty-state p { font-size: 16px; color: rgba(255,255,255,.4); margin: 0 0 4px; }
.empty-state span { font-size: 14px; color: rgba(255,255,255,.2); }

/* Responsive */
@media (max-width: 768px) {
  .task-manage-page { padding: 20px; }
  .task-stats { grid-template-columns: repeat(2, 1fr); }
  .task-card { flex-direction: column; align-items: stretch; }
  .task-card-right { justify-content: flex-end; }
  .task-meta { flex-direction: column; gap: 6px; }
}
</style>
