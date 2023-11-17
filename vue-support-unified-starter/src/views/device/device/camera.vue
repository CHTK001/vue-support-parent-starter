<template>
  <el-dialog v-model="dialogStatus" draggable="" :title="name">
    <vue3VideoPlay :ligthOff="false" preload="none"  :src="url" :poster="poster" type="rtmp/mp4" :title="name" width="100%" height="100%"/>
  </el-dialog>
</template>
  
<script>
export default {
  data() {
    return {
      player: null,
      name: '',
      url: '',
      poster: null,
      dialogStatus: false,
    }
  },
  mounted() {
    
  },
  beforeDestroy() {
  },
  methods: {
    open(url, name, poster) {
      this.name = name;
      this.url = url;
      this.poster = poster;
      this.dialogStatus = true;
    },
  }
}

</script>

<style>
  .eqLive{
    /* 设置任意宽高任意一项即可 然后使用aspect-ratio元素 动态设置比例 */
    width: 500px;
    aspect-ratio: 16/9;
  }
</style>