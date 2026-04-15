<script>
import Sortable from "sortablejs";
import { defineComponent } from "vue";
import Caret from "@iconify-icons/ep/d-caret";
import { useRenderIcon } from "@repo/components/ReIcon";

export default defineComponent({
  props: {
    column: { type: Array, default: () => [] },
    layout: { type: String, default: "table" },
    liveUpdate: { type: Boolean, default: false },
    theme: { type: String, default: "" }
  },
  data() {
    return {
      icon: { Caret: null },
      isSave: false,
      filterKeyword: "",
      sortableInstance: null,
      usercolumn: JSON.parse(JSON.stringify(this.column || []))
    };
  },
  computed: {
    usercolumnVersion() {
      return JSON.stringify(this.usercolumn);
    },
    columnVersion() {
      return JSON.stringify(this.column);
    },
    normalizedFilterKeyword() {
      return (this.filterKeyword || "").trim().toLowerCase();
    },
    filteredColumns() {
      if (!this.normalizedFilterKeyword) {
        return this.usercolumn;
      }

      return this.usercolumn.filter(item => {
        const label = String(item?.label || "").toLowerCase();
        const prop = String(item?.prop || "").toLowerCase();
        return label.includes(this.normalizedFilterKeyword) || prop.includes(this.normalizedFilterKeyword);
      });
    },
    canDragColumns() {
      return !this.normalizedFilterKeyword;
    }
  },
  watch: {
    usercolumnVersion() {
      this.$emit("userChange", this.usercolumn);
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    columnVersion(newVersion, oldVersion) {
      if (newVersion !== oldVersion) {
        this.usercolumn = JSON.parse(JSON.stringify(this.column || []));
        this.$nextTick(() => {
          if (this.usercolumn.length > 0) {
            this.syncSortable();
          }
        });
      }
    },
    filterKeyword() {
      this.$nextTick(() => {
        this.syncSortable();
      });
    }
  },
  mounted() {
    this.icon.Caret = useRenderIcon(Caret);
    this.usercolumn.length > 0 && this.syncSortable();
  },
  beforeUnmount() {
    this.destroySortable();
  },
  methods: {
    getColumnKey(item, index) {
      return item?.prop || item?.label || `column-${index}`;
    },
    getColumnLabel(item) {
      return item?.label || item?.prop || "未命名列";
    },
    destroySortable() {
      if (this.sortableInstance) {
        this.sortableInstance.destroy();
        this.sortableInstance = null;
      }
    },
    syncSortable() {
      this.destroySortable();

      if (!this.canDragColumns || !this.$refs.list) return;

      const tbody = this.$refs.list.querySelector("ul");
      if (!tbody) return;

      this.sortableInstance = Sortable.create(tbody, {
        handle: ".move",
        animation: 300,
        ghostClass: "ghost",
        onEnd: ({ newIndex, oldIndex }) => {
          const tableData = this.usercolumn;
          const currRow = tableData.splice(oldIndex, 1)[0];
          tableData.splice(newIndex, 0, currRow);

          if (this.liveUpdate) {
            this.$emit("live-update", this.usercolumn);
          }
        }
      });
    },
    rowDrop() {
      this.syncSortable();
    },
    backDefaul() {
      this.$emit("back", this.usercolumn);
    },
    save() {
      this.$emit("save", this.usercolumn);
    },
    handleVisibilityChange() {
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    handleWidthChange() {
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    handleSortableChange() {
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    handleFixedChange() {
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    }
  }
});
</script>

<template>
  <div v-if="usercolumn && usercolumn.length > 0" class="column-setting-container" :class="[`theme--${theme}`]">
    <div class="setting-column__header">
      <div class="setting-column__title">
        <span class="move_b">排序</span>
        <span class="show_b">显示</span>
        <span class="name_b">名称</span>
        <span class="width_b" v-if="layout === 'table'">宽度</span>
        <span class="sortable_b" v-if="layout === 'table'">排序</span>
        <span class="fixed_b" v-if="layout === 'table'">固定</span>
      </div>

      <div class="setting-column__toolbar">
        <ScInput
          v-model="filterKeyword"
          clearable
          size="small"
          placeholder="筛选列名或字段名"
          class="setting-column__search"
        />
        <span class="setting-column__count">{{ filteredColumns.length }}/{{ usercolumn.length }}</span>
      </div>

      <div v-if="!canDragColumns" class="setting-column__tip">筛选中已禁用拖拽排序，清空筛选后可调整列顺序</div>
    </div>

    <div ref="list" class="setting-column__list custom-scrollbar">
      <ul v-if="filteredColumns.length > 0">
        <li v-for="(item, index) in filteredColumns" :key="getColumnKey(item, index)" class="column-item">
          <span class="move_b">
            <ScTag class="move" :class="{ 'move--disabled': !canDragColumns }" size="small" type="info" effect="plain">
              <ScIcon style="width: 1em; height: 1em">
                <component :is="icon.Caret" />
              </ScIcon>
            </ScTag>
          </span>
          <span class="show_b">
            <ScSwitch v-model="item.hide" :active-value="false" :inactive-value="true" @change="handleVisibilityChange" class="visibility-switch" />
          </span>
          <span class="name_b" :title="getColumnLabel(item)">{{ getColumnLabel(item) }}</span>
          <span class="width_b" v-if="layout === 'table'">
            <ScInputNumber v-model="item.width" :min="50" :max="1000" :step="10" controls-position="right" size="small" class="width-control" @change="handleWidthChange" />
          </span>
          <span class="sortable_b" v-if="layout === 'table'">
            <ScSwitch v-model="item.sortable" @change="handleSortableChange" class="feature-switch" />
          </span>
          <span class="fixed_b" v-if="layout === 'table'">
            <ScSwitch v-model="item.fixed" @change="handleFixedChange" class="feature-switch" />
          </span>
        </li>
      </ul>
      <div v-else class="setting-column__empty">未找到匹配的列</div>
    </div>

    <div class="setting-column__bottom">
      <ScButton :disabled="isSave" @click="backDefaul" size="small">
        <ScIcon><i class="el-icon-refresh-right"></i></ScIcon>
        重置
      </ScButton>
      <ScButton type="primary" @click="save" size="small">
        <ScIcon><i class="el-icon-check"></i></ScIcon>
        保存
      </ScButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.column-setting-container {
  border-radius: 8px;
  background-color: var(--stitch-lay-bg-panel);
  display: flex;
  flex-direction: column;
  max-height: 450px;
  position: relative;

  @mixin theme-variant($type) {
    .ghost {
      background: var(--stitch-lay-#{$type}-bg);
    }

    .setting-column__bottom .el-button--primary {
      --el-button-bg-color: var(--stitch-lay-#{$type});
      --el-button-border-color: var(--stitch-lay-#{$type});
      --el-button-hover-bg-color: var(--stitch-lay-#{$type}-light);
      --el-button-hover-border-color: var(--stitch-lay-#{$type}-light);
      --el-button-active-bg-color: var(--stitch-lay-#{$type});
      --el-button-active-border-color: var(--stitch-lay-#{$type});
    }

    .feature-switch,
    .visibility-switch {
      :deep(.el-switch.is-checked .el-switch__core) {
        background-color: var(--stitch-lay-#{$type});
        border-color: var(--stitch-lay-#{$type});
      }
    }
  }

  &.theme--primary {
    @include theme-variant("primary");
  }
  &.theme--success {
    @include theme-variant("success");
  }
  &.theme--warning {
    @include theme-variant("warning");
  }
  &.theme--danger {
    @include theme-variant("error");
  }
  &.theme--info {
    @include theme-variant("info");
  }
}

.setting-column__header {
  margin-bottom: 10px;
  background-color: var(--stitch-lay-bg-hover);
  border-radius: 6px;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.setting-column__title {
  display: flex;
  align-items: center;
}

.setting-column__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.setting-column__search {
  flex: 1;
}

.setting-column__count {
  flex-shrink: 0;
  min-width: 52px;
  text-align: right;
  font-size: 12px;
  color: var(--stitch-lay-text-sub);
}

.setting-column__tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--stitch-lay-warning);
}

.setting-column__title span {
  display: inline-block;
  font-weight: 600;
  color: var(--stitch-lay-text-sub);
  font-size: 13px;
}

.setting-column__title span.move_b {
  width: 50px;
}

.setting-column__title span.show_b {
  width: 60px;
}

.setting-column__title span.name_b {
  flex: 1;
  min-width: 80px;
}

.setting-column__title span.width_b {
  width: 120px;
  text-align: center;
  padding-right: 10px;
}

.setting-column__title span.sortable_b {
  width: 60px;
  text-align: center;
}

.setting-column__title span.fixed_b {
  width: 60px;
  text-align: center;
}

.setting-column__list {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 0;
  max-height: 280px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--stitch-lay-border);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: var(--stitch-lay-bg-group);
  border-radius: 10px;
}

.setting-column__list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.column-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--stitch-lay-border);
  transition: background-color 0.2s;
}

.column-item:hover {
  background-color: var(--stitch-lay-bg-hover);
}

.column-item:last-child {
  border-bottom: none;
}

.column-item span {
  display: flex;
  align-items: center;
}

.column-item span.move_b {
  width: 50px;
}

.column-item span.show_b {
  width: 60px;
}

.column-item span.name_b {
  flex: 1;
  min-width: 80px;
  font-size: 14px;
  margin-right: 10px;
  color: var(--stitch-lay-text-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.column-item span.width_b {
  width: 120px;
  text-align: center;
  padding-right: 10px;
}

.column-item span.sortable_b {
  width: 60px;
  text-align: center;
}

.column-item span.fixed_b {
  width: 60px;
  text-align: center;
}

.setting-column__bottom {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid var(--stitch-lay-border);
  margin-top: auto;
}

.move {
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
}

.move.move--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.setting-column__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: 16px;
  color: var(--stitch-lay-text-sub);
  font-size: 13px;
}

.visibility-switch,
.feature-switch {
  display: inline-flex;
}

.width-control :deep(.el-input-number__decrease),
.width-control :deep(.el-input-number__increase) {
  background-color: transparent;
  border-color: var(--stitch-lay-border);
}

.width-control :deep(.el-input__inner) {
  text-align: center;
}

.ghost {
  opacity: 0.5;
  background: var(--stitch-lay-primary-alpha);
}
</style>
