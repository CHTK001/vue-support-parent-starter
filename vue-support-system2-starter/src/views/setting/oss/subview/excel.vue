<template>
  <div class="content">
    <div>
      <div id="luckysheet" style="margin:0px;padding:0px;position:absolute;width:100%;height:100%;left: 0px;top: 0px;"></div>
    </div>
  </div>
</template>
  
<script>
import ExcelJS from "exceljs";
import { getQueryString } from '@/utils/Utils';
import LuckyExcel from 'luckyexcel'
// import {s} from './excel/plugins.js'
// import {a} from'./excel/luckysheet.js'
import './excel/luckysheet.css'
import './excel/plugins.css'
import './excel/iconfont.css'
export default {

  data(){
    return {
      jsonData:  undefined
    }
  },
  mounted(){

    let script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.src = 'src/views/setting/oss/subview/excel/plugin.js';
    document.body.appendChild(script1);

    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'src/views/setting/oss/subview/excel/luckysheet.js';
    document.body.appendChild(script);
    const _this = this;
    // debugger
    const url = getQueryString('url') + (getQueryString('bucket') || '') + (getQueryString('id') || '') + '?fromPath=' + (getQueryString('fromPath') || '');
    LuckyExcel.transformExcelToLuckyByUrl(url, url, function (exportJson, luckysheetfile) {
      if (exportJson.sheets == null || exportJson.sheets.length == 0) {
        alert('Failed to read the content of the excel file, currently does not support xls files!')
        return
      }
      // console.log('exportJson', exportJson)
      _this.jsonData = exportJson
      function isFunction(val) {
        return Object.prototype.toString.call(val).slice(8, -1)=== 'Function'
      }
      isFunction(window?.luckysheet?.destroy) && window.luckysheet.destroy()

      window.luckysheet.create({
        container: 'luckysheet', //luckysheet is the container id
        showinfobar: false,
        data: exportJson.sheets,
        title: exportJson.info.name,
        userInfo: exportJson.info.name.creator,
      })
    })
  }

}
</script>
  
<style>
#luckysheet {
  margin: 0px;
  padding: 0px;
  position: absolute;
  width: 100%;
  left: 0px;
  top: 30px;
  bottom: 0px;
}

#uploadBtn {
  font-size: 16px;
}

#tip {
  position: absolute;
  z-index: 1000000;
  left: 0px;
  top: 0px;
  bottom: 0px;
  right: 0px;
  background: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 40px;
  align-items: center;
  justify-content: center;
  display: flex;
}
</style>