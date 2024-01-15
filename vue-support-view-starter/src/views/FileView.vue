<script>
import { onMounted, ref } from 'vue'

import '@/utils/base64.js'
import CryptoJS from "crypto-js";

export default {
    data() {
        return {
            file: null,
            text: '',
        }
    },
    mounted() {
        this.file =  CryptoJS.enc.Base64.parse(document.getElementById('fileId').value).toString(
            CryptoJS.enc.Utf8
        );
    }
}
</script>
<template>
  <div class='simple-view'>
    <file-viewer :url="file" />
  </div>
</template>

<style lang="scss">
	@import '@/style/style.scss';
</style>