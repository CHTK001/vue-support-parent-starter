<template>
    <el-button style="margin-left: 0px;" type="primary" size="small" icon="el-icon-edit" text plain @click="doEdit(item)" title="编辑"></el-button>
    <el-button style="margin-left: 0px;" type="primary" size="small" icon="el-icon-delete" text plain @click="doDelete(item)" title="删除"></el-button>
    <el-button style="margin-left: 0px;" type="primary" size="small" icon="el-icon-delete" text plain @click="doDelete(item)" title="删除"></el-button>
    <el-button style="margin-left: 0px;" type="primary" size="small" icon="el-icon-delete" text plain @click="doDelete(item)" title="删除"></el-button>
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
