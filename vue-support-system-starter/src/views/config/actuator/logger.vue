<template>
    <el-dialog v-model="dialogVisible" :destroy-on-close="true" :close-on-click-modal="false" :title="title" width="90%" draggable>
        <el-container>
        <el-header>
            <div class="left-panel">
                <sc-select-filter :data="selectedValuesItem" :selected-values="selectedValues" :label-width="80" @on-change="change"></sc-select-filter>
                <br />
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :filter="filter" :dataTotal="total" :pageSize="form.pageSize" :data="data"  stripe >
                <el-table-column label="应用名称" prop="configApplicationName" width="150"></el-table-column>
                <el-table-column label="环境" prop="configProfile" width="150">
                    <template #default="scope">
                        <el-tag >{{ scope.row?.configProfile}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="名称" prop="name"  show-overflow-tooltip></el-table-column>
                <el-table-column label="日志等级" prop="effectiveLevel" >
                    <template #default="scope">
                        <el-tag v-if="scope.row?.effectiveLevel == 'DEBUG'" type="info">{{ scope.row?.effectiveLevel}}</el-tag>
                        <el-tag v-else-if="scope.row?.effectiveLevel == 'OFF'" type="info">{{ scope.row?.effectiveLevel}}</el-tag>
                        <el-tag v-else-if="scope.row?.effectiveLevel == 'TRACE'" type="info">{{ scope.row?.effectiveLevel}}</el-tag>
                        <el-tag v-else-if="scope.row?.effectiveLevel == 'WARN'" type="warning">{{ scope.row?.effectiveLevel}}</el-tag>
                        <el-tag v-else-if="scope.row?.effectiveLevel == 'ERROR'" type="danger">{{ scope.row?.effectiveLevel}}</el-tag>
                        <el-tag v-else>{{ scope.row?.effectiveLevel}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="配置等级" prop="configuredLevel"  show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" prop=""   width="650">
                    <template #default="scope">
                        <span v-for="item in selectedValuesItem[0].options">
                            <el-button @click="changeLevels(scope.row, item)" :type="item?.value == scope.row?.effectiveLevel ? 'primary' : 'default'"  v-if="!!item?.value">
                                {{ item.value }}
                            </el-button>
                        </span>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>
    </el-dialog>
</template>


<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'

export default {
    name: "actuator-logger",
    components: {scSelectFilter},
    data() {
        return {
            selectedValues: {},
            selectedValuesItem:[{
                title: "日志级别",
                key: "levels",
                multiple: !1,
                options: []
            }],
            form: {
                pageSize: 10
            },
            dialogVisible: 0,
            row: {},
            data:[],
            loggers:{},
            title: '',
            total: 0,
            apiCommand: this.$API.config.actuator.command,
        }
    },
    methods: {
        filter(_value) {
            return !this.selectedValues.levels || this.selectedValues.levels == (_value?.effectiveLevel || _value?.configuredLevel);
        },
        change(selected) {
            this.selectedValues = selected;
            this.$refs.table.reload();
        },
        changeLevels(item, level) {
            this.apiCommand.get({dataId: item.appId, command: 'loggers/' + item.name, method: 'POST', param: JSON.stringify({
                configuredLevel: level.value
            })}).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    item.effectiveLevel = level.value;
                    item.configuredLevel = level.value;
                    return 0;
                }
                this.$message.error(res.msg);
            });
        },
        doLogger(){
            this.total = Object.keys(this.loggers).length;
            this.data.length = 0;
            for(const k of Object.keys(this.loggers)) {
                let v = this.loggers[k];
                this.data.push({
                    name: k,
                    appId: this.row.appId,
                    configApplicationName: this.row.appName,
                    configProfile: this.row.appProfile || '',
                    configuredLevel: v.configuredLevel,
                    effectiveLevel: v.effectiveLevel,
                    filters: !0
                });
            }
        },
        open(item) {
            this.title = item.appName + '日志配置';
            this.dialogVisible = !0;
            this.row = item;
            this.loggers.length = 0;
            this.data.length = 0;
            this.apiCommand.get({dataId: item.appId, command: 'loggers', method: 'get'}).then(res => {
                if(res.code === '00000') {
                    this.loggers = res.data.loggers;
                    this.doLogger();
                    if(this.selectedValuesItem[0].options.length == 0) {
                        this.selectedValuesItem[0].options.push({
                                label: "全部",
                                value: ""
                        })
                        const levels = res.data.levels;
                        for(const k of Object.keys(levels)) {
                            let item = levels[k];
                            this.selectedValuesItem[0].options.push({
                                    label: item,
                                    value: item
                            })
                        }
                            
                    }
                }
            })
        }
    }
}
</script>

