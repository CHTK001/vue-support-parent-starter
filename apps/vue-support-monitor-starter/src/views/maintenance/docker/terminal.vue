<template>
  <terminal :url="socketUrl" />
</template>
<script>
import { mapState } from 'pinia'
import { getWebSocketUrl } from '@/api/config'
import terminal from '@/components/terminal/index.vue'


// https://blog.csdn.net/qq_41840688/article/details/108636267

export default {
  components: {
    terminal
  },
  props: {
    id: {
      type: String,
      default: ''
    },
    containerId: {
      type: String,
      default: ''
    },
    machineDockerId: {
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
        '/socket/docker_cli',
        `id=${this.id}&machineDockerId=${
          this.machineDockerId
        }&nodeId=system&type=docker&containerId=${this.containerId}`
      )
    }
  },
  mounted() {},
  beforeUnmount() {},
  methods: {}
}
</script>
