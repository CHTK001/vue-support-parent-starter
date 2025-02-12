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
      default: () => { },
    },
    categoryProp: {
      type: Object,
      default: () => { },
    },
  },
  data() {
    return {
      showAdvice: false,
      dictItem1: [],
      dictItem2: [],
      dictItem3: [],
      deviceResourceTypes: [],
      form: {},
      visible: false,
      rules: {
        sysDeviceName: [
          { required: true, message: "请输入设备名称名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysDeviceSerialNumber: [
          { required: true, message: "请输入设备序列号", trigger: "blur" },
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
      fetchListDictItem({
        sysDictId: 7,
      }).then((res) => {
        this.deviceResourceTypes = res?.data;
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
      if (this.form.sysDeviceChannels) {
        this.form.sysDeviceChannelsTemp = this.form.sysDeviceChannels.split(",");
      }
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
      if (mode == "save") {
        this.form.sysDeviceMainSubtype = 0;
        this.form.sysDeviceSubSubtype = 1;
      }
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};
          if (this.form.sysDeviceChannelsTemp) {
            this.form.sysDeviceChannels = this.form.sysDeviceChannelsTemp.join(",");
            this.form.sysDeviceChannelCount = this.form.sysDeviceChannelsTemp.length;
          }
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
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true"
      draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="名称" prop="sysDeviceName">
              <el-input v-model="form.sysDeviceName" placeholder="请输入摄像头名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="序列号" prop="sysDeviceSerialNumber">
              <el-input v-model="form.sysDeviceSerialNumber" placeholder="请输入序列号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备类型" prop="sysDeviceResourceType">
              <el-select v-model="form.sysDeviceResourceType" placeholder="请选择设备类型" clearable>
                <el-option v-for="item in deviceResourceTypes" :key="item.sysDictItemCode" :label="item.sysDictItemName"
                  :value="item.sysDictItemCode">
                  <span>{{ item.sysDictItemName }}</span>
                  <span class="el-form-item-msg pl-2">{{ item.sysDictItemCode }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="状态" prop="sysDeviceOnline">
              <el-segmented v-model="form.sysDeviceOnline" :options="[
                {
                  label: '在线',
                  value: 1,
                },
                {
                  label: '离线',
                  value: 0,
                },
              ]" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="sysDeviceDescription">
              <el-input v-model="form.sysDeviceDescription" placeholder="请输入描述" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="高级配置" prop="showAdvice">
              <el-segmented v-model="showAdvice" :options="[
                {
                  label: '开启',
                  value: true,
                },
                {
                  label: '关闭',
                  value: false,
                },
              ]" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="showAdvice">
          <el-col :span="24">
            <el-form-item label="设备账号" prop="sysDeviceAccount">
              <el-input v-model="form.sysDeviceAccount" placeholder="请输入设备账号"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备密码" prop="sysDevicePassword">
              <el-input v-model="form.sysDevicePassword" placeholder="推流设备密码" show-password type="password"> </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="网络地址" prop="sysDeviceNetAddress">
              <el-input v-model="form.sysDeviceNetAddress" placeholder="网络地址" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="管道" prop="sysDeviceChannels">
              <el-select :allow-create="true" :filterable="true" multiple v-model="form.sysDeviceChannelsTemp">
                <el-option v-for="item in form.sysDeviceChannelsTemp" :key="item" :label="item" :value="item">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="推流地址" prop="sysDeviceRtsp">
              <el-input v-model="form.sysDeviceRtsp" placeholder="请输入推流地址" type="textarea" :rows="5"> </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="主码流编码" prop="sysDeviceMainSubtype">
              <el-input v-model="form.sysDeviceMainSubtype" placeholder="请输入主码流编码"> </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="子码流编码" prop="sysDeviceSubSubtype">
              <el-input v-model="form.sysDeviceSubSubtype" placeholder="请输入子码流编码"> </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="webtrc地址" prop="sysDeviceRtspWebrtc">
              <el-input v-model="form.sysDeviceRtspWebrtc" placeholder="请输入webrtc地址"> </el-input>
              <span class="el-form-item-msg">用于解析rtsp</span>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="位置" prop="sysDevicePosition">
              <el-input v-model="form.sysDevicePosition" placeholder="位置" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="版本号" prop="sysDeviceVersion">
              <el-input v-model="form.sysDeviceVersion" placeholder="请输入版本号" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="所属编码" prop="sysDeviceOwner">
              <el-input v-model="form.sysDeviceOwner" placeholder="请输入所属者唯一编码" />
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
