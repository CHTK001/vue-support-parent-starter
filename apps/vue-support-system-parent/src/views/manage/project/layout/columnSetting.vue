<script>
import Sortable from "sortablejs";
import { defineComponent } from "vue";
import Caret from "@iconify-icons/ep/d-caret";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

export default defineComponent({
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
            <el-switch v-model="item.hide" :active-value="false" :inactive-value="true" />
          </span>
          <span class="name_b" :title="item.prop">
            {{ item.label || item.name }}
          </span>
          <span class="width_b">
            <el-input v-model="item.width" placeholder="auto" size="small" />
          </span>
          <span class="sortable_b">
            <el-switch v-model="item.sortable" />
          </span>
          <span class="fixed_b">
            <el-switch v-model="item.fixed" />
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

<style scoped>
.setting-column__title {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}
.setting-column__title span {
  display: inline-block;
  font-weight: bold;
  color: #909399;
  font-size: 12px;
}
.setting-column__title span.move_b {
  width: 30px;
  margin-right: 15px;
}
.setting-column__title span.show_b {
  width: 60px;
}
.setting-column__title span.name_b {
  width: 140px;
}
.setting-column__title span.width_b {
  width: 60px;
  margin-right: 15px;
}
.setting-column__title span.sortable_b {
  width: 60px;
}
.setting-column__title span.fixed_b {
  width: 60px;
}

.setting-column__list {
  max-height: 314px;
  overflow: auto;
}
.setting-column__list li {
  list-style: none;
  margin: 10px 0;
  display: flex;
  align-items: center;
}
.setting-column__list li > span {
  display: inline-block;
  font-size: 12px;
}
.setting-column__list li span.move_b {
  width: 30px;
  margin-right: 15px;
}
.setting-column__list li span.show_b {
  width: 60px;
}
.setting-column__list li span.name_b {
  width: 140px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: default;
}
.setting-column__list li span.width_b {
  width: 60px;
  margin-right: 15px;
}
.setting-column__list li span.sortable_b {
  width: 60px;
}
.setting-column__list li span.fixed_b {
  width: 60px;
}
.setting-column__list li.ghost {
  opacity: 0.3;
}

.setting-column__bottom {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  text-align: right;
}

.dark .setting-column__title {
  border-color: var(--el-border-color-light);
}
.dark .setting-column__bottom {
  border-color: var(--el-border-color-light);
}
</style>
