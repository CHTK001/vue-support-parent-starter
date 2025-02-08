<template>
  <div class="h-full">
    <el-empty v-if="result.length == 0" />
    <el-table v-else :data="result" border class="z-[999]" @cell-click="handleCellClick">
      <el-table-column prop="data" label="数据">
        <template #default="{ row }">
          <span>{{ row.data }}</span>
          <div class="edit hidden">
            <el-input v-model="row.data" size="small" class="h-[48px]" placeholder="请输入内容" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="expire" label="过期时间" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button text type="danger" :icon="useRenderIcon('ri:delete-bin-7-fill')" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <Node ref="nodeRef" :data="data" @success="handleNodeSuccess" />
  </div>
</template>
<script setup>
import { fetchGenSessionDelete, fetchGenSessionExecute, fetchGenSessionUpdate } from "@/api/monitor/gen/session";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineExpose, defineProps, onMounted, onUnmounted, reactive, ref, defineEmits } from "vue";
import Node from "./node.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const emit = defineEmits(["success"]);
const codeRef = ref();
const nodeRef = ref();

const props = defineProps({
  data: Object,
});

const result = ref([]);

const filterData = reactive({
  tableData: {},
  tableNode: {},
  currentEditData: null,
});

const elemet = reactive({
  editElement: [],
});
const form = reactive({});

const visible = reactive({
  documentVisible: false,
  searchVisible: false,
  isExecuteTable: false,
});

onMounted(() => {
  document.addEventListener("click", handleCellClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleCellClickOutside);
});
const handleNodeSuccess = (node) => {
  emit("success", node);
};
const handleCellClickOutside = () => {
  elemet.editElement.forEach((item) => {
    if (item.classList?.contains("edit")) {
      item.classList.add("hidden");
      return;
    }
    item.classList.remove("hidden");
  });

  if (filterData.currentEditData) {
    handleExecuteUpdate(filterData.currentEditData);
  }
  filterData.currentEditData = null;
};
const handleCellClick = async (row, column, cell, event) => {
  event.stopPropagation();
  event.preventDefault();
  filterData.currentEditData = row;
  const eles = cell.getElementsByClassName("cell")[0];
  const children = eles.children;
  for (var i = 0; i < children.length; i++) {
    elemet.editElement.push(children[i]);
    children[i].classList.add("hidden");
  }
  eles.getElementsByClassName("edit")[0].classList.remove("hidden");
  elemet.editElement.push(eles.getElementsByClassName("edit")[0]);
};

const handleNodeEditClick = async (data, node) => {
  nodeRef.value.setData(data);
  nodeRef.value.setNode(node);
  nodeRef.value.open("edit");
};
const handleNodeSaveClick = async (data, node) => {
  nodeRef.value.setData(data);
  nodeRef.value.setNode(node);
  nodeRef.value.open("add");
};
const handleExecuteUpdate = (row) => {
  const newForm = {};
  newForm.data = row.data;
  newForm.type = "DATA";
  newForm.genId = props.data.genId;
  newForm.content = filterData.tableData.nodeId;
  fetchGenSessionUpdate(newForm).then((res) => {
    if (res.code == "00000") {
      message(t("message.updateSuccess"), { type: "success" });
    }
  });
};
const onDelete = (row) => {
  const newForm = {};
  newForm.data = row.data;
  newForm.type = "DATA";
  newForm.genId = props.data.genId;
  newForm.content = filterData.tableData.nodeId;
  fetchGenSessionDelete(newForm).then((res) => {
    if (res.code == "00000") {
      row.data = null;
      message("删除成功", { type: "success" });
    }
  });
};
const handleNodeDeleteClick = async (row) => {
  const newForm = {};
  newForm.type = "NODE";
  newForm.genId = props.data.genId;
  newForm.content = row.nodeId;
  const res = await fetchGenSessionDelete(newForm);
  return res.code === "00000";
};

const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  filterData.tableNode = node;
  form.content = tableData.nodeId;
  form.genId = props.data.genId;
  handleExecuteSql();
};

const upgradeHits = async (hits) => {
  codeRef.value.upgradeHits(hits);
};

const handleExecuteSql = async () => {
  fetchGenSessionExecute(form).then((res) => {
    result.value = res?.data?.data || [];
  });
};

defineExpose({ upgrade, upgradeHits, handleNodeEditClick, handleNodeDeleteClick, handleNodeSaveClick });
</script>
<stype scoped>
  
</stype>
