<template>
 <div w800px h250px py10 flex justify-center items-center bg-dark>
    <dv-water-level-pond :config="memConfig" style="width:200px;height:200px; float: left; margin-right: 0.1rem;" />
    <dv-water-level-pond :config="memFreeConfig" style="width:200px;height:200px; float: left;" />
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
        },
        free: {
            type: Array,
            default: () => {
                return []
            }
        },
    },
    watch: {
        data(){
            this.memConfig.data = this.data;
            this.memFreeConfig.data = this.free;
        }
    },
    data(){
        return {
            memConfig:{
              data: this.data,
              shape: 'round',
            },
            memFreeConfig:{
              data: this.data,
              shape: 'round',
              waveNum: 1
            },
        }
    },
}
</script>