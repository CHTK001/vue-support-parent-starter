<script>
import Sortable from "sortablejs";
import { defineComponent } from "vue";
import Caret from "@iconify-icons/ep/d-caret";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScSwitch from "@repo/components/ScSwitch/index.vue";

export default defineComponent({
  components: { ScSwitch },
  props: {
    column: { type: Object, default: () => {} },
  },
  data() {
    return {
      icon: { Caret: null },
      isSave: false,
      usercolumn: JSON.parse(JSON.stringify(this.column || [])),
    };
  },
  watch: {
    usercolumn: {
      handler() {
        this.$emit("userChange", this.usercolumn);
      },
      deep: true,
    },
  },
  mounted() {
    this.icon.Caret = useRenderIcon(Caret);
    this.usercolumn.length > 0 && this.rowDrop();
  },
  methods: {
    rowDrop() {
      const _this = this;
      const tbody = this.$refs.list.querySelector("ul");
      Sortable.create(tbody, {
        handle: ".move",
        animation: 300,
        ghostClass: "ghost",
        onEnd({ newIndex, oldIndex }) {
          const tableData = _this.usercolumn;
          const currRow = tableData.splice(oldIndex, 1)[0];
          tableData.splice(newIndex, 0, currRow);
        },
      });
    },
    backDefaul() {
      this.$emit("back", this.usercolumn);
    },
    save() {
      this.$emit("save", this.usercolumn);
    },
  },
});
</script>
<template>
  <div v-if="usercolumn.length > 0" v-loading="isSave" class="setting-column">
    <div class="setting-column__title">
      <span class="move_b" />
      <span class="show_b">显示</span>
      <span class="name_b">名称</span>
      <span class="width_b">宽度</span>
      <span class="sortable_b">排序</span>
      <span class="fixed_b">固定</span>
    </div>
    <div ref="list" class="setting-column__list">
      <ul>
        <li v-for="item in usercolumn" :key="item.prop">
          <span class="move_b">
            <el-tag class="move" style="cursor: move">
              <el-icon style="width: 1em; height: 1em">
                <component :is="icon.Caret" />
              </el-icon>
            </el-tag>
          </span>
          <span class="show_b">
            <ScSwitch
              v-model="item.hide"
              :active-value="false"
              :inactive-value="true"
              layout="modern"
            />
          </span>
          <span class="name_b" :title="item.prop">
            {{ item.label || item.name }}
          </span>
          <span class="width_b">
            <el-input v-model="item.width" placeholder="auto" size="small" />
          </span>
          <span class="sortable_b">
            <ScSwitch v-model="item.sortable" layout="modern" />
          </span>
          <span class="fixed_b">
            <ScSwitch v-model="item.fixed" layout="modern" />
          </span>
        </li>
      </ul>
    </div>
    <div class="setting-column__bottom">
      <el-button :disabled="isSave" @click="backDefaul">重置</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </div>
  </div>
  <el-empty v-else description="暂无可配置的列" :image-size="80" />
</template>

<style scoped lang="scss">
.setting-column {
  padding: 8px;
}

.setting-column__title {
  border-bottom: 2px solid var(--el-color-primary-light-7);
  padding-bottom: 16px;
  margin-bottom: 8px;
  background: linear-gradient(
    180deg,
    var(--el-color-primary-light-9) 0%,
    transparent 100%
  );
  padding: 12px 16px;
  border-radius: 10px 10px 0 0;

  span {
    display: inline-block;
    font-weight: 700;
    color: var(--el-text-color-primary);
    font-size: 13px;

    &.move_b {
      width: 30px;
      margin-right: 15px;
    }

    &.show_b {
      width: 60px;
    }

    &.name_b {
      width: 140px;
    }

    &.width_b {
      width: 60px;
      margin-right: 15px;
    }

    &.sortable_b {
      width: 60px;
    }

    &.fixed_b {
      width: 60px;
    }
  }
}

.setting-column__list {
  max-height: 314px;
  overflow: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  li {
    list-style: none;
    margin: 8px 0;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    background: var(--el-bg-color-overlay);
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
      transform: translateX(4px);
    }

    &.ghost {
      opacity: 0.3;
      background: var(--el-color-primary-light-9);
    }

    > span {
      display: inline-block;
      font-size: 13px;
      color: var(--el-text-color-primary);

      &.move_b {
        width: 30px;
        margin-right: 15px;
      }

      &.show_b {
        width: 60px;
      }

      &.name_b {
        width: 140px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        cursor: default;
        font-weight: 500;
      }

      &.width_b {
        width: 60px;
        margin-right: 15px;
      }

      &.sortable_b {
        width: 60px;
      }

      &.fixed_b {
        width: 60px;
      }
    }
  }
}

.setting-column__bottom {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
  margin-top: 8px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  :deep(.el-button) {
    border-radius: 10px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
    }

    &.el-button--primary:hover {
      box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
    }
  }
}

:deep(.el-tag) {
  border-radius: 8px;
  cursor: move;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover,
    &:focus-within {
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.12);
    }
  }
}

.dark .setting-column__title {
  border-color: var(--el-border-color-light);
  background: linear-gradient(
    180deg,
    rgba(var(--el-color-primary-rgb), 0.1) 0%,
    transparent 100%
  );
}

.dark .setting-column__bottom {
  border-color: var(--el-border-color-light);
}
</style>
