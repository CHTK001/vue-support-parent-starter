<template>
           <dv-capsule-chart :config="diskConfig" style="width:100%;height:15rem" />
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