<template>
    <div class="text-white">组件</div>
    <div style="width:100%;height:200px;" class="flex flex-col gap-8"  >
        <div class="flex gap-8" gap8>
            <dv-button :bg="false"   border="Border4" @click="open('log')">系统日志</dv-button>
            <dv-button :bg="true"  border="Border4" @click="open('trace')">系统链路</dv-button>
            <dv-button :bg="true"  border="Border4" @click="open('process')">系统进程</dv-button>
        </div>
        <div class="flex gap-8" gap8>
            <dv-button :bg="true"  border="Border4" @click="open('terminal')">系统终端</dv-button>
        </div>
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