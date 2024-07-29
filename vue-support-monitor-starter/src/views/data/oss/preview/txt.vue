<template>
    <div style="height: 100%; width:100%;">
        <el-skeleton :loading="loading" animated :count="6"></el-skeleton>
        <div v-if="!loading">
            <div v-if="!isBlob">
                {{ data }}
            </div>
            <div v-else style="height: 100%; width:100%;">
                <el-icon class="cursor-pointer" @click="download" style="font-size: 64px; position: relative; color: #ccc;    top: calc(50% - 64px);left: calc(50% - 64px)">
                    <component is="sc-icon-download"></component>
                </el-icon>
            </div>
        </div>
    </div>
</template>
<script>
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
        name: {
            type: String,
            default: ''
        },
    },
    data() {
        return {
            data: null,
            loading: true,
            isBlob: false,
        }
    },
    unmounted(){
        try {
            URL.revokeObjectURL(this.url);
        } catch (error) {
            
        }
    },
    mounted() {
        this.loading = true;
        this.data = null;
        const _this = this;
        if (this.url.startsWith('blob')) {
            this.loading = false;
            this.isBlob = true;
            try {
                var xhr = new XMLHttpRequest() //创建XMLHttpRequest对象
                xhr.open('get', this.url, true)//建立http链接
                xhr.onload = function () {
                    if (this.status == 200) {
                        _this.isBlob = false;
                        _this.data = xhr.response
                    }
                }
                xhr.send()   
            } catch (error) {
            }
            this.loading = false;
            return false;
        }
        http.get(this.url, {}, {
            headers: {
                'X-User-Agent': this.ua
            }
        }).then(res => {
            this.data = res;
        }).finally(() => {
            this.loading = false;
        });
    },
    methods: {
        download() {
            const box = document.createElement('a')
            box.download = this.name
            box.href = this.url
            box.click()
        },
    }
}

</script>
<style lang="scss" scoped>
:global(.viewer-close) {
    display: none;
}
</style>