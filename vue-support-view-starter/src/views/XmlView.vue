<template>
    <el-skeleton :rows="5" animated :loading="loading"/>
    <XmlViewer :xml="text"  v-if="!loading"/>
</template>
<script>
import '@/utils/base64.js'
import CryptoJS from "crypto-js";
import http from "@/utils/request"
import XmlViewer from 'vue3-xml-viewer'

export default {
    components: {
        XmlViewer
    },
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
        document.title = this.$TOOL.param.getFileName(this.file);
        this.loading = true;
        http.get(this.file).then(res => {
            this.text = res;
        }).finally(() => this.loading = false)
    }
}
</script>
<style lang="scss">
	@import '@/style/style.scss';
</style>