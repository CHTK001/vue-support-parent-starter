<template>
    <div>
        <el-skeleton :loading="loading" animated></el-skeleton>
        <div v-if="!loading">
            <MdPreview :editorId="id" :modelValue="data" />
            <MdCatalog :editorId="id" :scrollElement="scrollElement" />
        </div>
    </div>
</template>
<script>
import { MdPreview, MdCatalog } from 'md-editor-v3';
// preview.css相比style.css少了编辑器那部分样式
import 'md-editor-v3/lib/preview.css';
import http from "@/utils/request"

export default {
    components: {
        MdPreview, MdCatalog
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
            scrollElement: document.documentElement,
            data: null,
            id:  'preview-only',
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
                this.data = res;
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