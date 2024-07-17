<template>
    <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true"  width="550px" draggable title="检索日志" @close="close">
        <el-form :inline="false" class="demo-form-inline " label-width="80px" label-position="left">
            <el-form-item label="检索时间">
                <el-date-picker v-model="rangTimeValue" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
            </el-form-item>
            <el-form-item label="动作">
                <el-select v-model="query.action" placeholder="请选择动作">
                    <el-option label="全部" ></el-option>
                    <el-option label="删除" value="DELETE"></el-option>
                    <el-option label="新增" value="INSERT"></el-option>
                    <el-option label="更新" value="UPDATE"></el-option>
                    <el-option label="查询" value="QUERY"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="表名">
                <el-input v-model="query.tableName" placeholder="请输入表名" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" @click="doSearch" icon="el-icon-search"></el-button>
        </template>
    </el-dialog>
    <search-dialog v-if="searchDialogStatus" ref="searchDialogRef"></search-dialog>

</template>

<script>
import SearchDialog from './search.vue'

export default {
    components:{
        SearchDialog
    },
    data(){
        return {
            editDialogStatus: false,
            searchDialogStatus: false,
            query: {},
            rangTimeValue: [],
            form: {
                tableName: null,
                action: null
            }
        }
    },
    mounted(){
        this.rangTimeValue[1] = new Date();
        this.rangTimeValue[0] = new Date(new Date().getTime() - 86400 * 1000);
    },
    methods: {
        doSearch(){
            if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
                this.$message.error('请选择时间');
                return;
            }

            this.searchDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.searchDialogRef.open(this.rangTimeValue, this.form, this.query);
                this.close();
            })
        },
        open(form){
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