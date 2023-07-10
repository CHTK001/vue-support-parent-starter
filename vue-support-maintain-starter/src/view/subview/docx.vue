<template>
  <div>
    <div id="bodyContainer" class="content"></div>
  </div>
</template>
  
<script>
import { defaultOptions, renderAsync } from "docx-preview";
import { getQueryString } from '@/utils/Utils';
import '@/style/easy.css'
import request from '@/utils/request'


export default {
  name: 'docx',
  data () {
      return {
          docxOptions: {
              className: "kaimo-docx-666", // string：默认和文档样式类的类名/前缀
              inWrapper:  true, // boolean：启用围绕文档内容的包装器渲染
              ignoreWidth: false, // boolean：禁用页面的渲染宽度
              ignoreHeight: false, // boolean：禁止渲染页面高度
              ignoreFonts: false, // boolean：禁用字体渲染
              breakPages: true, // boolean：在分页符上启用分页
              ignoreLastRenderedPageBreak: true, // boolean：在 lastRenderedPageBreak 元素上禁用分页
              experimental: false, // boolean：启用实验功能（制表符停止计算）
              trimXmlDeclaration: true, // boolean：如果为true，解析前会从​​ xml 文档中移除 xml 声明
              useBase64URL: false, // boolean：如果为true，图片、字体等会转为base 64 URL，否则使用URL.createObjectURL
              useMathMLPolyfill: false, // boolean：包括用于 chrome、edge 等的 MathML polyfill。
              showChanges: false, // boolean：启用文档更改的实验性渲染（插入/删除）
              debug: false, // boolean：启用额外的日志记录
          }
      };
  },
  mounted() {
    // 具体函数调用位置根据情况而定
    this.readExcelFromRemoteFile(getQueryString('url') + (getQueryString('bucket')||'') + (getQueryString('id')||'') + '?fromPath=' + (getQueryString('fromPath')||''));
  },
  methods:{
    readExcelFromRemoteFile(url) {
      request.get(url, {
          responseType: 'arraybuffer'
      }).then(data => {
          this.docxRender(new Uint8Array(data.data));
      })
    },
    // 渲染docx
    docxRender(buffer) {
        let bodyContainer = document.getElementById("bodyContainer");
        renderAsync(
            buffer, // Blob | ArrayBuffer | Uint8Array, 可以是 JSZip.loadAsync 支持的任何类型
            bodyContainer, // HTMLElement 渲染文档内容的元素,
            null, // HTMLElement, 用于呈现文档样式、数字、字体的元素。如果为 null，则将使用 bodyContainer。
            this.docxOptions // 配置
        ).then(res => {
            console.log("res---->", res)
        })
    }
  }
}
</script>
<style scoped>
.content {
  height: 100vh;
  overflow: auto;
}
</style>