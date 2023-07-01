<template>
  <web-sql></web-sql>
</template>

<script>
import WebSql from "@/components/WebSql.vue";
export default {
  name: "sql-edit",
  components: {WebSql},
  mounted() {
    document.title = 'SQL编辑器'
  }
}
</script>

<style scoped>

</style>