<template>
    <div id="luckysheet" ref="file" style="margin:0px;padding:0px;width:100vw;height:100vh;"  />
</template>
<script>
import '@/utils/base64.js'
import CryptoJS from "crypto-js";
import http from "@/utils/request"
import axios from "axios";
import LuckyExcel from 'luckyexcel'

export default {
    data() {
        return {
            file: null,
            text: '',
            loading: true
        }
    },
    mounted() {
        this.file = CryptoJS.enc.Base64.parse(document.getElementById('fileId').value).toString(
            CryptoJS.enc.Utf8
        );
        document.title = this.$TOOL.param.getFileName(this.file);
        if (this.file == null) {
        this.$message({
            type: 'error',
            message: '文件地址无效，请刷新后重试'
        })
        }
        // 加载文件内容
        this.uploading(this.file)

    },
    methods: {
	// 加载文件内容
    uploading(file) {
        this.loading = true;
        axios({
            method: 'GET',
            responseType: 'blob', // 注意预览的类型
            url: file,
            Headers: { 'Content-Type': 'application/octet-stream' }, //请求头，看各自需求
        }).then(response => {
            this.loading = false
            // world 文档内容预览
            this.displayResult(response.data)
        }).catch( res => {}).finally(() =>  this.loading = false)
    },
    displayResult(buffer) {
      // 得到xlsx文件流后
      LuckyExcel.transformExcelToLucky(
          buffer, 
          function(exportJson, luckysheetfile){
              // console.log(exportJson);
              // console.log(luckysheetfile);
              if (exportJson.sheets == null || exportJson.sheets.length == 0) {
                alert("文件读取失败!");
                return;
              }
              // 销毁原来的表格
              window.luckysheet.destroy();
              // 重新创建新表格
              window.luckysheet.create({
                container: 'luckysheet', // 设定DOM容器的id
                showtoolbar: false, // 是否显示工具栏
                lang: 'zh', // 设定表格语言
                showinfobar: false, // 是否显示顶部信息栏
                showstatisticBar: false, // 是否显示底部计数栏
                sheetBottomConfig: false, // sheet页下方的添加行按钮和回到顶部按钮配置
                allowEdit: false, // 是否允许前台编辑
                enableAddRow: false, // 是否允许增加行
                enableAddCol: false, // 是否允许增加列
                sheetFormulaBar: false, // 是否显示公式栏
                enableAddBackTop: false, //返回头部按钮
                data: exportJson.sheets, //表格内容
                title: exportJson.info.name //表格标题
              });
          },
          function(error){
              // 如果抛出任何错误，则处理错误
          }
      )
    }
}
}
</script>
<style lang="scss">
	@import '@/style/style.scss';
</style>