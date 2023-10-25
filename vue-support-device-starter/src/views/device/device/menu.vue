<template>
    <el-button style="margin-left: 0px;" type="primary" size="small" icon="sc-icon-database" text plain @click="doEdit(item)" title="设备数据"></el-button>
</template>
<script>

export default {
    props: {
        item: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    mounted() {

    }
}
</script>
