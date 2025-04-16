<script>
import Sortable from "sortablejs";
import { defineComponent } from "vue";
import Caret from "@iconify-icons/ep/d-caret";
import { useRenderIcon } from "../ReIcon/src/hooks";

export default defineComponent({
  props: {
    column: { type: Object, default: () => { } },
    layout: { type: String, default: "table" }, // 添加 layout 属性
    liveUpdate: { type: Boolean, default: false } // 是否实时更新（不等待保存按钮）
  },
  data() {
    return {
      icon: { Caret: null },
      isSave: false,
      usercolumn: JSON.parse(JSON.stringify(this.column || []))
    };
  },
  watch: {
    usercolumn: {
      handler() {
        this.$emit("userChange", this.usercolumn);

        // 如果开启了实时更新，立即发送变更的列数据
        if (this.liveUpdate) {
          this.$emit("live-update", this.usercolumn);
        }
      },
      deep: true
    },
    // 监听外部传入的column变化
    column: {
      handler(newVal) {
        if (newVal && JSON.stringify(newVal) !== JSON.stringify(this.usercolumn)) {
          this.usercolumn = JSON.parse(JSON.stringify(newVal || []));
          this.$nextTick(() => {
            if (this.usercolumn.length > 0) {
              this.rowDrop();
            }
          });
        }
      },
      deep: true
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
  <div v-if="usercolumn && usercolumn.length > 0" class="column-setting-container">
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

<style scoped>
.column-setting-container {
  border-radius: 8px;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  max-height: 450px;
  position: relative;
}

.setting-column__header {
  margin-bottom: 10px;
  background-color: var(--el-fill-color-light);
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
  color: var(--el-text-color-secondary);
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
  background-color: var(--el-border-color-lighter);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: var(--el-fill-color-lighter);
  border-radius: 10px;
}

.setting-column__list ul {
  padding: 0;
  margin: 0;
}

.column-item {
  list-style: none;
  margin: 8px 0;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: all 0.3s;
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
}

.column-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.column-item span {
  display: inline-block;
  font-size: 13px;
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
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: default;
  color: var(--el-text-color-primary);
  font-weight: 500;
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

.width-control {
  width: 100px;
}

.column-item.ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-9);
  border: 1px dashed var(--el-color-primary);
}

.setting-column__bottom {
  border-top: 1px solid var(--el-border-color-light);
  margin-top: 15px;
  padding: 15px 0 0;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  position: sticky;
  bottom: 0;
  background-color: var(--el-bg-color);
  z-index: 10;
}

.move {
  cursor: move !important;
  transition: all 0.2s;
}

.move:hover {
  transform: scale(1.1);
}

.visibility-switch,
.feature-switch {
  --el-switch-on-color: var(--el-color-primary);
}

/* 暗色模式适配 */
.dark .column-item {
  border-color: var(--el-border-color);
}

.dark .column-item:hover {
  background-color: var(--el-fill-color);
}
</style>
