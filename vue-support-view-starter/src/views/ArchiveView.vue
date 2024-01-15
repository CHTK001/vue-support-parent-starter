<template>
    <el-skeleton :rows="5" animated :loading="loading"/>
    <el-tree  v-if="!loading"
        :props="props"
        :data="text"
        node-key="id"
        :highlight-current="true"
    />
</template>
<script>
import '@/utils/base64.js'
import CryptoJS from "crypto-js";
import http from "@/utils/request"

export default {
    data() {
        return {
            props : {
                label: function(data, node) {
                    return data?.label || '根目录'
                },
            },
            file: null,
            text: [],
            loading: true
        }
    },
    mounted() {
        this.loading = false;

        this.$nextTick(() => {
            setTimeout(() => {
                this.file = CryptoJS.enc.Base64.parse(document.getElementById('fileId').value).toString(
                    CryptoJS.enc.Utf8
                );
                document.title = this.$TOOL.param.getFileName(this.file);
                try {
                    const textValue = document.getElementById('data').innerText;
                    this.text = JSON.parse(textValue)?.children;
                }catch (error) {
                    console.log(error)
                }
            }, 500)
        })
    }
       
}
</script>
<style lang="scss">
@import '@/style/style.scss';
.jv-container .jv-code.boxed {
    max-height: 100vh !important;
}
:deep(.mytree) {
  .el-tree-node {
    position: relative;
    padding-left: 32px;
  }
  .el-tree-node__children {
    padding-left: 16px;
  }

  .el-tree-node :last-child:before {
    height: 38px;
  }
  
.el-tree > .el-tree-node:before {
    border-left: none;
  }

  .el-tree > .el-tree-node:after {
    border-top: none;
  }
  
  .el-tree-node:before {
    content: "";
    left: -4px;
    position: absolute;
    right: auto;
    border-width: 1px;
    border-left: 1px dashed #1389bc;
    bottom: 0px;
    height: 100%;
    top: -26px;
    width: 1px;
  }

  .el-tree-node:after {
    content: "";
    left: -4px;
    position: absolute;
    right: auto;
    border-width: 1px;
    border-top: 1px dashed #1389bc;
    height: 20px;
    top: 12px;
    width: 18px;
  }
  .el-tree .el-tree-node__expand-icon.expanded {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  .el-tree .el-icon-caret-right:before {
    content: "\e723";
    font-size: 16px;
    color: #1389bc;
    position: absolute;
    left: -20px;
    top: -8px;
  }
  .el-tree .el-tree-node__expand-icon.expanded.el-icon-caret-right:before {
    content: "\e722";
    font-size: 16px;
    color: #1389bc;
    position: absolute;
    left: -20px;
    top: -8px;
  }
  .el-tree-node__expand-icon.is-leaf:before {
    content: "\e722";
    font-size: 16px;
    color: #1389bc;
    position: absolute;
    left: -20px;
    top: -8px;
  }
  .el-tree-node__content > .el-tree-node__expand-icon {
    padding: 0;
  }
}
</style>