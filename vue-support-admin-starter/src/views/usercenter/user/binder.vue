<template>
    <h3 class="ui header profile-setting-header third_party_account_binding"> 第三方帐号绑定 </h3>
    <div class="ui form">
        <h4 class="provider-desc">使用以下任一方式都可以登录到您的 Gitee 帐号，避免由于某个帐号失效导致无法登录</h4>
        <scTable ref="table"  :data="binderData" height="auto" paginationLayout="total, prev, pager, next" hideDo>
			<el-table-column label="序号" type="index" width="60"></el-table-column>
            <el-table-column label="绑定帐号信息" prop="loginCodeType"></el-table-column>
            
            <el-table-column label="详情" prop="level" >
                <template #default="scope">
                    <div>
                        <img :src="scope.row.loginAvatar" class="avatar" style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; float: left;">
                        <div style="float: left; margin-left: 13px; margin-top: 3px">{{ scope.row.loginUsername }}</div>
                    </div>
                </template>
			</el-table-column> 
            
            <el-table-column label="绑定时间" prop="createTime"></el-table-column>
            <el-table-column label="操作" width="100">
                <template #default="scope">
                    <el-button size="small" icon="el-icon-delete" type="danger" @click="handleDelete(scope.row)"></el-button>
                </template>
            </el-table-column>
        </scTable>

        <div>
            <h4 class="provider-desc">你还可以绑定以下第三方帐号</h4>
            <span v-for="item in allData" style="margin-top: 20px; position: relative; top: 20px">
                <el-button size="large" v-if="binderDataNames.indexOf(item.name) === -1" circle style="color: red;max-resolution: inherit; margin-left:13px" :icon="item.icon" @click="item.func"></el-button>
            </span>
        </div>
    </div>

</template>
<script>
	export default {
        data() {
            return {
                binderData: [],
                allData: [{
                    name: 'gitee',
                    icon: 'sc-icon-gitee',
                    func: this.binderGitee
                }],
                binderDataNames: []
            }
        },
        mounted(){
            this.afterPropertiesSet();
        },
        methods: {
            handleDelete(item){
                this.$confirm('确定删除该绑定帐号吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.$API.system.binder.unBinder.delete({
                        tripartiteBindId: item.tripartiteBindId
                    }).then(res => {
                        if(res.code !== '00000') {
                            this.$message.error(res.msg);
                            return false
                        }
                        this.afterPropertiesSet();
                    })
                });
            },
            binderGitee() {
                this.$API.system.user.loginCode.get({
                    loginCodeType: 'gitee', 
                    type: 'bind', 
                    callback: encodeURIComponent(window.location.href),
                    loginCallback: encodeURIComponent(window.location.href)
                }).then(res => {
                    window.location.href = res.data;
                })
            },
            async afterPropertiesSet() {
                const res = await this.$API.system.binder.list.get();
                if(res.code === '00000') {
                    this.binderData = res.data;
                    this.binderDataNames = res.data.map(item => item.loginCodeType);
                }
            }
        }
    }
</script>