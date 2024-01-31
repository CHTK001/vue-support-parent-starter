<template>
    <el-container style="background-color: #ccc; position: relative;">
        <el-header>
            <div class="left-panel">
                <el-button type="primary" icon="el-icon-refresh" @click="afterPropertiesSet"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="doSave"></el-button>
                <el-button type="primary" icon="el-icon-setting" @click="openSetting"></el-button>
            </div>
            <div class="right-panel">

            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table"  :apiObj="apiObj" height="auto" paginationLayout="total, prev, pager, next" hideDo>
                <el-table-column label="序号" type="index" width="60" ></el-table-column>
                <el-table-column label="模板编号" prop="messageCode" width="250"></el-table-column>
                <el-table-column label="模板名称" prop="messageName" show-overflow-tooltip></el-table-column>
                <el-table-column label="模板类型" prop="messageType" >
                    <template #default="scope">
                        <el-tag>{{ showType(scope.row.messageType) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="模板内容" prop="messageTemplate" show-overflow-tooltip></el-table-column>
                <el-table-column label="创建时间" prop="createTime" ></el-table-column>
                <el-table-column label="创建人" prop="createName"></el-table-column>
                <el-table-column label="更新时间" prop="updateTime"></el-table-column>
                <el-table-column label="操作" prop="ops">
                    <template #default="scope">
                        <el-button type="text" size="small" @click="doEdit(scope.row)">编辑</el-button>
                        <el-button type="text" size="small" @click="doDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>

		    </scTable>
        </el-main>
    </el-container>

    <save-dialog ref="saveDialog" v-if="saveDialogStatus" @success="handlerSuccess" />
    <setting ref="settingDialog" v-if="settingDialogStatus" />
</template>
<script>
import SaveDialog from './save.vue'
export default {
    components: {
        SaveDialog
    },
    data() {
        return {
            saveDialogStatus: false,
            settingDialogStatus: false,
            deleteStatus: false,
            form: {
                page: 1,
                pageSize: 10,
            },
            height: '100%',
            lineNum: 6,
            messageTypeList: [{
				label: '系统消息',
				value: 'SYSTEM'
			}, {
				label: '系统通知',
				value: 'NOTICE'
			}, {
				label: '系统公告',
				value: 'ANNOUNCE'
			}, {
				label: '其它通知',
				value: 'OTHER'
			}],
            returnData: [],
            returnTotal: 0,
            apiObj: this.$API.system.message.page
        }
    },
    computed: {
        _height() {
            return Number(this.height) ? Number(this.height) + 'px' : this.height
        },
        _table_height() {
            return "calc(100% - 50px)"
        }
    },
    mounted() {
    },

    methods: {
        handlerSuccess() {
            this.afterPropertiesSet();
        },
        openSetting(){
            this.settingDialog = true;
            this.$router.push('/setting/message/setting')
        },
        afterPropertiesSet(){
            this.$refs.table.reload(this.form);
        },
        showType(type) {
            for(const item of this.messageTypeList) {
                if(item.value === type) {
                    return item.label;
                }
            }
            return '其它';
        },
        doSave() {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('add', this.messageTypeList).setData({});
            });
        },
        doDelete(item) {
            this.$API.system.message.delete.delete(item).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.afterPropertiesSet();
            })
        },
        doEdit(item) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit', this.messageTypeList).setData(item);
            });
        },
    }
}
</script>

<style scoped>
.task {
    height: 210px;
    margin-left: 10px;
    margin-right: 10px;
    margin-top: 5px
}

.task-item h2 {
    font-size: 15px;
    color: #3c4a54;
    padding-bottom: 15px;
}

.task-item li {
    list-style-type: none;
    margin-bottom: 10px;
}

.task-item li h4 {
    font-size: 12px;
    font-weight: normal;
    color: #999;
}

.task-item li p {
    margin-top: 5px;
}

.task-item .bottom {
    border-top: 1px solid #EBEEF5;
    text-align: right;
    z-index: 9999;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.task-add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    color: #999;
}

.task-add:hover {
    color: #409EFF;
}

.task-add i {
    font-size: 30px;
}

.task-add p {
    font-size: 12px;
    margin-top: 20px;
}

.dark .task-item .bottom {
    border-color: var(--el-border-color-light);
}

.progress {
    margin-top: -25px
}

.percentage-value {
    display: block;
    margin-top: 10px;
    font-size: 18px;
}

.percentage-label {
    display: block;
    margin-top: 10px;
    font-size: 12px;
}

.demo-progress .el-progress--line {
    margin-bottom: 15px;
    width: 350px;
}

.demo-progress .el-progress--circle {
    margin-right: 15px;
}</style>
