<template>
<oss-layout></oss-layout>
</template>

<script>
import OssLayout from "@/components/oss/OssLayout.vue";
export default {
  name: "oss",
  components: {OssLayout},
  mounted() {
    document.title = '文件管理'
  }
}
</script>

<style scoped>

</style>