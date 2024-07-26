<template>
    <div>
        <el-skeleton :loading="loading" animated :count="6"></el-skeleton>
        <div v-if="!loading" style="height: 100%; width:100%;">
            <div id="jsmind_container" ></div>
        </div>
    </div>
</template>
<script>
import http from "@/utils/request"
import XMindViewer from '@hyjiacan/xmind-viewer'

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
                responseType: 'arraybuffer'
            }).then(res => {
                this.loading = false;
                this.$nextTick(() => {
                    const container = document.getElementById("jsmind_container");
                    XMindViewer.viewer.render(container, res, null, [])
                })
            }).finally(() => {
                this.loading = false;
            });
    },
}

</script>
<style lang="scss" scoped>
</style>