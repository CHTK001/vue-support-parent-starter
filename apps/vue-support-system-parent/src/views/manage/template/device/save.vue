<script>
import { fetchSaveProjectForDevice, fetchUpdateProjectForDevice } from "@/api/manage/project-device";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    category: {
      type: Array,
      default: () => [],
    },
    categoryKinds: {
      type: Array,
      default: () => [],
    },
    renderContent: {
      type: Function,
      default: () => {},
    },
    categoryProp: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      dictItem1: [],
      dictItem2: [],
      dictItem3: [],
      form: {},
      visible: false,
      rules: {
        sysDeviceName: [
          { required: true, message: "请输入设备名称名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysDeviceDescription: [
          { required: true, message: "请输入设备描述", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
      },

      loading: false,
      title: "",
      mode: "save",
      treeData: [],
    };
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      fetchListDictItem({
        sysDictId: 1,
      }).then((res) => {
        this.dictItem1 = res?.data;
      });
      this.dictItem2 = this.category;
      this.dictItem3 = this.categoryKinds;
    },
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.sysDictId = data?.sysDictId;
      console.log("data", data);
      return this;
    },
    setTableData(data) {
      Object.assign(this.treeData, data);
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增" : "编辑";
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};
          Object.assign(newForm, this.form);
          if (this.mode === "save") {
            res = await fetchSaveProjectForDevice(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateProjectForDevice(newForm);
          }

          if (res.code == "00000") {
            this.$emit("success", newForm);
            this.visible = false;
          } else {
            message(res.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    },
  },
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="名称" prop="sysDeviceName">
              <el-input v-model="form.sysDeviceName" placeholder="请输入摄像头名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="位置" prop="sysDevicePosition">
              <el-input v-model="form.sysDevicePosition" placeholder="位置" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态" prop="sysDeviceStatus">
              <el-segmented
                v-model="form.sysDeviceStatus"
                :options="[
                  {
                    label: '在线',
                    value: 1,
                  },
                  {
                    label: '离线',
                    value: 0,
                  },
                ]"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="所属编码" prop="sysDeviceOwner">
              <el-input v-model="form.sysDeviceOwner" placeholder="请输入所属者唯一编码" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="版本号" prop="sysDeviceVersion">
              <el-input v-model="form.sysDeviceVersion" placeholder="请输入版本号" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="sysDeviceDescription">
              <el-input v-model="form.sysDeviceDescription" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
