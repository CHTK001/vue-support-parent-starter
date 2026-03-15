<script setup lang="ts">
import { IconJson } from "@repo/components/ReIcon/data";
import { cloneDeep, isAllEmpty } from "@pureadmin/utils";
import { ref, computed, CSSProperties, watch } from "vue";
import Search from "@iconify-icons/ri/search-eye-line";

type ParameterCSSProperties = (item?: string) => CSSProperties | undefined;

defineOptions({
  name: "IconSelect"
});

const inputValue = defineModel({ type: String });

const iconList = ref(IconJson);
const icon = ref();
const currentActiveType = ref("ep:");
// 深拷贝图标数据，前端做搜索
const copyIconList = cloneDeep(iconList.value);
const totalPage = ref(0);
// 每页显示35个图标
const pageSize = ref(35);
const currentPage = ref(1);

// 搜索条件
const filterValue = ref("");

const tabsList = [
  {
    label: "饿了么",
    name: "ep:"
  },
  {
    label: "像素",
    name: "pixelarticons:"
  },
  {
    label: "Remix Icon",
    name: "ri:"
  },
  {
    label: "Bootstrap Icons",
    name: "bi:"
  },
  {
    label: "Font Awesome 5 Solid",
    name: "fa-solid:"
  },
  {
    label: "humbleicons",
    name: "humbleicons:"
  },
  {
    label: "meteocons",
    name: "meteocons:"
  },
  {
    label: "devicon",
    name: "devicon:"
  },
  {
    label: "simple-icons",
    name: "simple-icons:"
  },
  {
    label: "mingcute",
    name: "mingcute:"
  }
];

const pageList = computed(() => {
  const list1 = copyIconList[currentActiveType.value];
  if (list1) {
    return list1.filter(i => i.includes(filterValue.value)).slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
  }
  return [];
});

const iconItemStyle = computed((): ParameterCSSProperties => {
  return item => {
    if (inputValue.value === currentActiveType.value + item) {
      return {
        borderColor: "var(--el-color-primary)",
        color: "var(--el-color-primary)"
      };
    }
  };
});

function setVal() {
  currentActiveType.value = inputValue.value?.substring(0, inputValue.value.indexOf(":") + 1) as any;
  icon.value = inputValue.value?.substring(inputValue.value.indexOf(":") + 1);
}

function onBeforeEnter() {
  if (isAllEmpty(icon.value)) return;
  setVal();
  const list = copyIconList[currentActiveType.value];
  if (list) {
    // 寻找当前图标在第几页
    const curIconIndex = list.findIndex(i => i === icon.value);
    currentPage.value = Math.ceil((curIconIndex + 1) / pageSize.value);
    return;
  }
  currentPage.value = 1;
}

function onAfterLeave() {
  filterValue.value = "";
}

function handleClick({ props }) {
  currentPage.value = 1;
  currentActiveType.value = props.name;
}

function onChangeIcon(item) {
  icon.value = item;
  inputValue.value = currentActiveType.value + item;
}

function onCurrentChange(page) {
  currentPage.value = page;
}

function onClear() {
  icon.value = "";
  inputValue.value = "";
}

watch(
  () => pageList.value,
  () => {
    const list = copyIconList[currentActiveType.value];
    if (!list) {
      return;
    }
    totalPage.value = list.filter(i => i.includes(filterValue.value)).length;
  },
  { immediate: true }
);
watch(
  () => inputValue.value,
  val => val && setVal(),
  { immediate: true }
);
watch(
  () => filterValue.value,
  () => (currentPage.value = 1)
);
</script>

<template>
  <div class="selector">
    <ScInput v-model="inputValue" disabled>
      <template #append>
        <ScPopover
          :width="350"
          trigger="click"
          popper-class="pure-popper"
          :popper-options="{
            placement: 'auto'
          }"
          @before-enter="onBeforeEnter"
          @after-leave="onAfterLeave"
        >
          <template #reference>
            <div class="w-[40px] h-[32px] cursor-pointer flex justify-center items-center">
              <IconifyIconOffline v-if="!icon" :icon="Search" />
              <IconifyIconOnline v-else :icon="inputValue" />
            </div>
          </template>

          <ScInput v-model="filterValue" class="px-2 pt-2" placeholder="搜索图标" clearable />

          <ScTabs v-model="currentActiveType" @tab-click="handleClick">
            <ScTabPane v-for="(pane, index) in tabsList" :key="index" :label="pane.label" :name="pane.name">
              <ScScrollbar height="220px">
                <ul class="flex flex-wrap px-2 ml-2">
                  <li
                    v-for="(item, key) in pageList"
                    :key="key"
                    :title="item"
                    class="icon-item p-2 cursor-pointer mr-2 mt-1 flex justify-center items-center border border-[#e5e7eb]"
                    :style="iconItemStyle(item)"
                    @click="onChangeIcon(item)"
                  >
                    <IconifyIconOnline :icon="currentActiveType + item" width="20px" height="20px" />
                  </li>
                </ul>
                <ScEmpty v-show="pageList.length === 0" :description="`${filterValue} 图标不存在`" :image-size="60" />
              </ScScrollbar>
            </ScTabPane>
          </ScTabs>

          <div class="w-full h-9 flex items-center overflow-auto border-t border-[#e5e7eb]">
            <ScPagination
              class="flex-auto ml-2"
              :total="totalPage"
              :current-page="currentPage"
              :page-size="pageSize"
              :pager-count="5"
              layout="pager"
              background
              size="small"
              @current-change="onCurrentChange"
            />
            <ScButton class="justify-end mr-2 ml-2" type="danger" size="small" text bg @click="onClear">清空</ScButton>
          </div>
        </ScPopover>
      </template>
    </ScInput>
  </div>
</template>

<style lang="scss" scoped>
.icon-item {
  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    transition: all 0.4s;
    transform: scaleX(1.05);
  }
}

:deep(.el-tabs__nav-next) {
  font-size: 15px;
  line-height: 32px;
  box-shadow: -5px 0 5px -6px #ccc;
}

:deep(.el-tabs__nav-prev) {
  font-size: 15px;
  line-height: 32px;
  box-shadow: 5px 0 5px -6px #ccc;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-tabs__item) {
  height: 30px;
  font-size: 12px;
  font-weight: normal;
  line-height: 30px;
}

:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap) {
  position: static;
  margin: 0;
  box-shadow: 0 2px 5px rgb(0 0 0 / 6%);
}

:deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 24px;
}

:deep(.el-tabs__content) {
  margin-top: 4px;
}
</style>
