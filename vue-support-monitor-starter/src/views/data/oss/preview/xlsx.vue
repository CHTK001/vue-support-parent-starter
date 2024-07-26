<template>
    <div>
        <el-skeleton :loading="loading" animated :count="6"></el-skeleton>
        <div id="luckysheet" ref="luckysheet" v-if="!loading" :style="{ margin: '0px',padding:'0px',width:'100%',height: '650px' }"/>
    </div>
</template>
<script>
import http from "@/utils/request"
import LuckyExcel from 'luckyexcel'
export default {
    props: {
        url: {
            type: String,
            default: ''
        },
        ua: {
            type: String,
            default: ''
        },
    },
    data() {
        return {
            data: null,
            loading: true,

        }
    },
    mounted() {
        this.loading = true;
        this.data = null;
            this.$nextTick(() => {
                http.get(this.url, {}, {
                    headers: {
                        'X-User-Agent': this.ua
                    },
                    responseType: 'blob'
                }).then(res => {
                    const file = new File([res], 'filename.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    // 加载 excel 文件
                    LuckyExcel.transformExcelToLucky(file, (exportJson, luckysheetfile) => {
                        if(exportJson.sheets==null || exportJson.sheets.length==0){
                            alert("文件读取失败!");
                            return;
                        }
                        // 销毁原来的表格
                        window.luckysheet.destroy();
                        // 重新创建新表格
                        window.luckysheet.create({
                            container: 'luckysheet', // 设定DOM容器的id
                            showtoolbar: false, // 是否显示工具栏
                            showinfobar: false, // 是否显示顶部信息栏
                            showstatisticBar: false, // 是否显示底部计数栏
                            sheetBottomConfig: false, // sheet页下方的添加行按钮和回到顶部按钮配置
                            allowEdit: false, // 是否允许前台编辑
                            showsheetbar: false,
                            enableAddRow: false, // 是否允许增加行
                            enableAddCol: false, // 是否允许增加列
                            sheetFormulaBar: false, // 是否显示公式栏
                            enableAddBackTop: false,//返回头部按钮
                            data:exportJson.sheets, //表格内容
                            title:exportJson.info.name  //表格标题
                        });
                    });
                   
                }).finally(() => {
                    this.loading = false;
                });
            })
    },
}

</script>
<style lang="scss" scoped>
:global(.viewer-close) {
    display: none;
}
</style>