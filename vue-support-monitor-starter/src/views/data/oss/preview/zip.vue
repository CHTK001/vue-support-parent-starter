<template>
    <div  style="height: 100%; width:100%;">
        <el-skeleton :loading="loading" animated :count="6"></el-skeleton>
        <div v-if="!loading"  style="height: 100%; width:100%;">
           <iframe :src="data" frameborder="0" width="100%" height="100%" /> 
        </div>
    </div>
</template>
<script>
import http from "@/utils/request"
import JSZip from 'jszip'

export default {
    props: {
        url: {
            type: String,
            default: ''
        },
        ua: {
            type: String,
            default: ''
        },
    },
    data() {
        return {
            data: null,
            loading: true
        }
    },
    mounted() {
        this.loading = true;
        this.data = null;
        http.get(this.url, {}, {
            headers: {
                'X-User-Agent': this.ua
            },
            responseType: 'blob'
        }).then(res => {
            const zipFile = new File([res], '1.zip');
            const jszip = new JSZip()
            const root = {};
            function pathsToTree(paths) {
                const tree = {};
                const parts = paths.split('/').filter(Boolean); // 分割路径并过滤空字符串
                let current = tree;
                for (let part of parts) {
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
                Object.assign(root, tree);
                return current;
            }

            jszip.loadAsync(zipFile).then((zip) => { // 读取zip
                for (let key in zip.files) { 
                    const current = pathsToTree(key);
                   

                    if (!zip.files[key].dir) {
                        if (/\.(png|jpg|jpeg|gif)$/.test(zip.files[key].name)) {
                            const parts = key.split('/').filter(Boolean); 
                            var p = root;
                            for (let part of parts) {
                                p = p[part];
                            }
                            // // 判断是否是图片格式
                            let base = zip.file(zip.files[key].name).async(
                                'base64') // 将图片转化为base64格式
                            base.then(res => {
                                this.dataList.push({
                                    fileName: zip.files[key].name,
                                    type: 'img',
                                    content: `data:image/png;base64,${res}`
                                })
                            })
                        }
                        if (/\.(txt)$/.test(zip.files[key].name)) { // 判断是否是文本文件
                            let base = zip.file(zip.files[key].name).async(
                                'string') // 以字符串形式输出文本内容
                            base.then(res => {
                                this.dataList.push({
                                    fileName: zip.files[key].name,
                                    type: 'text',
                                    content: res
                                })
                            })
                        }
                    }
                }
            })
        }).finally(() => {
            this.loading = false;
        });
    },
}

</script>
<style lang="scss" scoped>
:global(.viewer-close) {
    display: none;
}
</style>