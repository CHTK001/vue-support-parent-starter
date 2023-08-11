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
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="姓名" prop="name" width="150"></el-table-column>
                <el-table-column label="性别" prop="sex" width="150" :filters="sexFilters" :filter-method="filterHandler">
                    <template #default="scope">
                        <el-tag v-if="scope.row.sex == '男'">{{ scope.row.sex }}</el-tag>
                        <el-tag v-if="scope.row.sex == '女'" type="success">{{ scope.row.sex }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="邮箱" prop="email" width="250"></el-table-column>
                <el-table-column label="评分" prop="num" width="150" sortable></el-table-column>
                <el-table-column label="进度" prop="progress" width="250" sortable>
                    <template #default="scope">
                        <el-progress :percentage="scope.row.progress" />
                    </template>
                </el-table-column>
                <el-table-column label="注册时间" prop="datetime" width="150" sortable></el-table-column>
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
            form: {
                mapMethod: []
            },
            data: [
                {
                    title: "类型(多)",
                    key: "mapMethod",
                    multiple: true,
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
                apiObj: this.$API.system.mapping.page
            }
        }
    },
    methods: {
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.form.mapMethod = selected
        }
    }
}
</script>

<style></style>
