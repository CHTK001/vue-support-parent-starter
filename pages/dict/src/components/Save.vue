<template>
  <div class="dict-save-container">
    <el-dialog v-model="visible" :title="title" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable class="dict-dialog" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px" class="dict-form">
        <el-row :gutter="20">
          <!-- 字典父节点选择 -->
          <el-col :span="24">
            <el-form-item label="字典父节点" prop="sysDictPid">
              <el-tree-select v-model="form.sysDictPid" :props="defaultProps" check-strictly class="dict-tree-select" :data="treeData">
                <template #label="scope">
                  <span v-if="!scope?.label">
                    <span v-if="scope.value == '0'" class="dict-root-node">根节点</span>
                    <del v-else class="dict-deleted-node">已删除</del>
                  </span>
                  <span v-else class="dict-node-label">{{ scope?.label }}</span>
                </template>
              </el-tree-select>
              <div class="form-item-help">选择字典的父级节点，不选择则为顶级节点</div>
            </el-form-item>
          </el-col>

          <!-- 字典基本信息 -->
          <el-col :span="24">
            <div class="form-section">
              <div class="section-title">基本信息</div>

              <el-form-item label="字典名称" prop="sysDictName">
                <el-input v-model="form.sysDictName" placeholder="请输入字典名称" class="dict-input">
                  <template #prefix>
                    <el-icon>
                      <IconifyIconOnline icon="ep:document" />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="字典编码" prop="sysDictCode">
                <el-input v-model="form.sysDictCode" placeholder="请输入字典编码" class="dict-input">
                  <template #prefix>
                    <el-icon>
                      <IconifyIconOnline icon="ep:key" />
                    </el-icon>
                  </template>
                </el-input>
                <div class="form-item-help">系统将根据字典名称自动生成拼音编码</div>
              </el-form-item>

              <el-form-item label="字典i18n" prop="sysDictI18n">
                <el-input v-model="form.sysDictI18n" placeholder="请输入字典i18n" class="dict-input">
                  <template #prefix>
                    <IconifyIconOnline icon="fa-solid:language" />
                  </template>
                </el-input>
                <div class="form-item-help">国际化标识，用于多语言支持</div>
              </el-form-item>
            </div>
          </el-col>

          <!-- 字典高级设置 -->
          <el-col :span="24">
            <div class="form-section">
              <div class="section-title">高级设置</div>

              <el-form-item label="系统变量" prop="sysDictInSystem">
                <ReSegmented v-model="form.sysDictInSystem" :options="options" class="dict-segmented" />
                <div class="form-item-help">设置为系统变量后将无法删除</div>
              </el-form-item>

              <el-form-item label="描述" prop="sysDictRemark">
                <el-input v-model="form.sysDictRemark" placeholder="请输入描述" type="textarea" :rows="3" class="dict-textarea" />
              </el-form-item>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false" class="cancel-btn"> 取消 </el-button>
          <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()" class="save-btn"> 保存 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import ReSegmented from "@repo/components/ReSegmented";
import { fetchSaveDict, fetchUpdateDict } from "@repo/core";
import { message } from "@repo/utils";
import { pinyin } from "pinyin-pro";
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  components: {
    ReSegmented,
  },
  data() {
    return {
      // 表单数据
      form: {
        sysDictId: "",
        sysDictCode: "",
        sysDictInSystem: 0,
        sysDictPid: 0,
        sysDictName: "",
        sysDictI18n: "",
        sysDictRemark: "",
      },
      // 树选择器配置
      defaultProps: {
        value: "sysDictId",
        label: "sysDictName",
        children: "children",
      },
      visible: false,
      // 表单验证规则
      rules: {
        sysDictName: [
          { required: true, message: "请输入字典名称", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
        sysDictCode: [
          { required: true, message: "请输入字典编码", trigger: "blur" },
          { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
        ],
      },
      // 系统变量选项
      options: [
        { label: "是", value: 1 },
        { label: "否", value: 0 },
      ],
      loading: false,
      title: "",
      mode: "save",
      treeData: [],
      t: null,
    };
  },
  watch: {
    // 监听字典名称变化，自动生成拼音编码
    "form.sysDictName": {
      immediate: true,
      deep: true,
      handler(val) {
        this.form.sysDictName = val;
        if (!val && !!this.form.sysDictCode) {
          return;
        }
        const py = pinyin(val, { toneType: "none", type: "array" }) || [];
        this.form.sysDictCode = py.map((it) => String(it).toUpperCase()).join("_");
      },
    },
  },
  mounted() {
    const { t } = useI18n();
    this.t = t;
  },
  methods: {
    // 国际化方法
    useI18n(v) {
      return this.t(v);
    },
    // 关闭弹窗
    async close() {
      this.visible = false;
      this.loading = false;
      this.form = {};
    },
    // 设置表单数据
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    // 设置树形数据
    setTableData(data) {
      Object.assign(this.treeData, data);
      return this;
    },
    // 打开弹窗
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增字典" : "编辑字典";
    },
    // 渲染树节点内容
    renderContent(h, { node, data }) {
      return node.data?.sysDictName || "-";
    },
    // 提交表单
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};

          try {
            // 根据模式选择保存或更新操作
            if (this.mode === "save") {
              res = await fetchSaveDict(this.form);
            } else if (this.mode === "edit") {
              res = await fetchUpdateDict(this.form);
            }

            if (res.code == "00000") {
              message(this.mode === "save" ? "添加成功" : "更新成功", { type: "success" });
              this.$emit("success");
              this.visible = false;
            } else {
              message(res.msg, { type: "error" });
            }
          } catch (error) {
            message("操作失败", { type: "error" });
          } finally {
            this.loading = false;
          }
        }
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.dict-save-container {
  .dict-dialog {
    :deep(.el-dialog) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 32px 4px rgba(0, 0, 0, 0.1);

      .el-dialog__header {
        padding: 20px;
        margin: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
        background: var(--el-bg-color-overlay);
      }

      .el-dialog__body {
        padding: 24px;
        background: var(--el-bg-color-page);
      }

      .el-dialog__footer {
        padding: 16px 20px;
        border-top: 1px solid var(--el-border-color-lighter);
        background: var(--el-bg-color-overlay);
      }
    }
  }

  .dict-form {
    .form-section {
      margin-bottom: 24px;
      padding: 16px;
      background: var(--el-bg-color-overlay);
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }
    }

    .section-title {
      margin-bottom: 16px;
      padding-bottom: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .form-item-help {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .dict-tree-select {
    width: 100%;

    :deep(.el-select-dropdown__item) {
      padding: 8px 12px;
    }

    .dict-root-node {
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .dict-deleted-node {
      color: var(--el-color-danger);
    }

    .dict-node-label {
      font-weight: 500;
    }
  }

  .dict-input {
    :deep(.el-input__wrapper) {
      padding-left: 8px;

      .el-input__prefix {
        margin-right: 8px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .dict-textarea {
    :deep(.el-textarea__inner) {
      border-radius: 4px;
    }
  }

  .dict-segmented {
    width: 100%;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .el-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 20px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .dict-save-container {
    .form-section {
      background: var(--el-bg-color-overlay);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
