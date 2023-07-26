<template>
    <el-button type="primary" icon="sc-icon-export" ></el-button>
</template>
<script>
export default {
    name: 'ExportTask',
    props: {
        export: {type: Function, default: () => {}},
        apiObj: { type: Object, default: () => {} },
    },
    watch: {
        export: {
            handle(nv, ov) {
                debugger
            },
            immediate: true,
            deep: true
        }

    },
    methods:{

    }
}
</script>
