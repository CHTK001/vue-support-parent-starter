<template>
    <div>
        <el-skeleton :loading="loading" animated :count="6"></el-skeleton>
        <div v-if="!loading" style="height: 100%; width:100%;">
            <vue-office-docx :src="data" />
        </div>
    </div>
</template>
<script>

import http from "@/utils/request"
//引入VueOfficeDocx组件
import VueOfficeDocx from '@vue-office/docx'
//引入相关样式
import '@vue-office/docx/lib/index.css'
export default {
    components: {
        VueOfficeDocx
    },
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
            loading: true,
        }
    },
    mounted() {
        this.loading = true;
        this.data = null;
        window.onload = () => {
            http.get(this.url, {}, {
                headers: {
                    'X-User-Agent': this.ua
                },
                 responseType: 'blob'
            }).then(res => {
                this.data = URL.createObjectURL(res);
            }).finally(() => {
                this.loading = false;
            });
        }
    },
}

</script>
<style lang="scss" scoped>
:global(.viewer-close) {
    display: none;
}
</style>