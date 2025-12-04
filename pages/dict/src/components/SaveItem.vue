<script>
import {
  fetchListDictItem,
  fetchSaveDictItem,
  fetchUpdateDictItem,
} from "@repo/core";
import { message } from "@repo/utils";
import { pinyin } from "pinyin-pro";
import { defineAsyncComponent, defineComponent } from "vue";
import { IconSelect } from "@repo/components/ReIcon";
export default defineComponent({
  components: {
    IconSelect,
  },
  data() {
    return {
      form: {
        sysDictItemId: "",
        sysDictItemCode: "",
        sysDictItemName: "",
        sysDictItemI18n: "",
        sysDictItemSort: 1,
        sysDictId: null,
        sysDictItemIcon: null,
        sysDictItemRemark: "",
      },
      visible: false,
      rules: {
        sysDictItemName: [
          { required: true, message: "请输入字典项名称", trigger: "blur" },
          {
            min: 2,
            max: 20,
            message: "长度在 2 到 20 个字符",
            trigger: "blur",
          },
        ],
        sysDictItemCode: [
          { required: true, message: "请输入字典项编码", trigger: "blur" },
          {
            min: 2,
            max: 20,
            message: "长度在 2 到 20 个字符",
            trigger: "blur",
          },
        ],
      },
      loading: false,
      title: "",
      mode: "save",
      treeData: [],
    };
  },
  watch: {
    "form.sysDictItemName": {
      immediate: true,
      deep: true,
      handler(val) {
        this.form.sysDictItemName = val;
        if (this.form.sysDictItemCode) {
          return;
        }
        const py = pinyin(val, { toneType: "none", type: "array" }) || [];
        this.form.sysDictItemCode = py
          .map((it) => String(it).toUpperCase())
          .join("_");
      },
    },
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.sysDictId = data?.sysDictId;
      return this;
    },
    setTableData(data) {
      Object.assign(this.treeData, data);
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增字典项" : "编辑字典项";
    },
    renderContent(h, { node, data }) {
      return node.data?.sysDictName;
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          if (this.mode === "save") {
            res = await fetchSaveDictItem(this.form);
          } else if (this.mode === "edit") {
            res = await fetchUpdateDictItem(this.form);
          }

          if (res.code == "00000") {
            this.$emit("success");
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
  <div class="dict-item-save">
    <el-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      :title="title"
      top="10px"
      class="dict-item-dialog"
      @close="close"
    >
      <div class="dialog-content">
        <el-form
          ref="dialogForm"
          :model="form"
          :rules="rules"
          :disabled="mode == 'show'"
          label-position="top"
        >
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:information-line" />
              基本信息
            </div>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="字典项名称" prop="sysDictItemName">
                  <el-input
                    v-model="form.sysDictItemName"
                    placeholder="输入名称"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:bookmark-line" />
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="字典项编码" prop="sysDictItemCode">
                  <el-input
                    v-model="form.sysDictItemCode"
                    placeholder="输入编码"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:code-line" />
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 图标与排序 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:palette-line" />
              外观设置
            </div>
            <el-row :gutter="16">
              <el-col :span="16">
                <el-form-item label="字典项图标" prop="sysDictItemIcon">
                  <IconSelect v-model="form.sysDictItemIcon" class="w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="优先级" prop="sysDictItemSort">
                  <el-input-number
                    v-model="form.sysDictItemSort"
                    :min="1"
                    :max="999"
                    class="w-full"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 高级设置 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:settings-3-line" />
              高级设置
            </div>
            <el-form-item label="国际化标识 (i18n)" prop="sysDictItemI18n">
              <el-input
                v-model="form.sysDictItemI18n"
                placeholder="输入i18n标识"
                clearable
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:translate-2" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="备注描述" prop="sysDictItemRemark">
              <el-input
                v-model="form.sysDictItemRemark"
                type="textarea"
                :rows="3"
                placeholder="输入备注描述..."
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button
            v-if="mode != 'show'"
            type="primary"
            :loading="loading"
            @click="submit()"
          >
            <IconifyIconOnline
              :icon="mode === 'save' ? 'ri:add-line' : 'ri:save-line'"
              class="mr-1"
            />
            {{ mode === "save" ? "创建" : "保存" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.dialog-content {
  padding: 20px 24px;
}

.form-section {
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-form-item) {
  margin-bottom: 16px;

  .el-form-item__label {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 8px;
}

:deep(.el-input-number) {
  .el-input__wrapper {
    border-radius: 8px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
