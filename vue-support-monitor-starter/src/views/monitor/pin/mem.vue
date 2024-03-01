<template>
 <div >
    <div class="text-white block" style="height:10px; ">
        <div class="text-white">内存信息(已使用{{memConfig.data.length > 0 ? memConfig.data[0] : '-'}}%)</div>
        <dv-decoration3  class=""/>
    </div>
    <dv-water-level-pond :config="memConfig" style="width:200px;height:200px; top: 20px"/>
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