//表格选择器配置

export default {
  pageSize: 20, //表格每一页条数
  parseData: function (res: any) {
    return {
      data: res.data.data || res.data,
      total: res.data.total || res.total, //分析总数字段结构
      msg: res.message || res.msg, //分析描述字段结构
      code: res.code || res.status //分析状态字段结构
    };
  },
  request: {
    page: "page", //规定当前分页字段
    pageSize: "pageSize", //规定一页条数字段
    keyword: "keyword" //规定搜索字段
  },
  props: {
    label: "label", //映射label显示字段
    value: "value" //映射value值字段
  }
};
