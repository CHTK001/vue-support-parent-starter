<template>
  <div class="api-tree-list">
    <!-- 搜索框 -->
    <div class="search-box" v-if="showSearch">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索接口..."
        size="small"
        clearable
      >
        <template #prefix>
          <i class="ri-search-line"></i>
        </template>
      </el-input>
    </div>

    <!-- API 树 -->
    <div class="api-tree">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="!filteredApiGroups.length" class="empty-container">
        <el-empty description="暂无API文档" :image-size="80" />
      </div>
      <div v-else class="api-groups">
        <div
          v-for="group in filteredApiGroups"
          :key="group.name"
          class="api-group"
        >
          <div
            class="group-header"
            @click="toggleGroup(group.name)"
            :class="{ expanded: expandedGroups.includes(group.name) }"
          >
            <i class="ri-folder-line group-icon"></i>
            <span class="group-name">{{ group.name }}</span>
            <span class="api-count">({{ group.apis.length }})</span>
            <i class="ri-arrow-right-s-line expand-icon"></i>
          </div>

          <transition name="slide-down">
            <div
              v-show="expandedGroups.includes(group.name)"
              class="group-apis"
            >
              <div
                v-for="api in group.apis"
                :key="api.path + api.method"
                class="api-item"
                :class="{
                  active:
                    selectedApi?.path === api.path &&
                    selectedApi?.method === api.method,
                }"
                @click="selectApi(api)"
              >
                <div class="api-method" :class="api.method.toLowerCase()">
                  {{ api.method }}
                </div>
                <div class="api-info">
                  <div class="api-path">{{ api.path }}</div>
                  <div class="api-summary">
                    {{ api.summary || "无描述" }}
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ApiGroup, ApiInfo } from "../types";

const props = withDefaults(
  defineProps<{
    /** API 分组列表 */
    apiGroups: ApiGroup[];
    /** 当前选中的 API */
    selectedApi?: ApiInfo | null;
    /** 是否加载中 */
    loading?: boolean;
    /** 是否显示搜索框 */
    showSearch?: boolean;
    /** 默认展开的分组 */
    defaultExpandedGroups?: string[];
  }>(),
  {
    loading: false,
    showSearch: true,
    defaultExpandedGroups: () => [],
  }
);

const emit = defineEmits<{
  (e: "select", api: ApiInfo): void;
  (e: "update:selectedApi", api: ApiInfo | null): void;
}>();

// 搜索关键词
const searchKeyword = ref("");

// 展开的分组
const expandedGroups = ref<string[]>([...props.defaultExpandedGroups]);

// 过滤后的 API 分组
const filteredApiGroups = computed(() => {
  if (!searchKeyword.value) return props.apiGroups;

  return props.apiGroups
    .map((group) => ({
      ...group,
      apis: group.apis.filter(
        (api) =>
          api.path.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
          api.summary
            ?.toLowerCase()
            .includes(searchKeyword.value.toLowerCase()) ||
          api.method.toLowerCase().includes(searchKeyword.value.toLowerCase())
      ),
    }))
    .filter((group) => group.apis.length > 0);
});

// 切换分组展开状态
const toggleGroup = (groupName: string) => {
  const index = expandedGroups.value.indexOf(groupName);
  if (index > -1) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(groupName);
  }
};

// 选择 API
const selectApi = (api: ApiInfo) => {
  emit("select", api);
  emit("update:selectedApi", api);
};

// 监听搜索关键词变化，自动展开所有分组
watch(searchKeyword, () => {
  if (searchKeyword.value && filteredApiGroups.value.length > 0) {
    expandedGroups.value = filteredApiGroups.value.map((group) => group.name);
  }
});

// 监听 apiGroups 变化，自动展开第一个分组
watch(
  () => props.apiGroups,
  (newGroups) => {
    if (newGroups.length > 0 && expandedGroups.value.length === 0) {
      expandedGroups.value = [newGroups[0].name];
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.api-tree-list {
  display: flex;
  flex-direction: column;
  height: 100%;

  .search-box {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  .api-tree {
    flex: 1;
    overflow-y: auto;

    .loading-container,
    .empty-container {
      padding: 40px 20px;
    }

    .api-groups {
      .api-group {
        .group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;

          &:hover {
            background: #f9fafb;
          }

          &.expanded {
            background: #f3f4f6;

            .expand-icon {
              transform: rotate(90deg);
            }
          }

          .group-icon {
            color: #6b7280;
            font-size: 16px;
          }

          .group-name {
            flex: 1;
            font-weight: 500;
            color: #374151;
          }

          .api-count {
            font-size: 12px;
            color: #9ca3af;
          }

          .expand-icon {
            color: #9ca3af;
            transition: transform 0.2s ease;
          }
        }

        .group-apis {
          .api-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 20px 16px 48px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-bottom: 1px solid #f1f5f9;
            margin: 2px 8px;
            border-radius: 8px;
            position: relative;
            overflow: hidden;

            &::before {
              content: "";
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.6),
                transparent
              );
              transition: left 0.5s ease;
            }

            &:hover {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              transform: translateX(4px);
              box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.1);
              border-bottom-color: transparent;

              &::before {
                left: 100%;
              }
            }

            &.active {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              border-left: 4px solid #3b82f6;
              transform: translateX(2px);
              box-shadow: 0 4px 15px -4px rgba(59, 130, 246, 0.25);
              border-bottom-color: transparent;
            }

            .api-method {
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              min-width: 50px;
              text-align: center;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;

              &.get {
                background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
                color: #166534;
                border: 1px solid #86efac;
              }
              &.post {
                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                color: #1d4ed8;
                border: 1px solid #93c5fd;
              }
              &.put {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                color: #92400e;
                border: 1px solid #fcd34d;
              }
              &.delete {
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                color: #dc2626;
                border: 1px solid #f87171;
              }
              &.patch {
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                color: #7c3aed;
                border: 1px solid #c4b5fd;
              }
            }

            .api-info {
              flex: 1;
              min-width: 0;

              .api-path {
                font-size: 13px;
                font-weight: 500;
                color: #374151;
                word-break: break-all;
              }

              .api-summary {
                font-size: 12px;
                color: #9ca3af;
                margin-top: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
      }
    }
  }
}

// 展开动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
