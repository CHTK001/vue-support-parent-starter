<template>
  <div class="node-wrap">
    <div class="node-wrap-box" @click="show">
      <div class="title" style="background: #3296fa">
        <ScIcon class="icon"><el-icon-promotion /></ScIcon>
        <span>{{ nodeConfig.nodeName }}</span>
        <ScIcon class="close" @click.stop="delNode()"><el-icon-close /></ScIcon>
      </div>
      <div class="content">
        <span v-if="toText(nodeConfig)">{{ toText(nodeConfig) }}</span>
        <span v-else class="placeholder">请选择人员</span>
      </div>
    </div>
    <add-node v-model="nodeConfig.childNode" />
    <sc-drawer v-model="drawer" title="抄送人设置" destroy-on-close append-to-body :size="500">
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
            <ScFormItem label="选择要抄送的人员">
              <ScButton type="primary" icon="el-icon-plus" round @click="selectHandle(1, form.nodeUserList)">选择人员</ScButton>
              <div class="tags-list">
                <ScTag v-for="(user, index) in form.nodeUserList" :key="user.id" closable @close="delUser(index)">{{ user.name }}</ScTag>
              </div>
            </ScFormItem>
            <ScFormItem label="">
              <ScCheckbox v-model="form.userSelectFlag" label="允许发起人自选抄送人" />
            </ScFormItem>
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
      this.$emit("update:modelValue", this.form);
      this.drawer = false;
    },
    delNode() {
      this.$emit("update:modelValue", this.nodeConfig.childNode);
    },
    delUser(index) {
      this.form.nodeUserList.splice(index, 1);
    },
    selectHandle(type, data) {
      this.select(type, data);
    },
    toText(nodeConfig) {
      if (nodeConfig.nodeUserList && nodeConfig.nodeUserList.length > 0) {
        const users = nodeConfig.nodeUserList.map(item => item.name).join("、");
        return users;
      } else {
        if (nodeConfig.userSelectFlag) {
          return "发起人自选";
        } else {
          return false;
        }
      }
    }
  }
};
</script>

<style></style>
