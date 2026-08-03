<template>
  <div class="panel-container">
    <div class="panel-header">
      <div>
        <span class="panel-title">分组管理</span>
        <span class="panel-subtitle">为不同业务/团队分配模型分组，并绑定可用 AppKey</span>
      </div>
      <el-button v-role="'admin'" type="primary" size="small" plain @click="openCreate">新建分组</el-button>
    </div>
    <div v-loading="loading" class="panel-body">
      <div class="group-grid">
        <div v-for="group in groups" :key="group.id" class="group-card">
          <div class="group-card__head">
            <div class="group-icon">{{ group.name.charAt(0) }}</div>
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-meta">
                {{ group.models.length }} 个模型 · {{ group.appKeyIds.length }} 个 AppKey
              </div>
            </div>
            <el-dropdown v-role="'admin'" trigger="click" @command="(c) => onCommand(c, group)">
              <el-button type="text" size="small">⋯</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="group-card__body">
            <div class="meta-row">
              <span class="meta-label">关联模型</span>
              <div class="model-list">
                <el-tag v-for="m in group.models" :key="m" size="small" effect="plain" class="model-tag">{{ m }}</el-tag>
                <span v-if="group.models.length === 0" class="empty-text">未配置</span>
              </div>
            </div>
            <div class="meta-row">
              <span class="meta-label">绑定 AppKey</span>
              <div class="token-list">
                <el-tag
                  v-for="aid in group.appKeyIds"
                  :key="aid"
                  size="small"
                  :type="getKeyTagType(aid)"
                  effect="plain"
                  class="token-tag"
                >
                  {{ getKeyName(aid) }}
                </el-tag>
                <span v-if="group.appKeyIds.length === 0" class="empty-text">未绑定</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!loading && groups.length === 0" class="empty-tip">
          <el-empty description="暂无分组，点击右上角创建" />
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑分组' : '新建分组'" width="540px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="分组名称">
          <el-input v-model="form.name" placeholder="如 客服组、研发组" />
        </el-form-item>
        <el-form-item label="关联模型">
          <el-select v-model="form.models" multiple placeholder="选择关联的 AI 模型" style="width: 100%">
            <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定 AppKey">
          <el-select v-model="form.appKeyIds" multiple placeholder="选择可使用的 AppKey" style="width: 100%">
            <el-option v-for="t in allKeys" :key="t.id" :label="`${t.name} (${t.provider})`" :value="t.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 分组管理面板
 * 调用 /v2/ai/groups 与 /v2/ai/app-keys。
 * 管理类操作（新建/编辑/删除）需要 admin 角色。
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { groupsApi, appKeysApi, providersApi, type Group, type AppKey, type Provider } from '../../api';

defineProps<{ id?: string }>();

const loading = ref(false);
const groups = ref<Group[]>([]);
const allKeys = ref<AppKey[]>([]);
const availableModels = ref<string[]>([]);

const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref(0);
const form = reactive({
  name: '',
  models: [] as string[],
  appKeyIds: [] as number[],
});

const getKeyName = (id: number) => allKeys.value.find(t => t.id === id)?.name || String(id);
const getKeyTagType = (id: number): 'primary' | 'success' | 'warning' | 'info' => {
  const t = allKeys.value.find(k => k.id === id);
  if (!t) return 'info';
  const map: Record<string, any> = { OpenAI: 'primary', Claude: 'success', Gemini: 'warning' };
  return map[t.name] || 'info';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [g, k, p] = await Promise.all([groupsApi.list(), appKeysApi.list(), providersApi.list()]);
    groups.value = g;
    allKeys.value = k;
    availableModels.value = Array.from(new Set(p.flatMap((pv: Provider) => pv.models || [])));
  } catch (e: any) {
    ElMessage.error('加载分组失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = false;
  editingId.value = 0;
  form.name = '';
  form.models = [];
  form.appKeyIds = [];
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!form.name.trim()) { ElMessage.warning('请输入分组名称'); return; }
  try {
    if (editing.value) {
      await groupsApi.update(editingId.value, { ...form });
      ElMessage.success('分组已更新');
    } else {
      await groupsApi.create({ ...form });
      ElMessage.success('分组已创建');
    }
    dialogVisible.value = false;
    await fetchData();
  } catch (e: any) {
    ElMessage.error('保存失败');
  }
};

const onCommand = async (cmd: string, group: Group) => {
  if (cmd === 'edit') {
    editing.value = true;
    editingId.value = group.id;
    form.name = group.name;
    form.models = [...group.models];
    form.appKeyIds = [...group.appKeyIds];
    dialogVisible.value = true;
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm(`确定删除分组 “${group.name}” 吗？`, '提示', { type: 'warning' });
      await groupsApi.delete(group.id);
      ElMessage.success('分组已删除');
      await fetchData();
    } catch {}
  }
};

onMounted(fetchData);
</script>

<style scoped>
.panel-container { padding: 4px 0; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.panel-title { display: block; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: 0.2px; }
.panel-subtitle { display: block; font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.panel-body { min-height: 200px; }
.group-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.group-card { border: 1px solid var(--el-border-color-light); border-radius: 10px; padding: 14px 16px; background: var(--el-bg-color); transition: border-color 0.2s, box-shadow 0.2s; }
.group-card:hover { border-color: var(--el-border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.group-card__head { display: flex; align-items: center; gap: 12px; }
.group-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--el-fill-color-light); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; color: var(--el-text-color-primary); flex-shrink: 0; }
.group-info { flex: 1; min-width: 0; }
.group-name { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); line-height: 1.3; }
.group-meta { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 3px; }
.group-card__body { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter); }
.meta-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.meta-label { color: var(--el-text-color-secondary); flex-shrink: 0; min-width: 64px; }
.model-list, .token-list { display: flex; flex-wrap: wrap; gap: 4px; }
.model-tag, .token-tag { font-family: monospace; }
.empty-text { font-size: 12px; color: var(--el-text-color-placeholder); }
.empty-tip { padding: 20px 0; }
</style>