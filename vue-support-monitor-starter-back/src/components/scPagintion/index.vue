<template>
    <div class="scTable-page" v-if="!hidePagination || !hideDo">
        <div class="scTable-pagination">
            <el-pagination v-if="!hidePagination" background :small="true" :layout="paginationLayout" :total="total"
                :page-size="scPageSize" :page-sizes="pageSizes" v-model:currentPage="currentPage"
                @current-change="paginationChange" @update:page-size="pageSizeChange"></el-pagination>
        </div>
        <div class="scTable-do" v-if="!hideDo">
            <el-button v-if="!hideRefresh" @click="refresh" icon="el-icon-refresh" circle
                style="margin-left:15px"></el-button>
        </div>
    </div>
</template>
<script>
import config from "@/config/table";

export default {
    name: 'scPagination',
    components: {
    },
    props: {
        pageSize: { type: Number, default: config.pageSize },
        pageSizes: { type: Array, default: config.pageSizes },
        hidePagination: { type: Boolean, default: false },
        total: { type: Number, default: 0 },
        dataChange: { type: Function, default: () =>{} },
        hideDo: { type: Boolean, default: false },
        hideRefresh: { type: Boolean, default: false },
        paginationLayout: { type: String, default: config.paginationLayout },

    },
    data() {
        return {
            scPageSize: this.pageSize,
            currentPage: 1,
            customColumnShow: false,
            summary: {},
            config: {
                size: this.size,
                border: this.border,
                stripe: this.stripe
            },
            page: 1
        }
    },
    mounted(){
    },
    methods: {
        //刷新数据
        refresh() {
            this.getData();
        },
        //获取数据
        getData() {
            this.$emit('dataChange', {pageSize: this.scPageSize, page: this.page})
        },
        //分页点击
        paginationChange(page) {
            this.page = page;
            this.getData();
        },
        //条数变化
        pageSizeChange(size) {
            this.scPageSize = size
            this.getData();
        },

    }
}
</script>

<style>
.scTable {}

.scTable-table {
    height: calc(100% - 50px);
}

.scTable-page {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    bottom: 0;
    z-index: 29232233;
    width: 100%;
}

.scTable-do {
    white-space: nowrap;
}


.scTable:deep(.el-table__footer) .cell {
    font-weight: bold;
}

.scTable:deep(.el-table__body-wrapper) .el-scrollbar__bar.is-horizontal {
    height: 12px;
    border-radius: 12px;
}

.scTable:deep(.el-table__body-wrapper) .el-scrollbar__bar.is-vertical {
    width: 12px;
    border-radius: 12px;
}</style>