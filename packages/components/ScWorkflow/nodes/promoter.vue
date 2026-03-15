<template>
  <div class="node-wrap">
    <div class="node-wrap-box start-node" @click="show">
      <div class="title" style="background: #576a95">
        <ScIcon class="icon"><el-icon-user-filled /></ScIcon>
        <span>{{ nodeConfig.nodeName }}</span>
      </div>
      <div class="content">
        <span>{{ toText(nodeConfig) }}</span>
      </div>
    </div>
    <add-node v-model="nodeConfig.childNode" />
    <sc-drawer v-model="drawer" title="发起人" destroy-on-close append-to-body :size="500">
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
            <ScFormItem label="谁可以发起此审批">
              <ScButton type="primary" icon="el-icon-plus" round @click="selectHandle(2, form.nodeRoleList)">选择角色</ScButton>
              <div class="tags-list">
                <ScTag v-for="(role, index) in form.nodeRoleList" :key="role.id" type="info" closable @close="delRole(index)">{{ role.name }}</ScTag>
              </div>
            </ScFormItem>
            <ScAlert v-if="form.nodeRoleList.length == 0" title="不指定则默认所有人都可发起此审批" type="info" :closable="false" />
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
  inject: ["select"],
  props: {
    modelValue: { type: Object, default: () => {} }
  },
  data() {
    return {
      nodeConfig: {},
      drawer: false,
      isEditTitle: false,
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
    show() {
      this.form = {};
      this.form = JSON.parse(JSON.stringify(this.nodeConfig));
      this.isEditTitle = false;
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
    selectHandle(type, data) {
      this.select(type, data);
    },
    delRole(index) {
      this.form.nodeRoleList.splice(index, 1);
    },
    save() {
      this.$emit("update:modelValue", this.form);
      this.drawer = false;
    },
    toText(nodeConfig) {
      if (nodeConfig.nodeRoleList && nodeConfig.nodeRoleList.length > 0) {
        return nodeConfig.nodeRoleList.map(item => item.name).join("、");
      } else {
        return "所有人";
      }
    }
  }
};
</script>

<style></style>
