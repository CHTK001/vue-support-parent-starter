<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <sc-select-filter :data="data" :selected-values="selectedValues" :label-width="80" @on-change="change"></sc-select-filter>
                <br />
            </div>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-plus"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" row-key="id" stripe>
                <el-table-column label="应用名称" prop="mapApplicationName" width="150"></el-table-column>
                <el-table-column label="方法" prop="mapMethod" width="150">
                    <template #default="scope">
                        <el-tag >{{ scope.row. mapMethod}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="地址" prop="mapMapping" width="150"></el-table-column>
                <el-table-column label="类" prop="mapHandlerType"  show-overflow-tooltip></el-table-column>
                <el-table-column label="方法名" prop="mapHandlerName" width="150" show-overflow-tooltip></el-table-column>
                <el-table-column label="描述" prop="mapMarker" width="250" show-overflow-tooltip></el-table-column>
                <el-table-column label="类型" prop="mapType">
                    <template #default="scope">
                        <el-tag >{{ scope.row. mapType}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="是否禁用" prop="mapApplicationStatus" width="150" :filters="statusFilters" :filter-method="filterHandler">
                    <template #default="scope">
                        <el-switch @change="submitFormUpdate(scope.row)" v-model="scope.row.mapApplicationStatus" class="ml-2"
                            :active-value="0" :inactive-value="1"
                            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" />
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter
    },
    data() {
        return {
            statusFilters: [
					{text: '启用', value: 0},
					{text: '禁用', value: 1}
				],
            form: {
                mapMethod: []
            },
            data: [
                {
                    title: "类型(多)",
                    key: "mapMethod",
                    multiple: !1,
                    options: [
                        {
                            label: "全部",
                            value: ""
                        },
                        {
                            label: "GET",
                            value: "GET"
                        },
                        {
                            label: "POST",
                            value: "POST"
                        },
                        {
                            label: "PUT",
                            value: "PUT"
                        },
                        {
                            label: "DELETE",
                            value: "DELETE"
                        },
                        {
                            label: "PATCH",
                            value: "PATCH"
                        }
                    ]
                }
            ],
            list: {
                apiObj: this.$API.config.mapping.page,
                apiObjUpdate: this.$API.config.mapping.update,
                apiObjSave: this.$API.config.mapping.save,
                apiObjDelete: this.$API.config.mapping.delete,
            }
        }
    },
    methods: {
        submitFormUpdate(row) {
            this.list.apiObjUpdate.update({
                mapId: row.mapId,
                mapApplicationStatus: row.mapApplicationStatus
            }).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.$refs.table.reload(selected)
        }
    }
}
</script>

<style></style>
