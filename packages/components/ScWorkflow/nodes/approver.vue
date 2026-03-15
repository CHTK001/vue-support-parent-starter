<template>
  <div class="node-wrap">
    <div class="node-wrap-box" @click="show">
      <div class="title" style="background: #ff943e">
        <ScIcon class="icon"><el-icon-user-filled /></ScIcon>
        <span>{{ nodeConfig.nodeName }}</span>
        <ScIcon class="close" @click.stop="delNode()"><el-icon-close /></ScIcon>
      </div>
      <div class="content">
        <span v-if="toText(nodeConfig)">{{ toText(nodeConfig) }}</span>
        <span v-else class="placeholder">请选择</span>
      </div>
    </div>
    <add-node v-model="nodeConfig.childNode" />
    <sc-drawer v-model="drawer" title="审批人设置" destroy-on-close append-to-body :size="500">
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
            <ScFormItem label="审批人员类型">
              <ScSelect v-model="form.setType">
                <ScOption :value="1" label="指定成员" />
                <ScOption :value="2" label="主管" />
                <ScOption :value="3" label="角色" />
                <ScOption :value="4" label="发起人自选" />
                <ScOption :value="5" label="发起人自己" />
                <ScOption :value="7" label="连续多级主管" />
              </ScSelect>
            </ScFormItem>

            <ScFormItem v-if="form.setType == 1" label="选择成员">
              <ScButton type="primary" icon="el-icon-plus" round @click="selectHandle(1, form.nodeUserList)">选择人员</ScButton>
              <div class="tags-list">
                <ScTag v-for="(user, index) in form.nodeUserList" :key="user.id" closable @close="delUser(index)">{{ user.name }}</ScTag>
              </div>
            </ScFormItem>

            <ScFormItem v-if="form.setType == 2" label="指定主管">
              发起人的第
              <ScInputNumber v-model="form.examineLevel" :min="1" />
              级主管
            </ScFormItem>

            <ScFormItem v-if="form.setType == 3" label="选择角色">
              <ScButton type="primary" icon="el-icon-plus" round @click="selectHandle(2, form.nodeRoleList)">选择角色</ScButton>
              <div class="tags-list">
                <ScTag v-for="(role, index) in form.nodeRoleList" :key="role.id" type="info" closable @close="delRole(index)">{{ role.name }}</ScTag>
              </div>
            </ScFormItem>

            <ScFormItem v-if="form.setType == 4" label="发起人自选">
              <ScRadioGroup v-model="form.selectMode">
                <ScRadio :label="1">自选一个人</ScRadio>
                <ScRadio :label="2">自选多个人</ScRadio>
              </ScRadioGroup>
            </ScFormItem>

            <ScFormItem v-if="form.setType == 7" label="连续主管审批终点">
              <ScRadioGroup v-model="form.directorMode">
                <ScRadio :label="0">直到最上层主管</ScRadio>
                <ScRadio :label="1">自定义审批终点</ScRadio>
              </ScRadioGroup>
              <p v-if="form.directorMode == 1">
                直到发起人的第
                <ScInputNumber v-model="form.directorLevel" :min="1" />
                级主管
              </p>
            </ScFormItem>

            <ScDivider />
            <ScFormItem label="">
              <ScCheckbox v-model="form.termAuto" label="超时自动审批" />
            </ScFormItem>
            <template v-if="form.termAuto">
              <ScFormItem label="审批期限（为 0 则不生效）">
                <ScInputNumber v-model="form.term" :min="0" />
                小时
              </ScFormItem>
              <ScFormItem label="审批期限超时后执行">
                <ScRadioGroup v-model="form.termMode">
                  <ScRadio :label="0">自动通过</ScRadio>
                  <ScRadio :label="1">自动拒绝</ScRadio>
                </ScRadioGroup>
              </ScFormItem>
            </template>
            <ScDivider />
            <ScFormItem label="多人审批时审批方式">
              <ScRadioGroup v-model="form.examineMode">
                <p style="width: 100%"><ScRadio :label="1">按顺序依次审批</ScRadio></p>
                <p style="width: 100%"><ScRadio :label="2">会签 (可同时审批，每个人必须审批通过)</ScRadio></p>
                <p style="width: 100%"><ScRadio :label="3">或签 (有一人审批通过即可)</ScRadio></p>
              </ScRadioGroup>
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
    delRole(index) {
      this.form.nodeRoleList.splice(index, 1);
    },
    selectHandle(type, data) {
      this.select(type, data);
    },
    toText(nodeConfig) {
      if (nodeConfig.setType == 1) {
        if (nodeConfig.nodeUserList && nodeConfig.nodeUserList.length > 0) {
          const users = nodeConfig.nodeUserList.map(item => item.name).join("、");
          return users;
        } else {
          return false;
        }
      } else if (nodeConfig.setType == 2) {
        return nodeConfig.examineLevel == 1 ? "直接主管" : `发起人的第${nodeConfig.examineLevel}级主管`;
      } else if (nodeConfig.setType == 3) {
        if (nodeConfig.nodeRoleList && nodeConfig.nodeRoleList.length > 0) {
          const roles = nodeConfig.nodeRoleList.map(item => item.name).join("、");
          return "角色-" + roles;
        } else {
          return false;
        }
      } else if (nodeConfig.setType == 4) {
        return "发起人自选";
      } else if (nodeConfig.setType == 5) {
        return "发起人自己";
      } else if (nodeConfig.setType == 7) {
        return "连续多级主管";
      }
    }
  }
};
</script>

<style></style>
