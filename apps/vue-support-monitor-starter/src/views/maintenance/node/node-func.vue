<template>
  <CustomDrawer
    destroy-on-close
    placement="right"
    :width="`${getCollapsed ? 'calc(100vw - 80px)' : 'calc(100vw - 200px)'}`"
    :header-style="{
      padding: '0 10px'
    }"
    :body-style="{
      padding: '0'
    }"
    :open="true"
    @close="
      () => {
        $emit('close');
      }
    "
  >
    <template #title>
      <a-space>
        <!-- {{ name }} -->
        <div>
          <a-tabs
            v-model:activeKey="current"
            :tab-bar-style="{
              margin: '0'
            }"
          >
            <a-tab-pane v-if="tabs.includes('project')" key="project" :tab="$t('i18n_436367b066')" />
            <a-tab-pane v-if="tabs.includes('scripct')" key="scripct" :tab="$t('i18n_a1fb7f1606')" />
            <a-tab-pane v-if="tabs.includes('scripct-log')" key="scripct-log" :tab="$t('i18n_7370bdf0d2')" />
          </a-tabs>
        </div>
      </a-space>
    </template>
    <div class="layout-content">
      <project-search v-if="current === 'project'" :node-id="id" />
      <script-list v-else-if="current === 'scripct'" :node-id="id" />
      <script-log v-else-if="current === 'scripct-log'" :node-id="id" />
    </div>
  </CustomDrawer>
</template>
<script>
import CustomDrawer from "@/components/customDrawer/index.vue";
import CustomModal from "@/components/customModal/index.vue";
import ScriptLog from "@/views/maintenance/node/node-layout/other/script-log.vue";
import ScriptList from "@/views/maintenance/node/script-list.vue";
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ScriptList,
    ScriptLog,
    projectSearch: defineAsyncComponent(() => import("@/views/maintenance/node/search.vue")),
    CustomDrawer
  },
  props: {
    name: {
      type: String,
      default: ""
    },
    id: {
      type: String,
      default: ""
    },
    tabs: {
      type: Array,
      default: function () {
        return ["project", "scripct", "scripct-log"];
      }
    }
  },
  emits: ["close"],
  data() {
    return {
      getCollapsed: false,
      current: null
    };
  },
  created() {
    //
    this.current = this.tabs[0];
  },
  methods: {}
};
</script>
<style scoped>
.layout-content {
  padding: 0;
  margin: 15px;
}
:deep(.ant-tabs-nav::before) {
  border-bottom: 0;
}
</style>
