<template>
  <div v-if="visible">
    <el-dialog v-model="visible" draggable width="60%" title="组件配置" :close-on-click-modal="false"
      :destroy-on-close="true" @close="doClose">
      <Suspense v-if="visible">
        <template #default>
          <div>
            <component :is="componentPath" ref="proxySettingRef" :form="form" :pluginId="pluginId" :plugin="plugin" />
          </div>
        </template>
      </Suspense>
    </el-dialog>
  </div>
</template>
<script>
export default {
  data() {
    return {
      form: {},
      pluginId: null,
      plugin: null,
      componentPath: null,
      visible: false
    };
  },
  methods: {
    setData(item) {
      Object.assign(this.form, item);
      return this;
    },
    setPluginId(pluginId) {
      this.pluginId = pluginId;
      return this;
    },
    setPlugin(item) {
      this.plugin = item;
      return this;
    },
    setComponent(component) {
      this.componentPath = component;
      return this;
    },
    open() {
      this.visible = true;
    },
    doClose() {
      this.visible = false;
      this.$emit("closed");
    }
  }
};
</script>
