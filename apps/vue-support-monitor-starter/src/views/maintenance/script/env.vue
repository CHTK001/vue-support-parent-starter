<template>
  <div>
    <workspaceEnv ref="workspaceEnv" :workspace-id="getWorkspaceId()" :global="true" />
  </div>
</template>
<script>
import workspaceEnv from '@/views/maintenance/system/workspace-env.vue'
import { getHashQuery } from '@/utils/utils'


export default {
  components: {
    workspaceEnv
  },
  data() {
    return {
    }
  },
  created() {},
  methods: { 
    getWorkspaceId() {
      const query = getHashQuery()
      return query.wid || 'DEFAULT'
    },}
}
</script>
