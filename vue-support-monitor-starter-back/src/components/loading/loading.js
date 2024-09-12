import { ElLoading } from "element-plus";

export const servicesLoading = (node,str,lock) => {
  return ElLoading.service({
    target: document.querySelector(node),//loading需要覆盖的DOM节点，默认为body
    fullscreen: false,
    body: false,
    text: str,//加载文案
    lock,//同v-loading的修饰符
    // backgroundColor: 'rgba(55,55,55,0.4)',//背景色
    // spinner: 'el-icon-loading',//加载图标
  })
}
