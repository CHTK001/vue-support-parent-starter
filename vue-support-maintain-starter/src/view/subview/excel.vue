<template>
    <div id="content">
        <el-button-group class="m-t-md">
            <el-button v-for="(item, index) in sheetNames" :key="index" :type="sheetActive === item ? 'primary' : ''"
                @click="onTabWorkbook(index)">
                {{ item }}
            </el-button>
        </el-button-group>
        <div ref="excel-dom"></div>
    </div>
</template>
<script>
import XLSX from 'xlsx' // 预览
import canvasDatagrid from 'canvas-datagrid'
import { getQueryString } from '@/utils/Utils';
import '@/style/easy.css'

export default {
    name: 'excel',
    data() {
        return {
            datas: null,
            excelGridData: [],
            excelGridDom: null,
            workbook: null,
            sheets: [],
            sheetNames: [],
            sheetActive: ''
        }
    },
    mounted() {
        var url = getQueryString('url') + getQueryString('bucket') + getQueryString('id');
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        const _this = this;
        req.onload = function (e) {
            _this.datas = req.response;
            _this.excelGridData = []
            _this.excelGridDom = null
            let data = new Uint8Array(_this.datas)
            let workbook = XLSX.read(data, { type: 'array' })
            _this.readWorkbook(workbook)
        }
        req.send();
    },
    methods: {
        onTabWorkbook(index) {
            var datas = this.sheets[this.sheetNames[index]] // 这里读取第index张sheet
            var csv = XLSX.utils.sheet_to_csv(datas)
            this.excelGridData = []
            this.$refs['excel-dom'].innerHTML = ''
            var rows = csv.split('\n')
            rows.pop() // 最后一行（空数组）没用的
            rows.forEach((row, idx) => {
                var columns = row.split(',')
                let obj = {}
                this.excelGridData.push(obj)
                for (var i = 0; i < columns.length; i++) {
                    let key = String.fromCharCode(65 + i)
                    this.excelGridData[idx][key] = columns[i]
                }
            })
            this.excelGridDom = canvasDatagrid({
                editable: false // 禁止单元编辑
            })
            this.excelGridDom.data = this.excelGridData
            this.$refs['excel-dom'].appendChild(this.excelGridDom)
            this.sheetActive = this.sheetNames[index]
        },
        readWorkbook(workbook) {
            this.workbook = workbook
            this.sheetNames = workbook.SheetNames
            this.sheets = workbook.Sheets
            this.onTabWorkbook(0)
        }
    }
}
</script>

<style scoped>
#content {
    height: 100vh;
    overflow: auto;
}
.m-t-md {
    /* position: fixed; */
}
</style>