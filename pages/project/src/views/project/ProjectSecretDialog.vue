<template>
  <ScDialog
    v-model="visible"
    :title="`设置密钥 — ${project?.projectName ?? ''}`"
    width="720px"
    destroy-on-close
  >
    <div class="secret-dialog">
      <!-- 已关联密钥 -->
      <div class="section">
        <div class="section-header">
          <IconifyIconOnline icon="ri:link" />
          <span>已关联密钥</span>
          <el-tag size="small" type="success">{{ bound.length }}</el-tag>
        </div>
        <div v-if="loadingBound" v-loading="true" class="loading-area" />
        <el-empty v-else-if="!bound.length" description="暂无关联密钥" :image-size="48" />
        <div v-else class="secret-list">
          <div v-for="item in bound" :key="item.sysSecretId" class="secret-item is-bound">
            <div class="secret-info">
              <img v-if="item.sysSecretIcon" :src="item.sysSecretIcon" class="secret-icon" />
              <IconifyIconOnline v-else icon="ri:key-2-line" class="secret-icon-default" />
              <div>
                <div class="secret-name">{{ item.sysSecretName }}</div>
                <div class="secret-group">{{ item.sysSecretGroup || '未分组' }}</div>
              </div>
            </div>
            <ScButton
              size="small"
              type="danger"
              plain
              :loading="unbinding === item.sysSecretId"
              @click="handleUnbind(item)"
            >
              取消关联
            </ScButton>
          </div>
        </div>
      </div>

      <!-- 可关联密钥 -->
      <div class="section">
        <div class="section-header">
          <IconifyIconOnline icon="ri:key-2-line" />
          <span>可关联密钥</span>
          <ScInput
            v-model="searchKeyword"
            placeholder="搜索密钥名称"
            clearable
            size="small"
            class="search-input"
          />
        </div>
        <div v-if="loadingAll" v-loading="true" class="loading-area" />
        <el-empty v-else-if="!filteredUnbound.length" description="暂无可关联密钥" :image-size="48" />
        <div v-else class="secret-list">
          <div v-for="item in filteredUnbound" :key="item.sysSecretId" class="secret-item">
            <div class="secret-info">
              <img v-if="item.sysSecretIcon" :src="item.sysSecretIcon" class="secret-icon" />
              <IconifyIconOnline v-else icon="ri:key-2-line" class="secret-icon-default" />
              <div>
                <div class="secret-name">{{ item.sysSecretName }}</div>
                <div class="secret-group">{{ item.sysSecretGroup || '未分组' }}</div>
              </div>
            </div>
            <ScButton
              size="small"
              type="primary"
              plain
              :loading="binding === item.sysSecretId"
              @click="handleBind(item)"
            >
              关联
            </ScButton>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ScButton @click="visible = false">关闭</ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import { message } from "@repo/utils";
import type { SysProject } from "../../api/manage/project";
import {
  fetchProjectSecrets,
  fetchBindProjectSecret,
  fetchUnbindProjectSecret,
} from "../../api/manage/project";
import { fetchPageSecret, type SysSecret } from "../../api/manage/secret";

const visible = ref(false);
const project = ref<SysProject | null>(null);
const bound = ref<SysSecret[]>([]);
const allSecrets = ref<SysSecret[]>([]);
const loadingBound = ref(false);
const loadingAll = ref(false);
const binding = ref<number | null>(null);
const unbinding = ref<number | null>(null);
const searchKeyword = ref("");

const filteredUnbound = computed(() => {
  const boundIds = new Set(bound.value.map((s) => s.sysSecretId));
  const kw = searchKeyword.value.toLowerCase();
  return allSecrets.value.filter(
    (s) =>
      !boundIds.has(s.sysSecretId) &&
      (!kw || s.sysSecretName?.toLowerCase().includes(kw)),
  );
});

const loadBound = async () => {
  if (!project.value?.projectId) return;
  loadingBound.value = true;
  try {
    const res = await fetchProjectSecrets(project.value.projectId);
    bound.value = (res.data ?? []) as SysSecret[];
  } finally {
    loadingBound.value = false;
  }
};

const loadAll = async () => {
  loadingAll.value = true;
  try {
    const res = await fetchPageSecret({ pageSize: 999 });
    allSecrets.value = (res.data ?? []) as SysSecret[];
  } finally {
    loadingAll.value = false;
  }
};

const handleBind = async (secret: SysSecret) => {
  binding.value = secret.sysSecretId!;
  try {
    const res = await fetchBindProjectSecret({
      projectId: project.value!.projectId!,
      secretId: secret.sysSecretId!,
    });
    if (res.code === "00000") {
      message("关联成功", { type: "success" });
      await loadBound();
    }
  } finally {
    binding.value = null;
  }
};

const handleUnbind = async (secret: SysSecret) => {
  unbinding.value = secret.sysSecretId!;
  try {
    const res = await fetchUnbindProjectSecret({
      projectId: project.value!.projectId!,
      secretId: secret.sysSecretId!,
    });
    if (res.code === "00000") {
      message("已取消关联", { type: "success" });
      await loadBound();
    }
  } finally {
    unbinding.value = null;
  }
};

const open = async (p: SysProject) => {
  project.value = p;
  searchKeyword.value = "";
  visible.value = true;
  await Promise.all([loadBound(), loadAll()]);
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.secret-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.section {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .search-input {
    margin-left: auto;
    width: 200px;
  }
}

.loading-area {
  height: 80px;
}

.secret-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.secret-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-bound {
    background: var(--el-color-success-light-9);
  }
}

.secret-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.secret-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
}

.secret-icon-default {
  font-size: 24px;
  color: var(--el-color-primary);
  width: 32px;
  text-align: center;
}

.secret-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.secret-group {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
