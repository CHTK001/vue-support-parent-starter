<template>
  <div class="branch-wrap">
    <div class="branch-box-wrap">
      <div class="branch-box">
        <ScButton class="add-branch" type="success" plain round @click="addTerm">添加条件</ScButton>
        <div v-for="(item, index) in nodeConfig.conditionNodes" :key="index" class="col-box">
          <div class="condition-node">
            <div class="condition-node-box">
              <div class="auto-judge" @click="show(index)">
                <div v-if="index != 0" class="sort-left" @click.stop="arrTransfer(index, -1)">
                  <ScIcon><el-icon-arrow-left /></ScIcon>
                </div>
                <div class="title">
                  <span class="node-title">{{ item.nodeName }}</span>
                  <span class="priority-title">优先级{{ item.priorityLevel }}</span>
                  <ScIcon class="close" @click.stop="delTerm(index)"><el-icon-close /></ScIcon>
                </div>
                <div class="content">
                  <span v-if="toText(nodeConfig, index)">{{ toText(nodeConfig, index) }}</span>
                  <span v-else class="placeholder">请设置条件</span>
                </div>
                <div v-if="index != nodeConfig.conditionNodes.length - 1" class="sort-right" @click.stop="arrTransfer(index)">
                  <ScIcon><el-icon-arrow-right /></ScIcon>
                </div>
              </div>
              <add-node v-model="item.childNode" />
            </div>
          </div>
          <slot v-if="item.childNode" :node="item" />
          <div v-if="index == 0" class="top-left-cover-line" />
          <div v-if="index == 0" class="bottom-left-cover-line" />
          <div v-if="index == nodeConfig.conditionNodes.length - 1" class="top-right-cover-line" />
          <div v-if="index == nodeConfig.conditionNodes.length - 1" class="bottom-right-cover-line" />
        </div>
      </div>
      <add-node v-model="nodeConfig.childNode" />
    </div>
    <sc-drawer v-model="drawer" title="条件设置" destroy-on-close append-to-body :size="600">
      <template #header>
        <div class="node-wrap-drawer__title">
          <label v-if="!isEditTitle" @click="editTitle">
            {{ form.nodeName }}
            <ScIcon class="node-wrap-drawer__title-edit"><el-icon-edit /></ScIcon>
          </label>
          <ScInput v-if="isEditTitle" ref="nodeTitle" v-model="form.nodeName" clearable @blur="saveTitle" @keyup.enter="saveTitle" />
        </div>
      </template>
      <ScContainer>
        <ScMain style="padding: 0 20px 20px 20px">
          <ScForm label-position="top">
            <ScFormItem label="条件关系">
              <ScRadioGroup v-model="form.conditionMode">
                <ScRadio :label="1">且</ScRadio>
                <ScRadio :label="2">或</ScRadio>
              </ScRadioGroup>
            </ScFormItem>
            <ScDivider />
            <ScFormItem>
              <ScTable :data="form.conditionList">
                <ScTableColumn prop="label" label="描述">
                  <template #default="scope">
                    <ScInput v-model="scope.row.label" placeholder="描述" />
                  </template>
                </ScTableColumn>
                <ScTableColumn prop="field" label="条件字段" width="130">
                  <template #default="scope">
                    <ScInput v-model="scope.row.field" placeholder="条件字段" />
                  </template>
                </ScTableColumn>
                <ScTableColumn prop="operator" label="运算符" width="130">
                  <template #default="scope">
                    <ScSelect v-model="scope.row.operator" placeholder="Select">
                      <ScOption label="等于" value="=" />
                      <ScOption label="不等于" value="!=" />
                      <ScOption label="大于" value=">" />
                      <ScOption label="大于等于" value=">=" />
                      <ScOption label="小于" value="<" />
                      <ScOption label="小于等于" value="<=" />
                      <ScOption label="包含" value="include" />
                      <ScOption label="不包含" value="notinclude" />
                    </ScSelect>
                  </template>
                </ScTableColumn>
                <ScTableColumn prop="value" label="值" width="100">
                  <template #default="scope">
                    <ScInput v-model="scope.row.value" placeholder="值" />
                  </template>
                </ScTableColumn>
                <ScTableColumn prop="value" label="移除" width="55">
                  <template #default="scope">
                    <ScLink type="danger" :underline="false" @click="deleteConditionList(scope.$index)">移除</ScLink>
                  </template>
                </ScTableColumn>
              </ScTable>
            </ScFormItem>
            <p><ScButton type="primary" icon="el-icon-plus" round @click="addConditionList">增加条件</ScButton></p>
          </ScForm>
        </ScMain>
        <ScFooter>
          <ScButton type="primary" @click="save">保存</ScButton>
          <ScButton @click="drawer = false">取消</ScButton>
        </ScFooter>
      </ScContainer>
    </sc-drawer>
  </div>
</template>

<script>
import addNode from "./addNode.vue";

export default {
  components: {
    addNode
  },
  props: {
    modelValue: { type: Object, default: () => {} }
  },
  data() {
    return {
      nodeConfig: {},
      drawer: false,
      isEditTitle: false,
      index: 0,
      form: {}
    };
  },
  watch: {
    modelValue() {
      this.nodeConfig = this.modelValue;
    }
  },
  mounted() {
    this.nodeConfig = this.modelValue;
  },
  methods: {
    show(index) {
      this.index = index;
      this.form = {};
      this.form = JSON.parse(JSON.stringify(this.nodeConfig.conditionNodes[index]));
      this.drawer = true;
    },
    editTitle() {
      this.isEditTitle = true;
      this.$nextTick(() => {
        this.$refs.nodeTitle.focus();
      });
    },
    saveTitle() {
      this.isEditTitle = false;
    },
    save() {
      this.nodeConfig.conditionNodes[this.index] = this.form;
      this.$emit("update:modelValue", this.nodeConfig);
      this.drawer = false;
    },
    addTerm() {
      let len = this.nodeConfig.conditionNodes.length + 1;
      this.nodeConfig.conditionNodes.push({
        nodeName: "条件" + len,
        type: 3,
        priorityLevel: len,
        conditionMode: 1,
        conditionList: []
      });
    },
    delTerm(index) {
      this.nodeConfig.conditionNodes.splice(index, 1);
      if (this.nodeConfig.conditionNodes.length == 1) {
        if (this.nodeConfig.childNode) {
          if (this.nodeConfig.conditionNodes[0].childNode) {
            this.reData(this.nodeConfig.conditionNodes[0].childNode, this.nodeConfig.childNode);
          } else {
            this.nodeConfig.conditionNodes[0].childNode = this.nodeConfig.childNode;
          }
        }
        this.$emit("update:modelValue", this.nodeConfig.conditionNodes[0].childNode);
      }
    },
    reData(data, addData) {
      if (!data.childNode) {
        data.childNode = addData;
      } else {
        this.reData(data.childNode, addData);
      }
    },
    arrTransfer(index, type = 1) {
      this.nodeConfig.conditionNodes[index] = this.nodeConfig.conditionNodes.splice(index + type, 1, this.nodeConfig.conditionNodes[index])[0];
      this.nodeConfig.conditionNodes.map((item, index) => {
        item.priorityLevel = index + 1;
      });
      this.$emit("update:modelValue", this.nodeConfig);
    },
    addConditionList() {
      this.form.conditionList.push({
        label: "",
        field: "",
        operator: "=",
        value: ""
      });
    },
    deleteConditionList(index) {
      this.form.conditionList.splice(index, 1);
    },
    toText(nodeConfig, index) {
      var { conditionList } = nodeConfig.conditionNodes[index];
      if (conditionList && conditionList.length == 1) {
        const text = conditionList.map(item => `${item.label}${item.operator}${item.value}`).join(" 和 ");
        return text;
      } else if (conditionList && conditionList.length > 1) {
        const conditionModeText = nodeConfig.conditionNodes[index].conditionMode == 1 ? "且行" : "或行";
        return conditionList.length + "个条件，" + conditionModeText;
      } else {
        if (index == nodeConfig.conditionNodes.length - 1) {
          return "其他条件进入此流程";
        } else {
          return false;
        }
      }
    }
  }
};
</script>

<style></style>
