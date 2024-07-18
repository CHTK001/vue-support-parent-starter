<template>
    <div :style="{ 'width': width }">
        <el-form :inline="true" class="demo-form-inline " label-width="80px" label-position="left">
            <el-form-item l>
                <el-date-picker v-model="rangTimeValue" :editable="false" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
            </el-form-item>
            <el-form-item>
                <el-select v-model="query.action" placeholder="请选择动作">
                    <el-option label="全部"></el-option>
                    <el-option label="删除" value="DELETE"></el-option>
                    <el-option label="新增" value="INSERT"></el-option>
                    <el-option label="更新" value="UPDATE"></el-option>
                    <el-option label="查询" value="QUERY"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-input v-model="query.tableName" placeholder="请输入表名" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="doSearch" icon="el-icon-search"></el-button>
            </el-form-item>
            <div>{{ title }}</div>
        </el-form>
        <el-divider></el-divider>
        <search-dialog @success="doSearchSuccess" ref="searchDialogRef" :width="width"></search-dialog>
    </div>
</template>

<script>
import SearchDialog from '../log/search.vue'

export default {
    components: {
        SearchDialog
    },
    props: {
        data: { type: Object, default: () => ({}) },
        width: { type: String, default: '100%' },
        mode: { type: String, default: 'add' },
    },
    data() {
        return {
            total: 0,
            title: '',
            editDialogStatus: false,
            searchDialogStatus: false,
            query: {
                current: 0
            },
            loaded: false,
            rangTimeValue: [],
            form: {
                tableName: null,
                action: null
            }
        }
    },
    mounted() {
        this.open(this.data);
        this.loaded = false;
        this.rangTimeValue[1] = new Date();
        this.rangTimeValue[0] = new Date(new Date().getTime() - 86400 * 1000);
    },
    methods: {
        doSearchSuccess(title, total) {
            this.loaded = false;
            this.total = total;
            this.title = title
        },
        doSearch() {
            if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
                this.$message.error('请选择时间');
            }

            this.loaded = true;
            this.searchDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.searchDialogRef.open(this.rangTimeValue, this.form, this.query);
            })
        },
        open(form) {
            Object.assign(this.form, form);
            this.editDialogStatus = true;
        },
        close() {
            this.editDialogStatus = false;
            this.form = {};
            // this.query.tableName = null;
            // this.query.action = null;
        }

    }
}
</script>