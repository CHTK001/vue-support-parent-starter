<template>
    <el-button style="margin-left: 0px;" type="primary" size="small" icon="sc-icon-database" text plain @click="doDatabase(item)" title="设备数据"></el-button>
    <el-button v-if="item.deviceLatitude && item.deviceLongitude" style="margin-left: 0px;" type="primary" size="small" icon="sc-icon-position" text plain @click="doPosition(item)" title="设备位置"></el-button>
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
        console.log(this.item);
    }
}
</script>
