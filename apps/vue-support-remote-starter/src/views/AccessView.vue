<template>
  <div class="access-view">
    <div class="page-header">
      <div>
        <div class="page-title">接入码</div>
        <div class="page-sub">控制端接入令牌 / 被控端验证码管理</div>
      </div>
      <el-button type="primary" @click="generate">生成接入码</el-button>
    </div>

    <el-table :data="codes" border stripe style="width: 100%">
      <el-table-column prop="code" label="接入码" min-width="160" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === '控制端令牌' ? 'primary' : 'warning'" size="small">
            {{ row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="copyCode(row)">
            复制
          </el-button>
          <el-button size="small" type="danger" link @click="toggle(row)">
            {{ row.status === "启用" ? "停用" : "启用" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

interface AccessCode {
  code: string;
  type: string;
  status: string;
  createdAt: string;
}

const codes = ref<AccessCode[]>([]);

/** 生成随机接入码 */
const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

const now = () => new Date().toLocaleString("zh-CN", { hour12: false });

/** 保存接入码列表到后台（POST /api/remote/access-codes；后端不可达仅本地） */
const save = async () => {
  try {
    await fetch("/api/remote/access-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(codes.value),
    });
  } catch {
    /* 后端不可达——仅本地 */
  }
};

/** 加载（真实后端接口 GET /api/remote/access-codes；后端不可达降级示例数据） */
const load = async () => {
  try {
    const resp = await fetch("/api/remote/access-codes");
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        codes.value = data;
        return;
      }
    }
  } catch {
    /* 后端不可达——走本地示例 */
  }
  codes.value = [
    { code: "CTRL-TOKEN-1", type: "控制端令牌", status: "启用", createdAt: now() },
    { code: "VERIFY-0000", type: "被控端验证码", status: "启用", createdAt: now() },
  ];
  ElMessage.warning("后端不可达——显示示例数据");
};

const generate = async () => {
  codes.value.unshift({
    code: randomCode(),
    type: "控制端令牌",
    status: "启用",
    createdAt: now(),
  });
  ElMessage.success("已生成接入码");
  await save();
};

const copyCode = (row: AccessCode) => {
  navigator.clipboard?.writeText(row.code).then(() => {
    ElMessage.success("已复制");
  });
};

const toggle = async (row: AccessCode) => {
  row.status = row.status === "启用" ? "停用" : "启用";
  await save();
};

onMounted(load);
</script>

<style lang="scss" scoped>
.access-view {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
}

.page-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
</style>
