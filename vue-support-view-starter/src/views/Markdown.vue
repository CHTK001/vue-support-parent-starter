<template>
        <el-skeleton :rows="5" animated :loading="loading"/>
      <v-md-preview :text="text"></v-md-preview>
  </template>
<script>
import '@/utils/base64.js'
import CryptoJS from "crypto-js";
import http from "@/utils/request"

export default {
    data() {
        return {
            file: null,
            text: '',
            loading: true
        }
    },
    mounted() {
        this.file = CryptoJS.enc.Base64.parse(document.getElementById('fileId').value).toString(
            CryptoJS.enc.Utf8
        );
        this.loading = true;
        document.title = this.$TOOL.param.getFileName(this.file);
        http.get(this.file).then(res => {
            this.text = res;
        }).finally(() => this.loading = false)
    }
}
</script>
<style lang="scss">
	@import '@/style/style.scss';
</style>