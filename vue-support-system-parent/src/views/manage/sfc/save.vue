<script>
import { defineComponent, toRaw } from "vue";
import { fetchListDictItem } from "@/api/manage/dict";
import { fetchSaveSfc, fetchUpdateSfc } from "@/api/manage/sfc";

import { message } from "@/utils/message";
import { useI18n } from "vue-i18n";
import { debounce, throttle } from "@pureadmin/utils";
import { clearObject } from "@/utils/objects";
import { IconSelect } from "@/components/ReIcon";

export default defineComponent({
  components: { IconSelect },
  props: {
    sysSecretFunctions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      form: {},
      visible: false,
      rules: {},
      loading: false,
      title: "",
      mode: "save",
      dictItem: [],
      sysSfCategoryCollection: [
        {
          label: "主页",
          value: "HOME"
        }
      ],
      t: null
    };
  },
  mounted() {
    const { t } = useI18n();
    this.initialize();
    this.t = t;
  },
  methods: {
    async initialize() {
      fetchListDictItem({
        sysDictId: 5
      }).then(res => {
        this.dictItem = res?.data;
      });
    },
    async close() {
      this.visible = false;
      this.loading = false;
      clearObject(this.form);
    },
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      if (mode === "save") {
        this.rules = {
          sysSfcName: [{ required: true, message: "请输入组件名称", trigger: "blur" }],
          sysSfcFunction: [{ required: true, message: "请输入组件功能", trigger: "blur" }],
          sysSfCategory: [{ required: true, message: "请选择支持同步功能", trigger: "blur" }],
          sysSfcIcon: [{ required: true, message: "请选择组件图标", trigger: "blur" }]
        };
      }
      this.title = mode == "save" ? this.t("message.save") : this.t("message.edit");
    },
    debounce(fn, time, immediate) {
      return debounce(fn, time, immediate);
    },
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};
          Object.assign(newForm, this.form);
          if (this.mode === "save") {
            res = await fetchSaveSfc(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateSfc(newForm);
          }

          if (res && res.code == "00000") {
            this.$emit("success", newForm);
            this.$emit("close");
            this.visible = false;
          } else {
            message(res?.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    }
  }
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="组件名称" prop="sysSfcName">
              <el-input v-model="form.sysSfcName" placeholder="请输入组件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组件功能" prop="sysSfcFunction">
              <el-select v-model="form.sysSfcFunction" placeholder="请选择组件功能" filterable multiple>
                <el-option v-for="item in dictItem" :key="item.sysDictItemName" :label="item.sysDictItemName" :value="item.sysDictItemName" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组件图标" prop="sysSfcIcon">
              <IconSelect v-model="form.sysSfcIcon" class="w-full" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="分类" prop="sysSfCategory">
              <el-select v-model="form.sysSfCategory" placeholder="请选择支持同步功能" filterable multiple>
                <el-option v-for="item in sysSfCategoryCollection" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="组件描述" prop="sysSfcDesc">
              <el-input v-model="form.sysSfcDesc" placeholder="请输入组件描述" type="textarea" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="debounce(submit(), 1000, true)">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
