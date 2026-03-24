<script setup lang="ts">
import { fetchSaveMenu, fetchUpdateMenu } from "@/api/manage/menu";
import { fetchListRole } from "@/api/manage/role";

import ReAnimateSelector from "@repo/components/ReAnimateSelector/index.vue";
import ReCol from "@repo/components/ReCol";
import Segmented from "@repo/components/ReSegmented";
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";

const QuestionFilled = defineComponent({
  render() {
    return h("i", { class: "ep:question-filled" });
  },
});

// Emits
const emit = defineEmits<{
  (e: "success", mode: string, form: any): void;
}>();

// Refs
const dialogFormRef = ref();

// Reactive state
const dynamicTags = ref<string[]>([]);
const form = ref<any>({});
const visible = ref(false);
const loading = ref(false);
const title = ref("");
const mode = ref("save");
const roleOptions = ref<any[]>([]);
const tableData = ref<any[]>([]);
const inputValue = ref("");
const inputVisible = ref(false);

// Static options
const showParentOptions = [
  { label: "显示", tip: "会显示父级菜单", value: true },
  { label: "隐藏", tip: "不会显示父级菜单", value: false },
];

const hiddenTagOptions = [
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
];

const menuTypeOptions = [
  { label: "菜单", value: 0 },
  { label: "iframe", value: 1 },
  { label: "外链", value: 2 },
  { label: "按钮", value: 3 },
];

const keepAliveOptions = [
  {
    label: "缓存",
    tip: "会保存该页面的整体状态，刷新后会清空状态",
    value: true,
  },
  { label: "不缓存", tip: "不会保存该页面的整体状态", value: false },
];

const fixedTagOptions = [
  { label: "固定", tip: "当前菜单名称固定显示在标签页且不可关闭", value: true },
  {
    label: "不固定",
    tip: "当前菜单名称不固定显示在标签页且可关闭",
    value: false,
  },
];

const frameLoadingOptions = [
  { label: "开启", tip: "有首次加载动画", value: true },
  { label: "关闭", tip: "无首次加载动画", value: false },
];

const showLinkOptions = [
  { label: "显示", tip: "会在菜单中显示", value: true },
  { label: "隐藏", tip: "不会在菜单中显示", value: false },
];

const props = {
};

// Computed rules
const rules = computed(() => {
  if (form.value.sysMenuType == 0) {
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
  if (form.value.sysMenuType == 1 || form.value.sysMenuType == 2) {
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
});

// Methods
const initialRole = async () => {
  roleOptions.value.push({
    sysRoleId: 1,
    sysRoleCode: "SUPER_ADMIN",
    sysRoleName: "超级管理员",
  });
  fetchListRole({}).then((res) => {
    roleOptions.value.push(...res.data);
  });
};

const reset = () => {
  dynamicTags.value.length = 0;
  form.value = {};
};

const close = async () => {
  visible.value = false;
  loading.value = false;
  tableData.value = [];
  nextTick(() => {
    dialogFormRef.value?.resetFields();
  });
  reset();
};

const clickNode = ($event: MouseEvent) => {
  const target = $event.target as HTMLElement;
  target.parentElement?.parentElement?.firstElementChild?.dispatchEvent(
    new Event("click"),
  );
};

const setTableData = (data: any[]) => {
  Object.assign(tableData.value, data || []);
};

const setData = (data: any) => {
  form.value = data;
  dynamicTags.value = !form.value.sysMenuRole
    ? []
    : form.value.sysMenuRole?.split(",");
};

const open = async (modeValue = "save") => {
  visible.value = true;
  mode.value = modeValue;
  title.value = modeValue == "save" ? "新增" : "编辑";
  if (modeValue == "save") {
    form.value.sysMenuSort = 1;
  } else if (!form.value.sysMenuSort) {
    form.value.sysMenuSort = 0;
  }
};

const transformI18nValue = (value: string) => {
  return transformI18n(value);
};

const submit = () => {
  dialogFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      if (dynamicTags.value) {
        form.value.sysMenuRole = dynamicTags.value.join(",");
      }
      try {
        let res: any = {};
        if (mode.value === "save") {
          res = await fetchSaveMenu(form.value);
        } else if (mode.value === "edit") {
          res = await fetchUpdateMenu(form.value);
        }

        if (res.code == "00000") {
          emit("success", mode.value, form.value);
          visible.value = false;
        } else {
          message(res.msg, { type: "error" });
        }
      } catch (error) {}
    }
    loading.value = false;
  });
};

// Lifecycle
onMounted(() => {
  initialRole();
});

// Expose methods to parent
defineExpose({
});
</script>
<template>
  <div>
    <sc-dialog
      v-model="visible"
      top="10px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      :title="title"
      @close="close"
    >
      <ScForm
        ref="dialogFormRef"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-width="100px"
        class="modern-form"
      >
        <ScRow :gutter="30">
          <re-col>
            <ScFormItem label="菜单类型">
              <el-segmented
                v-model="form.sysMenuType"
                :options="menuTypeOptions"
              />
            </ScFormItem>
          </re-col>

          <re-col>
            <ScFormItem label="上级菜单">
              <ScCascader
                v-model="form.sysMenuPid"
                class="w-full"
                :options="tableData"
                :props="props"
                clearable
                filterable
                placeholder="请选择上级菜单"
              >
                <template #default="{ node, data }">
                  <div @click="clickNode">
                    <span v-if="data.sysMenuI18n">
                      {{ transformI18nValue(data.sysMenuI18n) }}
                    </span>
                    <span v-else>{{ data.sysMenuTitle }}</span>
                    <span v-if="!node.isLeaf"
                      >({{ data.children.length }})</span
                    >
                  </div>
                </template>
              </ScCascader>
            </ScFormItem>
          </re-col>

          <re-col :value="12" :xs="24" :sm="24">
            <ScFormItem label="菜单名称" prop="sysMenuTitle">
              <ScInput
                v-model="form.sysMenuTitle"
                clearable
                placeholder="请输入菜单名称"
                :maxlength="40"
                show-word-limit
              />
            </ScFormItem>
          </re-col>
          <re-col v-if="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <ScFormItem label="菜单名称i18n" prop="sysMenuI18n">
              <ScInput
                v-model="form.sysMenuI18n"
                clearable
                placeholder="请输入菜单名称i18n"
                :maxlength="50"
                show-word-limit
              />
            </ScFormItem>
          </re-col>
          <re-col v-if="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <ScFormItem label="路由名称" prop="sysMenuName">
              <ScInput
                v-model="form.sysMenuName"
                clearable
                placeholder="请输入路由名称"
                :maxlength="40"
                show-word-limit
              />
            </ScFormItem>
          </re-col>

          <re-col v-if="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <ScFormItem label="路由路径" prop="sysMenuPath">
              <ScInput
                v-model="form.sysMenuPath"
                clearable
                placeholder="请输入路由路径"
                :maxlength="200"
                show-word-limit
              />
            </ScFormItem>
          </re-col>
          <re-col v-show="form.sysMenuType === 0" :value="12" :xs="24" :sm="24">
            <ScFormItem label="组件路径" prop="sysMenuComponent">
              <ScInput
                v-model="form.sysMenuComponent"
                clearable
                placeholder="请输入组件路径"
                :maxlength="200"
                show-word-limit
              />
            </ScFormItem>
          </re-col>

          <re-col :value="12" :xs="24" :sm="24">
            <ScFormItem label="菜单排序">
              <ScInputNumber
                v-model="form.sysMenuSort"
                class="!w-full"
                :min="1"
                :max="9999"
                controls-position="right"
              />
            </ScFormItem>
          </re-col>
          <re-col v-show="form.sysMenuType === 0" :value="12" :xs="24" :sm="24">
            <ScFormItem label="路由重定向">
              <ScInput
                v-model="form.sysMenuRedirect"
                clearable
                placeholder="请输入默认跳转地址"
                :maxlength="200"
                show-word-limit
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <ScFormItem label="菜单图标">
              <IconSelect v-model="form.sysMenuIcon" class="w-full" />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <ScFormItem label="右侧图标">
              <ScInput
                v-model="form.sysMenuRedirect"
                clearable
                placeholder="菜单名称右侧的额外图标"
                :maxlength="200"
                show-word-limit
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <ScFormItem label="进场动画">
              <ReAnimateSelector
                v-model="form.sysMenuEnterTransition"
                placeholder="请选择页面进场加载动画"
              />
            </ScFormItem>
          </re-col>
          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <ScFormItem label="离场动画">
              <ReAnimateSelector
                v-model="form.sysMenuLeaveTransition"
                placeholder="请选择页面离场加载动画"
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType === 0" :value="12" :xs="24" :sm="24">
            <ScFormItem label="菜单激活">
              <ScInput
                v-model="form.sysMenuActivePath"
                clearable
                placeholder="请输入需要激活的菜单"
                :maxlength="200"
                show-word-limit
              />
            </ScFormItem>
          </re-col>
          <re-col v-if="form.sysMenuType === 3" :value="12" :xs="24" :sm="24">
            <!-- 按钮级别权限设置 -->
            <ScFormItem label="权限标识" prop="sysMenuPerm">
              <ScInput
                v-model="form.sysMenuPerm"
                clearable
                placeholder="请输入权限标识"
                :maxlength="240"
                show-word-limit
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType === 1" :value="12" :xs="24" :sm="24">
            <!-- iframe -->
            <ScFormItem label="链接地址">
              <ScInput
                v-model="form.sysMenuFrameSrc"
                clearable
                placeholder="请输入 iframe 链接地址"
                :maxlength="240"
                show-word-limit
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <ScFormItem label="菜单">
              <Segmented
                :modelValue="form.sysMenuHidden ? 1 : 0"
                :options="showLinkOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuHidden = value ? 0 : 1;
                  }
                "
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType !== 3" :value="12" :xs="24" :sm="24">
            <ScFormItem label="父级菜单">
              <Segmented
                :modelValue="form.sysMenuShowParent ? 0 : 1"
                :options="showParentOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuShowParent = value ? 1 : 0;
                  }
                "
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <ScFormItem label="缓存页面">
              <Segmented
                :modelValue="form.sysMenuKeepAlive ? 0 : 1"
                :options="keepAliveOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuKeepAlive = value ? 1 : 0;
                  }
                "
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <ScFormItem label="标签页">
              <Segmented
                :modelValue="form.sysMenuHiddenTag ? 1 : 0"
                :options="hiddenTagOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuHiddenTag = value ? 1 : 0;
                  }
                "
              />
            </ScFormItem>
          </re-col>

          <re-col v-show="form.sysMenuType < 2" :value="12" :xs="24" :sm="24">
            <ScFormItem label="固定标签页">
              <Segmented
                :modelValue="form.sysMenuFixedTag ? 0 : 1"
                :options="fixedTagOptions"
                @change="
                  ({ option: { value } }) => {
                    form.sysMenuFixedTag = value ? 1 : 0;
                  }
                "
              />
            </ScFormItem>
          </re-col>

          <re-col :value="12" :xs="24" :sm="24">
            <ScFormItem>
              <template #label>
                <span>所属角色</span>
                <ScTooltip
                  content="当选择角色后, 该菜单只针对当前角色可见"
                  placement="top"
                >
                  <ScIcon style="margin-left: 4px; cursor: help"
                    ><QuestionFilled
                  /></ScIcon>
                </ScTooltip>
              </template>
              <ScSelect v-model="dynamicTags" multiple>
                <ScOption
                  v-for="item in roleOptions"
                  :key="item.sysRoleId"
                  :value="item.sysRoleCode"
                  :label="item.sysRoleName"
                />
              </ScSelect>
            </ScFormItem>
          </re-col>
        </ScRow>
      </ScForm>

      <template #footer>
        <ScButton @click="visible = false">取 消</ScButton>
        <ScButton
          v-if="mode != 'show'"
          type="primary"
          :loading="loading"
          @click="submit()"
          >保 存</ScButton
        >
      </template>
    </sc-dialog>
  </div>
</template>
<style lang="scss">
.el-cascader-panel .el-radio {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  width: 100%;
  height: 100%;
}

.el-cascader-panel .el-radio__input {
  visibility: hidden;
}

.el-cascader-panel .el-cascader-node__postfix {
  top: 10px;
}
</style>
