<template>
  <terminal2 :url="socketUrl" />
</template>
<script>
import { mapState } from 'pinia'


import { getWebSocketUrl } from '@/api/config'
import terminal2 from '@/components/terminal/index.vue'

// https://blog.csdn.net/qq_41840688/article/details/108636267

export default {
  components: {
    terminal2
  },
  props: {
    sshId: {
      type: String,
      default: ''
    },
    machineSshId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {}
  },
  computed: {
    
    
    socketUrl() {
      return getWebSocketUrl(
        '/socket/ssh',
        `userId=${this.getLongTermToken()}&id=${this.sshId}&machineSshId=${
          this.machineSshId
        }&nodeId=system&type=ssh&workspaceId=${this.getWorkspaceId()}`
      )
    }
  },
  mounted() {},
  beforeUnmount() {},
  methods: {}
}
</script>
