<template>
  <div ref="scFormTable" class="sc-form-table">
    <el-table ref="table" :data="data" border stripe :height="height">
      <el-table-column type="index" width="50" fixed="left">
        <template #header>
          <el-button v-if="!hideAdd" type="primary" :icon="useRenderIcon('ep:plus')" size="small" circle @click="rowAdd" />
        </template>
        <template #default="scope">
          <div :class="['sc-form-table-handle', { 'sc-form-table-handle-delete': !hideDelete }]">
            <span>{{ scope.$index + 1 }}</span>
            <el-button v-if="!hideDelete" type="danger" :icon="useRenderIcon('ep:delete')" size="small" plain circle @click="rowDel(scope.row, scope.$index)" />
          </div>
        </template>
      </el-table-column>
      <el-table-column v-if="dragSort" label="" width="50">
        <template #default>
          <div class="move" style="cursor: move">
            <component :is="useRenderIcon('ep:d-caret')" style="width: 1em; height: 1em" />
          </div>
        </template>
      </el-table-column>
      <slot />
      <template #empty>
        {{ placeholder }}
      </template>
    </el-table>
  </div>
</template>

<script>
import Sortable from "sortablejs";
import { useRenderIcon } from "../ReIcon/src/hooks";

export default {
  props: {
    modelValue: { type: Array, default: () => [] },
    addTemplate: { type: Object, default: () => {} },
    placeholder: { type: String, default: "暂无数据" },
    dragSort: { type: Boolean, default: false },
    height: { type: Number, default: 300 },
    hideAdd: { type: Boolean, default: false },
    hideDelete: { type: Boolean, default: false }
  },
  data() {
    return {
      data: []
    };
  },
  watch: {
    modelValue() {
      this.data = this.modelValue;
    },
    data: {
      handler() {
        this.$emit("update:modelValue", this.data);
      },
      deep: true
    }
  },
  mounted() {
    this.data = this.modelValue;
    if (this.dragSort) {
      this.rowDrop();
    }
  },
  methods: {
    useRenderIcon,
    rowDrop() {
      const _this = this;
      const tbody = this.$refs.table.$el.querySelector(".el-table__body-wrapper tbody");
      Sortable.create(tbody, {
        handle: ".move",
        animation: 300,
        ghostClass: "ghost",
        onEnd({ newIndex, oldIndex }) {
          _this.data.splice(newIndex, 0, _this.data.splice(oldIndex, 1)[0]);
          const newArray = _this.data.slice(0);
          const tmpHeight = _this.$refs.scFormTable.offsetHeight;
          _this.$refs.scFormTable.style.setProperty("height", tmpHeight + "px");
          _this.data = [];
          _this.$nextTick(() => {
            _this.data = newArray;
            _this.$nextTick(() => {
              _this.$refs.scFormTable.style.removeProperty("height");
            });
          });
        }
      });
    },
    rowAdd() {
      const temp = JSON.parse(JSON.stringify(this.addTemplate));
      this.data.push(temp);
    },
    rowDel(row, index) {
      this.data.splice(index, 1);
    },
    //插入行
    pushRow(row) {
      const temp = row || JSON.parse(JSON.stringify(this.addTemplate));
      this.data.push(temp);
    },
    //根据index删除
    deleteRow(index) {
      this.data.splice(index, 1);
    }
  }
};
</script>

<style scoped>
.sc-form-table {
  width: 100%;
}
.sc-form-table .sc-form-table-handle {
  text-align: center;
}
.sc-form-table .sc-form-table-handle span {
  display: inline-block;
}
.sc-form-table .sc-form-table-handle button {
  display: none;
}
.sc-form-table .hover-row .sc-form-table-handle-delete span {
  display: none;
}
.sc-form-table .hover-row .sc-form-table-handle-delete button {
  display: inline-block;
}
.sc-form-table .move {
  text-align: center;
  font-size: 14px;
  margin-top: 3px;
}
</style>
