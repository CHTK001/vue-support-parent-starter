<template>
  <div class="container-filter system-container modern-bg">
    <div class="filter-header">
      <div class="header-title">容器过滤</div>
    </div>

    <div class="filter-content">
      <ScForm :model="filterParams" label-position="top" @submit.prevent>
        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="容器名称">
              <ScInput
                v-model="filterParams.name"
                placeholder="请输入容器名称"
                clearable
                @keyup.enter="applyFilter"
              />
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="镜像名称">
              <ScInput
                v-model="filterParams.image"
                placeholder="请输入镜像名称"
                clearable
                @keyup.enter="applyFilter"
              />
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="运行状态">
              <ScSelect
                v-model="filterParams.status"
                placeholder="请选择运行状态"
                clearable
                style="width: 100%"
              >
                <ScOption label="全部" value="" />
                <ScOption label="运行中" value="running" />
                <ScOption label="已停止" value="stopped" />
                <ScOption label="暂停" value="paused" />
                <ScOption label="重启中" value="restarting" />
                <ScOption label="错误" value="error" />
              </ScSelect>
            </ScFormItem>
          </ScCol>

          <ScCol :span="12">
            <ScFormItem label="服务器">
              <ScSelect
                v-model="filterParams.serverId"
                placeholder="请选择服务器"
                clearable
                style="width: 100%"
              >
                <ScOption label="全部" value="" />
                <ScOption
                  v-for="server in serverOptions"
                  :key="server.id"
                  :label="server.name"
                  :value="server.id"
                />
              </ScSelect>
            </ScFormItem>
          </ScCol>
        </ScRow>

        <div class="filter-actions">
          <ScButton type="primary" @click="applyFilter">
            <IconifyIconOnline icon="ri:search-line" class="mr-1" />
            应用过滤
          </ScButton>
          <ScButton @click="resetFilter">
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            重置
          </ScButton>
        </div>
      </ScForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface ServerOption {
  id: number;
  name: string;
}

interface FilterParams {
  name: string;
  image: string;
  status: string;
  serverId: string;
}

interface Props {
  serverOptions: ServerOption[];
}

interface Emits {
  (e: "apply-filter", params: FilterParams): void;
  (e: "reset-filter"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const filterParams = ref<FilterParams>({
  name: "",
  image: "",
  status: "",
  serverId: "",
});

// 应用过滤
const applyFilter = () => {
  emit("apply-filter", filterParams.value);
};

// 重置过滤
const resetFilter = () => {
  filterParams.value = {
    name: "",
    image: "",
    status: "",
    serverId: "",
  };
  emit("reset-filter");
};
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.container-filter {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.filter-header {
  margin-bottom: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
