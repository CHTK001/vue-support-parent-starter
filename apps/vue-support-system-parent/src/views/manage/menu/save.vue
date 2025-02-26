<script>
import { fetchSaveMenu, fetchUpdateMenu } from "@/api/manage/menu";
import { fetchListRole } from "@/api/manage/role";
import { defineAsyncComponent, defineComponent } from "vue";

import ReAnimateSelector from "@repo/components/ReAnimateSelector/index.vue";
import ReCol from "@repo/components/ReCol";
import { IconSelect } from "@repo/components/ReIcon";
import Segmented from "@repo/components/ReSegmented";
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";
import ScElFormItem from "@repo/components/ScElFormItem/index.vue";
export default defineComponent({
  components: {
    Segmented,
    IconSelect,
    ReCol,
    ReAnimateSelector,
    ScElFormItem: defineAsyncComponent(() => import("@repo/components/ScElFormItem/index.vue")),
  },
  data() {
    return {
      dynamicTags: [],
      form: {},
      visible: false,
      loading: false,
      title: "",
      mode: "save",
      showParentOptions: [
        {
          label: "显示",
          tip: "会显示父级菜单",
          value: true,
        },
        {
          label: "隐藏",
          tip: "不会显示父级菜单",
          value: false,
        },
      ],
      hiddenTagOptions: [
        {
          label: "允许",
          tip: "当前菜单名称或自定义信息允许添加到标签页",
          value: false,
        },
        {
          label: "禁止",
          tip: "当前菜单名称或自定义信息禁止添加到标签页",
          value: true,
        },
      ],
      menuTypeOptions: [
        {
          label: "菜单",
          value: 0,
        },
        {
          label: "iframe",
          value: 1,
        },
        {
          label: "外链",
          value: 2,
        },
        {
          label: "按钮",
          value: 3,
        },
      ],
      keepAliveOptions: [
        {
          label: "缓存",
          tip: "会保存该页面的整体状态，刷新后会清空状态",
          value: true,
        },
        {
          label: "不缓存",
          tip: "不会保存该页面的整体状态",
          value: false,
        },
      ],
      fixedTagOptions: [
        {
          label: "固定",
          tip: "当前菜单名称固定显示在标签页且不可关闭",
          value: true,
        },
        {
          label: "不固定",
          tip: "当前菜单名称不固定显示在标签页且可关闭",
          value: false,
        },
      ],
      frameLoadingOptions: [
        {
          label: "开启",
          tip: "有首次加载动画",
          value: true,
        },
        {
          label: "关闭",
          tip: "无首次加载动画",
          value: false,
        },
      ],
      showLinkOptions: [
        {
          label: "显示",
          tip: "会在菜单中显示",
          value: true,
        },
        {
          label: "隐藏",
          tip: "不会在菜单中显示",
          value: false,
        },
      ],
      roleOptions: [],
      tableData: [],
      props: {
        value: "sysMenuId",
        label: "sysMenuTitle",
        emitPath: false,
        checkStrictly: true,
      },
      inputValue: "",
      inputVisible: false,
    };
  },
  computed: {
    rules() {
      if (this.form.sysMenuType == 0) {
        return {
          sysMenuTitle: [
            {
              required: true,
              message: transformI18n("rules.sysMenuTitle"),
              trigger: "blur",
            },
          ],
          sysMenuName: [
            {
              required: true,
              message: transformI18n("rules.sysMenuName"),
              trigger: "blur",
            },
          ],
          sysMenuPath: [
            {
              required: true,
              message: transformI18n("rules.sysMenuPath"),
              trigger: "blur",
            },
          ],
          sysMenuComponent: [
            {
              required: true,
              message: transformI18n("rules.sysMenuComponent"),
              trigger: "blur",
            },
          ],
          sysMenuPerm: [
            {
              required: true,
              message: transformI18n("rules.sysMenuPerm"),
              trigger: "blur",
            },
          ],
        };
      }
      if (this.form.sysMenuType == 1 || this.form.sysMenuType == 2) {
        return {
          sysMenuTitle: [
            {
              required: true,
              message: transformI18n("rules.sysMenuTitle"),
              trigger: "blur",
            },
          ],
          sysMenuName: [
            {
              required: true,
              message: transformI18n("rules.sysMenuName"),
              trigger: "blur",
            },
          ],
          sysMenuPath: [
            {
              required: true,
              message: transformI18n("rules.sysMenuPath"),
              trigger: "blur",
            },
          ],
          sysMenuPerm: [
            {
              required: true,
              message: transformI18n("rules.sysMenuPerm"),
              trigger: "blur",
            },
          ],
        };
      }
      return {
        sysMenuTitle: [
          {
            required: true,
            message: transformI18n("rules.sysMenuTitle"),
            trigger: "blur",
          },
        ],
        sysMenuPerm: [
          {
            required: true,
            message: transformI18n("rules.sysMenuPerm"),
            trigger: "blur",
          },
        ],
      };
    },
  },
  mounted() {
    this.initialRole();
  },
  methods: {
    async initialRole() {
      this.roleOptions.push({
        sysRoleId: 1,
        sysRoleCode: "SUPER_ADMIN",
        sysRoleName: "超级管理员",
      });
      fetchListRole({}).then((res) => {
        this.roleOptions.push(...res.data);
      });
    },
    async close() {
      this.visible = false;
      this.loading = false;
      this.tableData = [];
      this.$nextTick(() => {
        this.$refs?.dialogForm.resetFields();
      });
      this.reset();
    },
    reset() {
      this.dynamicTags.length = 0;
      this.form = {};
    },
    clickNode($event) {
      $event.target.parentElement.parentElement.firstElementChild.click();
    },
    setTableData(data) {
      Object.assign(this.tableData, data || []);
      return this;
    },
    setData(data) {
      this.form = data;
      this.dynamicTags = !this.form.sysMenuRole ? [] : this.form.sysMenuRole?.split(",");
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增" : "编辑";
      if (mode == "save") {
        this.form.sysMenuSort = 1;
      } else if (!this.form.sysMenuSort) {
        this.form.sysMenuSort = 0;
      }
    },
    transformI18nValue(value) {
      return transformI18n(value);
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          if (this.dynamicTags) {
            this.form.sysMenuRole = this.dynamicTags.join(",");
          }
          try {
            let res = {};
            if (this.mode === "save") {
              res = await fetchSaveMenu(this.form);
            } else if (this.mode === "edit") {
              res = await fetchUpdateMenu(this.form);
            }

            if (res.code == "00000") {
              this.$emit("success", this.mode, this.form);
              this.visible = false;
            } else {
              message(res.msg, { type: "error" });
            }
          } catch (error) {}
        }
        this.loading = false;
      });
    },
  },
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" top="10px" :close-on-click-modal="false" :close-on-press-escape="false" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row :gutter="30">
          <re-col>
            <el-form-item label="菜单类型">
              <el-segmented v-model="form.sysMenuType" :options="menuTypeOptions" />
            </el-form-item>
          </re-col>

          <re-col>
            <el-form-item label="上级菜单">
              <el-cascader v-model="form.sysMenuPid" class="w-full" :options="tableData" :props="props" clearable filterable placeholder="请选择上级菜单">
                <template #default="{ node, data }">
                  <div @click="clickNode">
                    <span v-if="data.sysMenuI18n">
                      {{ transformI18nValue(data.sysMenuI18n) }}
                    </span>
                    <span v-else>{{ data.sysMenuTitle }}</span>
                    <span v-if="!node.isLeaf">({{ data.children.length }})</span>
                  </div>
                </template>
              </el-cascader>
            </el-form-item>
          </re-col>

          <re-col :value="12" :xs="24" :sm="24">
            <el-form-item label="菜单名称" prop="sysMenuTitle">
              <el-input v-model="form.sysMenuTitle" clearable placeholder="请输入菜单名称" :maxlength="40" show-word-limit />
            </el-form-item>
          </re-col>
          <re-col v-if="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <el-form-item label="菜单名称i18n" prop="sysMenuI18n">
              <el-input v-model="form.sysMenuI18n" clearable placeholder="请输入菜单名称i18n" :maxlength="50" show-word-limit />
            </el-form-item>
          </re-col>
          <re-col v-if="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <el-form-item label="路由名称" prop="sysMenuName">
              <el-input v-model="form.sysMenuName" clearable placeholder="请输入路由名称" :maxlength="40" show-word-limit />
            </el-form-item>
          </re-col>

          <re-col v-if="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <el-form-item label="路由路径" prop="sysMenuPath">
              <el-input v-model="form.sysMenuPath" clearable placeholder="请输入路由路径" :maxlength="200" show-word-limit />
            </el-form-item>
          </re-col>
          <re-col v-show="form.sysMenuType === 0" :value="12" :xs="24" :sm="24">
            <el-form-item label="组件路径" prop="sysMenuComponent">
              <el-input v-model="form.sysMenuComponent" clearable placeholder="请输入组件路径" :maxlength="200" show-word-limit />
            </el-form-item>
          </re-col>

          <re-col :value="12" :xs="24" :sm="24">
            <el-form-item label="菜单排序">
              <el-input-number v-model="form.sysMenuSort" class="!w-full" :min="1" :max="9999" controls-position="right" />
            </el-form-item>
          </re-col>
          <re-col v-show="form.sysMenuType === 0" :value="12" :xs="24" :sm="24">
            <el-form-item label="路由重定向">
              <el-input v-model="form.sysMenuRedirect" clearable placeholder="请输入默认跳转地址" :maxlength="200" show-word-limit />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <el-form-item label="菜单图标">
              <IconSelect v-model="form.sysMenuIcon" class="w-full" />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <el-form-item label="右侧图标">
              <el-input v-model="form.sysMenuRedirect" clearable placeholder="菜单名称右侧的额外图标" :maxlength="200" show-word-limit />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <el-form-item label="进场动画">
              <ReAnimateSelector v-model="form.sysMenuEnterTransition" placeholder="请选择页面进场加载动画" />
            </el-form-item>
          </re-col>
          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <el-form-item label="离场动画">
              <ReAnimateSelector v-model="form.sysMenuLeaveTransition" placeholder="请选择页面离场加载动画" />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType === 0" :value="12" :xs="24" :sm="24">
            <el-form-item label="菜单激活">
              <el-input v-model="form.sysMenuActivePath" clearable placeholder="请输入需要激活的菜单" :maxlength="200" show-word-limit />
            </el-form-item>
          </re-col>
          <re-col v-if="form.sysMenuType === 3" :value="12" :xs="24" :sm="24">
            <!-- 按钮级别权限设置 -->
            <el-form-item label="权限标识" prop="sysMenuPerm">
              <el-input v-model="form.sysMenuPerm" clearable placeholder="请输入权限标识" :maxlength="240" show-word-limit />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType === 1" :value="12" :xs="24" :sm="24">
            <!-- iframe -->
            <el-form-item label="链接地址">
              <el-input v-model="form.sysMenuFrameSrc" clearable placeholder="请输入 iframe 链接地址" :maxlength="240" show-word-limit />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <el-form-item label="菜单">
              <Segmented
                :modelValue="form.sysMenuHidden ? 1 : 0"
                :options="showLinkOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuHidden = value ? 0 : 1;
                  }
                "
              />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <el-form-item label="父级菜单">
              <Segmented
                :modelValue="form.sysMenuShowParent ? 0 : 1"
                :options="showParentOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuShowParent = value ? 1 : 0;
                  }
                "
              />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <el-form-item label="缓存页面">
              <Segmented
                :modelValue="form.sysMenuKeepAlive ? 0 : 1"
                :options="keepAliveOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuKeepAlive = value ? 1 : 0;
                  }
                "
              />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <el-form-item label="标签页">
              <Segmented
                :modelValue="form.sysMenuHiddenTag ? 1 : 0"
                :options="hiddenTagOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuHiddenTag = value ? 1 : 0;
                  }
                "
              />
            </el-form-item>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <el-form-item label="固定标签页">
              <Segmented
                :modelValue="form.sysMenuFixedTag ? 0 : 1"
                :options="fixedTagOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuFixedTag = value ? 1 : 0;
                  }
                "
              />
            </el-form-item>
          </re-col>

          <re-col :value="12" :xs="24" :sm="24">
            <ScElFormItem label="所属角色" tips="当选择角色后, 该菜单只针对当前角色可见">
              <el-select v-model="dynamicTags" multiple>
                <el-option v-for="item in roleOptions" :key="item.sysRoleId" :value="item.sysRoleCode" :label="item.sysRoleName" />
              </el-select>
            </ScElFormItem>
          </re-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style lang="scss">
.el-cascader-panel .el-radio {
  width: 100%;
  height: 100%;
  z-index: 10;
  position: absolute;
  top: 10px;
  right: 10px;
}

.el-cascader-panel .el-radio__input {
  visibility: hidden;
}

.el-cascader-panel .el-cascader-node__postfix {
  top: 10px;
}
</style>
