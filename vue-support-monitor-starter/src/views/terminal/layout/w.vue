<template>
    <div v-if="dataValue && dataValue.length > 0">
        <el-table :data="dataValue" style="width: 100%" border :height="300">
            <!-- <el-table-column label="序号" prop="index" type="index" show-overflow-tooltip fixed></el-table-column> -->
            <el-table-column label="账号" prop="user" show-overflow-tooltip fixed></el-table-column>
            <el-table-column label="地址" prop="from" show-overflow-tooltip fixed width="180">
                <template #default="{row}">{{row.from}}<span v-if="row.city">({{row.city}})</span></template>
            </el-table-column>
            <el-table-column label="登录时间" prop="loginTime" show-overflow-tooltip></el-table-column>
            <!-- <el-table-column label="空闲时间" prop="idle" show-overflow-tooltip></el-table-column> -->
            <!-- <el-table-column label="所有进程使用的CPU时间" prop="jcpu" show-overflow-tooltip></el-table-column> -->
            <el-table-column label="CPU时间" prop="pcpu" show-overflow-tooltip></el-table-column>
            <el-table-column label="命令或程序" prop="what" show-overflow-tooltip></el-table-column>
        </el-table>
    </div>
    <el-empty v-else></el-empty>
</template>
<script>
export default {
    name: 'w',
    data() {
        return {
            dataValue: this.data,
        }
    },
    props: {
        form: {
            type: Object,
            default: () => ({})
        },
        data: {
            type: Array,
            default: () => ([])
        }
    },
    watch: {
        data: {
            handler(val) {
                this.dataValue = val?.data || [];
            },
            deep: true
        }
    },
}
</script>