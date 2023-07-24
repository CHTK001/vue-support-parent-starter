<template>
  <div class="content">
    <excel-layout :workbook="workbook1" />
  </div>
</template>
  
<script>
import { getQueryString } from '@/utils/Utils';
import ExcelLayout from './excel-layout.vue'
import { load } from "@/utils/excel";
import "handsontable/dist/handsontable.full.min.css";

export default {
  name:'excel',
  components: {
    ExcelLayout
  },
  data() {
    return { workbook1: undefined }
  },
  created(){
    this.initial();
  },
  methods: {
    async initial() {
      this.workbook1 = await load(getQueryString('url') + (getQueryString('bucket') || '') + (getQueryString('id')|| '') + '?fromPath=' + (getQueryString('fromPath')|| ''));
    },
  }
}
</script>