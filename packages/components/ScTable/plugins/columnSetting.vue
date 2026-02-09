<script>
import Sortable from "sortablejs";
import { defineComponent } from "vue";
import Caret from "@iconify-icons/ep/d-caret";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

export default defineComponent({
  props: {
    column: { type: Object, default: () => { } },
    layout: { type: String, default: "table" }, // 添加 layout 属性
    liveUpdate: { type: Boolean, default: false }, // 是否实时更新（不等待保存按钮）
    theme: { type: String, default: "" } // 主题
  },
  data() {
    return {
      icon: { Caret: null },
      isSave: false,
      usercolumn: JSON.parse(JSON.stringify(this.column || []))
    };
  },
  computed: {
    // 版本号用于监听 usercolumn 变化，避免深度监听
    usercolumnVersion() {
      return JSON.stringify(this.usercolumn);
    },
    // 版本号用于监听 column 变化
    columnVersion() {
      return JSON.stringify(this.column);
    }
  },
  watch: {
    usercolumnVersion() {
      this.$emit("userChange", this.usercolumn);
      // 如果开启了实时更新，立即发送变更的列数据
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    // 监听外部传入的column变化
    columnVersion(newVersion, oldVersion) {
      if (newVersion !== oldVersion) {
        this.usercolumn = JSON.parse(JSON.stringify(this.column || []));
        this.$nextTick(() => {
          if (this.usercolumn.length > 0) {
            this.rowDrop();
          }
        });
      }
    }
  },
  mounted() {
    this.icon.Caret = useRenderIcon(Caret);
    this.usercolumn.length > 0 && this.rowDrop();
  },
  methods: {
    rowDrop() {
      const _this = this;
      if (!this.$refs.list) return;

      const tbody = this.$refs.list.querySelector("ul");
      if (!tbody) return;

      Sortable.create(tbody, {
        handle: ".move",
        animation: 300,
        ghostClass: "ghost",
        onEnd({ newIndex, oldIndex }) {
          const tableData = _this.usercolumn;
          const currRow = tableData.splice(oldIndex, 1)[0];
          tableData.splice(newIndex, 0, currRow);

          // 如果开启了实时更新，在排序后立即通知变更
          if (_this.liveUpdate) {
            _this.$emit("live-update", _this.usercolumn);
          }
        }
      });
    },
    backDefaul() {
      this.$emit("back", this.usercolumn);
    },
    save() {
      this.$emit("save", this.usercolumn);
    },
    // 单独处理切换显示状态
    handleVisibilityChange(item) {
      // 立即通知变更
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    // 单独处理宽度变化
    handleWidthChange(item) {
      // 立即通知变更
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    // 单独处理排序状态变化
    handleSortableChange(item) {
      // 立即通知变更
      if (this.liveUpdate) {
        this.$emit("live-update", this.usercolumn);
      }
    },
    // 单独处理固定状态变化
    handleFixedChange(item) {
      // 立即通知变更
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
    </div>

    <div ref="list" class="setting-column__list custom-scrollbar">
      <ul>
        <li v-for="item in usercolumn" :key="item.prop" class="column-item">
          <span class="move_b">
            <el-tag class="move" size="small" type="info" effect="plain">
              <el-icon style="width: 1em; height: 1em">
                <component :is="icon.Caret" />
              </el-icon>
            </el-tag>
          </span>
          <span class="show_b">
            <el-switch v-model="item.hide" :active-value="false" :inactive-value="true"
              @change="() => handleVisibilityChange(item)" class="visibility-switch" />
          </span>
          <span class="name_b" :title="item.label">{{ item.label }}</span>
          <span class="width_b" v-if="layout === 'table'">
            <el-input-number v-model="item.width" :min="50" :max="1000" :step="10" controls-position="right"
              size="small" class="width-control" @change="() => handleWidthChange(item)" />
          </span>
          <span class="sortable_b" v-if="layout === 'table'">
            <el-switch v-model="item.sortable" @change="() => handleSortableChange(item)" class="feature-switch" />
          </span>
          <span class="fixed_b" v-if="layout === 'table'">
            <el-switch v-model="item.fixed" @change="() => handleFixedChange(item)" class="feature-switch" />
          </span>
        </li>
      </ul>
    </div>

    <div class="setting-column__bottom">
      <el-button :disabled="isSave" @click="backDefaul" size="small">
        <el-icon><i class="el-icon-refresh-right"></i></el-icon>
        重置
      </el-button>
      <el-button type="primary" @click="save" size="small">
        <el-icon><i class="el-icon-check"></i></el-icon>
        保存
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/mixins.scss" as *;

.column-setting-container {
  border-radius: 8px;
  background-color: var(--stitch-lay-bg-panel);
  display: flex;
  flex-direction: column;
  max-height: 450px;
  position: relative;

  // 主题变体
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

    .feature-switch, .visibility-switch {
      :deep(.el-switch.is-checked .el-switch__core) {
        background-color: var(--stitch-lay-#{$type});
        border-color: var(--stitch-lay-#{$type});
      }
    }
  }

  &.theme--primary { @include theme-variant('primary'); }
  &.theme--success { @include theme-variant('success'); }
  &.theme--warning { @include theme-variant('warning'); }
  &.theme--danger { @include theme-variant('error'); }
  &.theme--info { @include theme-variant('info'); }
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

/* Ghost class for sortable */
.ghost {
  opacity: 0.5;
  background: var(--stitch-lay-primary-alpha);
}
</style> 