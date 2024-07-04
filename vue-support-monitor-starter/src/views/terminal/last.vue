<template>
    <el-dialog v-model="visiable" title="登录信息" @close="close" top="10px" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable>
        <template #header="{ close, titleId, titleClass }">
        <div class="my-header">
            <h4 :id="titleId" :class="titleClass">{{ title }}
                <span>登录信息
                    <el-icon @click="afterPropertiesSet">
                        <component is="el-icon-refresh" />
                    </el-icon>
                </span>
            </h4>
        </div>
        </template>
        <el-skeleton :rows="5" animated  v-if="loading" />
        <div v-else-if="data.length > 0" style="height: 700px; overflow-y: auto;">
            <el-table :data="data" style="width: 100%" border :height="700">
                <el-table-column label="账号" prop="user" show-overflow-tooltip></el-table-column>
                <el-table-column label="地址" prop="from" show-overflow-tooltip>
                    <template #default="{row}">{{row.from}}({{row.city}})</template>
                </el-table-column>
                <el-table-column label="登录时间" prop="loginTime" show-overflow-tooltip></el-table-column>
                <el-table-column label="登出时间" prop="logoutTime" show-overflow-tooltip></el-table-column>
            </el-table>
        </div>
        <el-empty v-else></el-empty>
    </el-dialog>
</template>

<script>
export default {
    name: 'LastDialog',
    data() {
        return {
            loading: false,
            visiable: false,
            data: [],
            form: {},
        }
    },
    methods: {
        close() {
            this.visiable = false;
            this.form = {};
        },
        open() {
            this.visiable = true;
            return this;
        },
        setData(item) {
            Object.assign(this.form, item);
            this.afterPropertiesSet();
        },
        afterPropertiesSet() {
            this.loading = true;
            this.$API.terminal.baseLast.put({id: this.form.terminalId}).then(res => {
                if(res.code == '00000') {
                    this.data = res.data;
                }
            }).finally(() => {
                this.loading = false;
            })
        }
    }
}

</script>