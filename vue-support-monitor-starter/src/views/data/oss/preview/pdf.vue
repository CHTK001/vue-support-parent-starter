<template>
    <div>
        <el-skeleton :loading="loading" animated :count="5"></el-skeleton>
        <div v-if="!loading" style="height: 100%; width:100%;">
            <vue-office-pdf  :src="data" />
        </div>
    </div>
</template>
<script>
import http from "@/utils/request"
import VueOfficePdf from '@vue-office/pdf'
export default {
    components:{
        VueOfficePdf
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
                this.data = URL.createObjectURL(res);
            }).finally(() => {
                this.loading = false;
            });
    },
}

</script>
<style lang="less" scoped>
:deep(.vue-office-pdf) {
    background-color: #fff;
}
:deep(.vue-office-pdf-wrapper) {
    padding: 0 !important;
}
canvas,
:deep(canvas) {
    width: 100% !important;
}
</style>