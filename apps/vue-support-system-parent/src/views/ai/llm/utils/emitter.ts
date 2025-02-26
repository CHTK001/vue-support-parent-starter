// 引入 mitt 库
import mitt from "mitt";

// 创建一个事件总线
const emitter = mitt();

// 导出事件总线
export default emitter;
