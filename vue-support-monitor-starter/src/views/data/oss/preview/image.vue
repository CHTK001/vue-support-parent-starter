<template>
    <div>
        <!-- <viewer > -->
            <el-skeleton :loading="loading" animated :count="5">
            </el-skeleton>
        <!-- </viewer> -->
    </div>
</template>
<script>
import 'viewerjs/dist/viewer.css'
import { api as viewerApi } from "v-viewer"
import http from "@/utils/request"

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
            src: null,
            loading: true
        }
    },
    mounted(){
        this.loading = true;
        this.src = null;
        Object.defineProperty(Image.prototype, 'authsrc', {
            writable : true,
            enumerable : true,
            configurable : true
        });
        window.onload = () => {
            // let img = document.createElement('img');
            http.get(this.url, {}, {
                headers: {
                    'X-User-Agent': this.ua
                },
                responseType: 'blob'
            }).then(res => {
                viewerApi({
                    images: [URL.createObjectURL(res)],
                    options: {
                        backdrop: false,
                        inline: true,
                    }
                })
            }).finally(() => {
                this.loading = false;
            });
        }
    },
    unmounted(){
    }
}

</script>
<style lang="scss" scoped>
:global(.viewer-close ){
    display: none;
}
</style>