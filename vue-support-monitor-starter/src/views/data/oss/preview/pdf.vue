<template>
    <div>
        <el-skeleton :loading="loading" animated :count="5"></el-skeleton>
        <div v-if="!loading">
            <VuePdfEmbed annotation-layer text-layer :source="data" />
        </div>
    </div>
</template>
<script>
import VuePdfEmbed from 'vue-pdf-embed'
import http from "@/utils/request"
import 'vue-pdf-embed/dist/styles/annotationLayer.css'
import 'vue-pdf-embed/dist/styles/textLayer.css'
export default {
    components:{
        VuePdfEmbed
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
</style>