<template>
    <el-skeleton :rows="5" animated :loading="loading"/>
    <div id="luckysheet" style="margin:0px;padding:0px;width:100%;height:100vh;"  v-if="!loading"/>
</template>
<script>
import '@/utils/base64.js'
import CryptoJS from "crypto-js";
import http from "@/utils/request"
// 引入axios用来发请求
import axios from "axios";
// 引入预览插件
import { renderAsync } from "docx-preview";

export default {
    data() {
        return {
            file: null,
            text: '',
            loading: true
        }
    },
    mounted() {
        this.$nextTick(() =>  {
            setTimeout(() => {
                this.file = CryptoJS.enc.Base64.parse(document.getElementById('fileId').value).toString(
                    CryptoJS.enc.Utf8
                );
                document.title = this.$TOOL.param.getFileName(this.file);
                if (this.file == null) {
                    this.$message({
                        type: 'error',
                        message: '文件地址无效，请刷新后重试'
                    })
                }
                this.loading = false
                http.get(this.file, {}, { responseType: 'blob',}).then(res => {
                    this.text = res;
                  
                    renderAsync(
                        // 预览的数据，拿到接口返回值，（具体看文件流在那个值下边，看数据层级）
                        this.text, // Blob | ArrayBuffer | Uint8Array, 可以是 JSZip.loadAsync 支持的任何类型
                        document.getElementById('luckysheet'), // HTMLElement 渲染文档内容的元素,
                        null, // HTMLElement, 用于呈现文档样式、数字、字体的元素。如果为 null，则将使用 bodyContainer。
                        this.docxOptions // 配置  暂时没配置  看自己需求配置
                    )
                })
            }, 500)
        })
    },
    methods: {
   
    }
}
</script>
<style lang="scss">
	@import '@/style/style.scss';
</style>