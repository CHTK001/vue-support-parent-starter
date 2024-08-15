<script setup lang="ts">
import type { Ref } from 'vue';
import { h, reactive, ref, shallowRef } from 'vue';
import { useBoolean } from '@sa/hooks';
import { $t } from '@/locales';
import { fetchDeleteMenu, fetchGetAllPages, fetchGetMenuTree } from '@/service/api';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { enableStatusRecord, enableStatusTag, menuTypeRecord, menuTypeTag } from '@/constants/business';
import { transDeleteParams } from '@/utils/common';
import { useAuth } from '@/hooks/business/auth';
import PermissionListTable from './modules/permission-list-table.vue';
import MenuOperateDrawer, { type OperateType } from './modules/menu-operate-drawer.vue';

const { bool: detailVisible, setBool: setDetailVisible, setFalse: hideDetail } = useBoolean();

const { bool: menuDrawerVisible, setTrue: openMenuDrawer } = useBoolean();

const { hasAuth } = useAuth();

const operateType = ref<OperateType>('add');

type MenuTreeModel = Api.SystemManage.MenuTreeData;

/** tree data */
const tree = shallowRef<MenuTreeModel[]>([]);

/** tree pattern name , use tree search */
const name: Ref<string> = ref('');

/** the select menu data */
const showData: MenuTreeModel = reactive({
  sysMenuId: 0,
  sysMenuPid: 0,
  sysMenuI18n: '',
  sysMenuType: '1',
  sysMenuTitle: '',
  sysMenuName: '',
  sysMenuPath: '',
  sysMenuIcon: '',
  sysMenuHidden: '0',
  sysMenuSort: 0
});

/** get tree data */
async function getTree() {
  const { error, data } = await fetchGetMenuTree();
  if (!error) {
    tree.value = data.map(recursive);
  }
}

/** recursive menu tree data, add prefix transform treeOption format */
function recursive(item: Api.SystemManage.Menu): MenuTreeModel {
  const result: MenuTreeModel = {
    ...item,
    //sysMenuTitle: $t(item.sysMenuI18n as App.I18n.I18nKey),
    prefix: () => {
      const icon = item.sysMenuIcon || undefined;
      return h(SvgIcon, {
        icon,
        class: 'text-icon'
      });
    }
  };
  if (item.children) {
    result.children = item.children.map(recursive);
  }
  return result;
}

/** tree select handle */
function handleSelectKeys(node: NaiveUI.TreeOption | null, action: string) {
  setDetailVisible(action === 'select');
  if (detailVisible) {
    Object.assign(showData, node);
  }
}

const allPages = shallowRef<string[]>([]);

async function getAllPages() {
  const { data: pages } = await fetchGetAllPages();
  allPages.value = pages || [];
}

function handleAddMenu() {
  operateType.value = 'add';
  openMenuDrawer();
}

function handleAddChildMenu() {
  operateType.value = 'addChild';
  openMenuDrawer();
}

function handleEditMenu() {
  operateType.value = 'edit';
  openMenuDrawer();
}

async function handleDeleteMenu() {
  // request
  const { error, data: result } = await fetchDeleteMenu(transDeleteParams([showData.sysMenuId as string]));
  if (!error && result) {
    window.$message?.success($t('common.deleteSuccess'));
    init(null);
    hideDetail();
  }
}

function init(data: Api.SystemManage.MenuEdit | null) {
  if (data) {
    Object.assign(showData, data);
  }
  getTree();
  getAllPages();
}

init(null);
</script>

<template>
  <div class="h-full-hidden flex">
    <NGrid :x-gap="8" :y-gap="8" item-responsive responsive="screen" cols="1 s:1 m:5 l:5 xl:5 2xl:5" class="h-full-hidden">
      <NGridItem span="1" class="h-full-hidden">
        <NCard :title="$t('page.manage.menu.title')" :bordered="false" size="small" class="h-full sm:flex-1-hidden" content-class="h-full-hidden">
          <template #header-extra>
            <NButton quaternary @click="init(null)">
              <template #icon>
                <SvgIcon icon="ic:round-refresh" />
              </template>
            </NButton>
          </template>
          <NInput v-model:value="name" :placeholder="$t('page.manage.menu.form.name')" clearable />
          <NTree :data="tree" key-field="sysMenuId" label-field="sysMenuTitle" :pattern="name" block-line class="py-3" virtual-scroll :show-irrelevant-nodes="false" @update-selected-keys="(_key, _option, { node, action }) => handleSelectKeys(node, action)" />
        </NCard>
      </NGridItem>
      <NGridItem v-if="detailVisible" span="4" class="flex flex-col">
        <NCard :title="$t('page.manage.menu.detail')" :bordered="false" size="small" class="mb-2">
          <template #header-extra>
            <NSpace>
              <NButton v-if="showData.sysMenuType === '1' && hasAuth('sys:menu:add')" type="primary" quaternary size="small" @click="handleAddChildMenu()">
                {{ $t('page.manage.menu.addChildMenu') }}
              </NButton>
              <NButton v-if="hasAuth('sys:menu:add')" ghost type="primary" size="small" @click="handleAddMenu()">
                {{ $t('common.add') }}
              </NButton>
              <NButton v-if="hasAuth('sys:menu:update')" ghost type="primary" size="small" @click="handleEditMenu()">
                {{ $t('common.edit') }}
              </NButton>
              <NPopconfirm v-if="hasAuth('sys:menu:delete')" placement="bottom" @positive-click="handleDeleteMenu">
                <template #trigger>
                  <NButton ghost type="error" size="small">
                    {{ $t('common.delete') }}
                  </NButton>
                </template>
                {{ $t('common.confirmDelete') }}
              </NPopconfirm>
            </NSpace>
          </template>
          <NDescriptions label-placement="left" size="small" bordered :column="2">
            <NDescriptionsItem :label="$t('page.manage.menu.type')">
              <NTag :type="menuTypeTag[showData.sysMenuType]">{{ $t(menuTypeRecord[showData.sysMenuType]) }}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.menu.status')">
              <NTag :type="enableStatusTag[showData.sysMenuHidden]">{{ $t(enableStatusRecord[showData.sysMenuHidden]) }}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.menu.name')">{{ showData.sysMenuTitle }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.menu.i18nKey')">{{ showData.sysMenuI18n }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.menu.routeName')">{{ showData.sysMenuName }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.menu.routePath')">{{ showData.sysMenuPath }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>
        <PermissionListTable :show-data="showData" :all-pages="allPages" />
      </NGridItem>
      <NGridItem v-else span="4">
        <NCard :bordered="false" size="small" class="h-full">
          <NEmpty :description="$t('page.manage.menu.selectTreeIsEmptyTip')" class="h-full justify-center" />
        </NCard>
      </NGridItem>
    </NGrid>
    <MenuOperateDrawer v-model:visible="menuDrawerVisible" :row-data="showData" :operate-type="operateType" :all-pages="allPages" @submitted="data => init(data)" />
  </div>
</template>

<style scoped></style>
