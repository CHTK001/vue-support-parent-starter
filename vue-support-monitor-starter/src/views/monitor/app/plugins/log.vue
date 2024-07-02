<template>
    <el-dialog v-model="visiable" width="70%" draggable :title="appName + '日志配置'">
        <el-header>
            <div>
                <el-input placeholder="请输入类名" v-model="className"></el-input>
            </div>
            <div class="left-panel">
                <sc-select-filter :data="selectedValuesItem" :selected-values="selectedValues" :label-width="80" @on-change="change"></sc-select-filter>
                <br />
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :filter="filter" :dataTotal="total" :pageSize="form.pageSize" :data="data" :params="params" :initiSearch="false" height="auto" paginationLayout="total, prev, pager, next" hideDo>
                <el-table-column label="应用名称" prop="configApplicationName" >
                    <template #default="scope">
                        <el-tag >{{ appName}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="环境" prop="configProfile" show-overflow-tooltip ></el-table-column>
                <el-table-column label="名称" prop="name"  show-overflow-tooltip width="230"></el-table-column>
                <el-table-column label="日志等级" prop="effectiveLevel" fixed>
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
    </el-dialog>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import Base64 from "@/utils/base64";
export default {
    components: {scSelectFilter},
    data(){
        return {
            params: {

            },
            className: null,
            apiObj: this.$API.monitor.actuator.page,
            selectedValues: {
               
            },
            selectedValuesItem:[{
                title: "日志级别",
                key: "levels",
                multiple: !1,
                options: []
            }],
            visiable: false,
            form: {
                pageSize: 10
            },
            dialogVisible: 0,
            row: {},
            data:[],
            loggers:{},
            title: '',
            total: 0,
            profile: '',
            appName: '',
        }
    },
    watch: {
        'className': {
            handler(val) {
                this.$refs.table.reload();
            }
        }
    },
    mounted() {
        this.className = null;
        // try {
        //     this.params.data = Base64.decode(this.$route.query.data);
        //     const data = JSON.parse(this.params.data);
        //     this.appName = data?.appName;
        //     this.profile = data?.profile;
        //     this.params.dataId = 1;
        //     this.params.command = 'loggers';
        // } catch(e){}
        // this.open(this.params.data);
    },

    methods: {
        filter(_value) {
            var rs = !this.selectedValues.levels || this.selectedValues.levels == (_value?.effectiveLevel || _value?.configuredLevel)
            var rs1 = !!this.className ? _value?.name.indexOf(this.className) > -1 : true;
            return rs && rs1;
        },
        change(selected) {
            this.selectedValues = selected;
            this.$refs.table.reload();
        },
        changeLevels(item, level) {
            this.apiObj.get(
                {
                    dataId: 1, 
                    command: 'loggers/' + item.name, 
                    method: 'POST', 
                    param: JSON.stringify({
                        configuredLevel: level.value
                    }),
                    data: this.params.data,
        }).then(res => {
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
                    configProfile: this.profile || '',
                    configuredLevel: v.configuredLevel,
                    effectiveLevel: v.effectiveLevel,
                    filters: !0
                });
            }
        },
        open(item) {
            this.appName = item?.appName;
            this.profile = item?.profile;
            this.visiable = true;
            this.title = item.appName + '日志配置';
            this.dialogVisible = !0;
            this.row = item;
            this.loggers.length = 0;
            this.data.length = 0;
            this.apiObj.get({dataId: 1, command: 'loggers', method: 'get', data: JSON.stringify(item)}).then(res => {
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

                    this.change({levels: 'INFO'})
                }
            })
        }
    }

}

</script>