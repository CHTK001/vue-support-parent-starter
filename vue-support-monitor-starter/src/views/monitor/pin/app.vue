<template>
    <div style="width:100%;height:200px;" class="flex flex-col gap-8 text-white"  >
        <div class="flex gap-8" gap8>
            <dv-button :bg="false" class="text-white"  border="Border4" @click="console.log('click')">系统日志</dv-button>
            <dv-button :bg="false"  border="Border4" @click="console.log('click')">系统链路</dv-button>
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
    }
}
</script>