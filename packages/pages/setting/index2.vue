<script setup>
import { fetchSettingPage } from "@repo/core";
import ScCard from "@repo/components/ScCard/index.vue";
import SaveLayout from "./save.vue";
import { debounce } from "@pureadmin/utils";
import { shallowRef, reactive, computed, nextTick } from "vue";
import shopIcon from "@repo/assets/svg/shop.svg?component";
import laptopIcon from "@repo/assets/svg/laptop.svg?component";
import serviceIcon from "@repo/assets/svg/service.svg?component";
import calendarIcon from "@repo/assets/svg/calendar.svg?component";
import userAvatarIcon from "@repo/assets/svg/user_avatar.svg?component";
import More2Fill from "@iconify-icons/ri/more-2-fill";

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const data = reactive([]);
const products = reactive([
  {
    group: "default",
    description: t("product.default"),
    name: "基础设置",
    isSetup: true,
    type: 5,
    hide: false
  },
  {
    group: "config",
    description: t("product.config"),
    name: "系统设置",
    isSetup: true,
    type: 4,
    hide: false
  }
]);
const saveLayout = shallowRef();
const cardClass = computed(() => ["list-card-item", { "list-card-item__disabled": false }]);

const cardLogoClass = computed(() => ["list-card-item_detail--logo", { "list-card-item_detail--logo__disabled": false }]);

const onSearch = debounce(
  () => {
    fetchSettingPage({}).then(res => {
      data.push(...res.data);
    });
  },
  1000,
  true
);

const visible = reactive({
  detail: false
});
const onRowClick = async item => {
  visible.detail = true;
  await nextTick();
  saveLayout.value.setData(item).open("edit");
};
const close = async () => {
  visible.detail = false;
};
</script>
<template>
  <div class="app-container">
    <SaveLayout v-if="visible.detail" ref="saveLayout" @close="close" />
    <ScCard :data="products">
      <template #default="{ row }">
        <div :class="cardClass">
          <div class="list-card-item_detail bg-bg_color">
            <el-row justify="space-between">
              <div :class="cardLogoClass" @click="onRowClick(row)">
                <shopIcon v-if="row.type === 1" />
                <calendarIcon v-if="row.type === 2" />
                <serviceIcon v-if="row.type === 3" />
                <userAvatarIcon v-if="row.type === 4" />
                <laptopIcon v-if="row.type === 5" />
                <Setting v-if="row.type === 6" />
              </div>
              <div class="list-card-item_detail--operation">
                <el-tag :color="row.isSetup ? '#00a870' : '#eee'" effect="dark" class="mx-1 list-card-item_detail--operation--tag">
                  {{ row.isSetup ? "已启用" : "已停用" }}
                </el-tag>
                <el-dropdown trigger="click" :disabled="!row.isSetup">
                  <IconifyIconOffline :icon="More2Fill" class="text-[24px]" />
                  <template #dropdown>
                    <el-dropdown-menu :disabled="!row.isSetup">
                      <el-dropdown-item @click="onRowClick(row)">管理</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-row>
            <p class="list-card-item_detail--name text-text_color_primary">
              {{ row.name }}
            </p>
            <p class="list-card-item_detail--desc text-text_color_regular">
              {{ row.description }}
            </p>
          </div>
        </div>
      </template>
    </ScCard>
  </div>
</template>

<style lang="scss" scoped>
.list-card-item {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  border-radius: 3px;

  &_detail {
    flex: 1;
    min-height: 140px;
    padding: 24px 32px;

    &--logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      font-size: 26px;
      color: #0052d9;
      background: #e0ebff;
      border-radius: 50%;

      &__disabled {
        color: #a1c4ff;
      }
    }

    &--operation {
      display: flex;
      height: 100%;

      &--tag {
        border: 0;
      }
    }

    &--name {
      margin: 24px 0 8px;
      font-size: 16px;
      font-weight: 400;
    }

    &--desc {
      display: -webkit-box;
      height: 40px;
      margin-bottom: 24px;
      overflow: hidden;
      font-size: 12px;
      line-height: 20px;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  &__disabled {
    .list-card-item_detail--name,
    .list-card-item_detail--desc {
      color: var(--el-text-color-disabled);
    }

    .list-card-item_detail--operation--tag {
      color: #bababa;
    }
  }
}
</style>
