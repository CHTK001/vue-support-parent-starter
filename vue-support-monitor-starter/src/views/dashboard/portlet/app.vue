<template>
    <div style="width:100%;height:100%; margin-top: 32px"  >
        <techButtonA1  :config="config"   @click="open('log')">系统日志</techButtonA1>
        <techButtonA1  :config="config"   @click="open('trace')">系统链路</techButtonA1>
        <techButtonA1  :config="config"   @click="open('process')">系统进程</techButtonA1>
        <techButtonA1  :config="config"   @click="open('terminal')">系统终端</techButtonA1>
  </div>
</template>
<script>

export default {

    props: {
        data: {
            type: Object,
            default: () => {
                return {}
            }
        },
        config:{
            scaleAction:false,
            decorationColorAlt:true,
            scaleAction:false,
            glow:false,
            scale:1.4
        }
    },
    data() {
        return {}
    },
    methods:{
        open(type){
            this.$emit('success',type)
        }
    }
}
</script>