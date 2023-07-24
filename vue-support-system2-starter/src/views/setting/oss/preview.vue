<template>
  <div style="position: relative;">
    <div class="preview" v-if="noFound !== undefined">
      <img :src="noFound" class="preview not-found" />
    </div>
    <div v-else>
      <div class="preview image" v-if="type === 'image'">
        <img @click="showImagesInViewer" :src="url" fit="cover" />
      </div>
      <div class="preview excel"
        v-if="subtype === 'vnd.ms-excel' || subtype === 'csv' || subtype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' || subtype === 'vnd.ms-excel.sheet.macroenabled.12'">
        <iframe :src="url" class="preview" no-border no-scroll style="overflow: hidden;"></iframe>
      </div>
      <div class="preview pdf" v-if="subtype === 'pdf'">
        <iframe :src="url" class="preview" no-border no-scroll style="overflow: hidden;"></iframe>
      </div>
      <div class="preview docx" v-if="subtype === 'vnd.openxmlformats-officedocument.wordprocessingml.document'">
        <iframe :src="url" class="preview" no-border scrolling="no" style="overflow: hidden;"></iframe>
      </div>
      <div class="preview text" v-if="subtype === 'json' || subtype === 'xml' || subtype === 'x-sql' || type === 'text'">
        <iframe :src="url" class="preview" no-border scrolling="no" style="overflow: hidden;"></iframe>
      </div>
    </div>
  </div>
</template>

<script>
import { getQueryString, getAssetsImages, getUrlType } from '@/utils/Utils';
import request from '@/utils/request'
import { Base64 } from 'js-base64'
import ExcelLayout from '@/views/setting/oss/subview/excel-layout.vue'
import { load } from "@/utils/excel";
import "handsontable/dist/handsontable.full.min.css";
import { api as viewerApi } from "v-viewer"

export default {
  name: "Preview",
  components: {
    ExcelLayout
  },
  data() {
    return {
      noFound: getAssetsImages('404.webp'),
      subtype: undefined,
      type: undefined,
      url: undefined,
      workbook1: undefined
    }
  },
  methods: {
    showImagesInViewer: function () {
      const imgs = [this.url];
      viewerApi({ images: imgs })
      return false;
    },
    async initialExcel() {
      this.workbook1 = await load(this.url);
    },
  },
  mounted() {
    document.title = '文件预览';
    const search = location.search;
    if (search.indexOf('?') == -1) {
      return;
    }
    this.noFound = undefined;
    this.url = Base64.decode(search.substring(1));
    getUrlType(this.url)
      .then(data => {
        this.subtype = data.split('/')[1];
        this.type = data.split('/')[0];
        if (this.type === 'image') {
          return;
        }

        if (this.subtype === 'x-sql'
          || this.type === 'text'
          || this.subtype === 'xml'
          || this.subtype === 'json'
        ) {
          this.url = '#/txt?url=' + this.url + '&type=' + this.type + '&subtype=' + this.subtype;
          return;
        }

        if (this.subtype === 'vnd.ms-excel'
          || this.subtype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          || this.subtype === 'vnd.ms-excel.sheet.macroenabled.12'
          || this.subtype === 'csv'
        ) {
          this.url = '#/excel?url=' + this.url
          return;
        }

        if (this.subtype === 'pdf') {
          this.url = '#/pdf?url=' + this.url;
          return;
        }
        if (this.subtype === 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
          this.url = '#/docx?url=' + this.url;
          return;
        }
        debugger
      }
      )
  }
}
</script>

<style scoped>
html,
body,
.preview {
  width: 100%;
  height: 100vh;
}

.image {
  position: absolute;
}</style>