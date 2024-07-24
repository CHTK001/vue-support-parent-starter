<template>
    <div>
        <el-skeleton :loading="loading" animated></el-skeleton>
        <vue-json-pretty v-if="!loading" :data="data" :showLineNumber="true" :showIcon="true" :showLength="true"/>
    </div>
</template>
<script>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import http from "@/utils/request"

export default {
    components: {
        VueJsonPretty,
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
                }
            }).then(res => {
                try {
                        this.data = JSON.parse(request.response);
                    } catch (error) {
                        this.data = request.response;
                    }
            }).finally(() => {
                this.loading = false;
            });
        }
    },
    unmounted() {
        Object.defineProperty(Image.prototype, 'authsrc', {
            writable: false,
            enumerable: false,
            configurable: false
        })
    }
}

</script>
<style lang="scss" scoped>
:global(.viewer-close) {
    display: none;
}
</style>