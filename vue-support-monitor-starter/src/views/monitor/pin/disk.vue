<template>
    <div class="text-white">磁盘信息(已使用)</div>
    <div w50rem h24rem p3 flex="~ col" justify-center items-center bg-dark>
        <dv-scroll-ranking-board :config="diskConfig" style="width:100%;height:200px" />
    </div>
</template>
<script>
export default {
    props: {
        data: {
            type: Array,
            default: () => {
                return []
            }
        }
    },
    watch: {
        data(){
            this.diskConfig.data = this.data;
        }
    },
    data(){
        return {
            diskConfig: {
              data: this.data,
            },
        }
    },
}
</script>