/**
 * 三国演义知识图谱示例数据（G6 v5 数据格式）
 *
 * <p>忠实于知识库「三国演义知识图谱」的势力结构（蜀 / 曹魏 / 东吴 / 吕布集团 /
 * 董卓集团 / 袁绍集团 / 东汉朝廷 / 曹军 / 孙刘联军），每节点带 {@code cluster}
 * 势力字段 + {@code type} 类型（person / location / event / organization）。
 * 作为 bubble-sets 按势力分组的集成示例数据。</p>
 */
export interface SanguoNode {
  id: string;
  data: { cluster: string; type: string; degree?: number };
  style: { size?: number; labelText?: string };
}

export interface SanguoEdge {
  source: string;
  target: string;
  data?: { relation?: string };
}

/** 节点：id / 势力 / 类型 / 重要度（决定节点大小） */
export const sanguoNodes: SanguoNode[] = [
  // ---- 蜀汉 ----
  { id: "刘备", data: { cluster: "蜀汉", type: "person", degree: 6 }, style: { size: 60 } },
  { id: "关羽", data: { cluster: "蜀汉", type: "person", degree: 4 }, style: { size: 50 } },
  { id: "张飞", data: { cluster: "蜀汉", type: "person", degree: 4 }, style: { size: 50 } },
  { id: "诸葛亮", data: { cluster: "蜀汉", type: "person", degree: 5 }, style: { size: 55 } },
  { id: "赵云", data: { cluster: "蜀汉", type: "person", degree: 3 }, style: { size: 45 } },
  { id: "马超", data: { cluster: "蜀汉", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "黄忠", data: { cluster: "蜀汉", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "魏延", data: { cluster: "蜀汉", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "刘禅", data: { cluster: "蜀汉", type: "person", degree: 1 }, style: { size: 30 } },
  { id: "姜维", data: { cluster: "蜀汉", type: "person", degree: 2 }, style: { size: 38 } },
  // ---- 曹魏 ----
  { id: "曹操", data: { cluster: "曹魏", type: "person", degree: 8 }, style: { size: 64 } },
  { id: "曹丕", data: { cluster: "曹魏", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "夏侯惇", data: { cluster: "曹魏", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "张辽", data: { cluster: "曹魏", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "郭嘉", data: { cluster: "曹魏", type: "person", degree: 3 }, style: { size: 42 } },
  { id: "荀彧", data: { cluster: "曹魏", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "司马懿", data: { cluster: "曹魏", type: "person", degree: 3 }, style: { size: 42 } },
  { id: "许褚", data: { cluster: "曹魏", type: "person", degree: 1 }, style: { size: 30 } },
  { id: "曹仁", data: { cluster: "曹魏", type: "person", degree: 2 }, style: { size: 38 } },
  // ---- 东吴 ----
  { id: "孙权", data: { cluster: "东吴", type: "person", degree: 5 }, style: { size: 55 } },
  { id: "周瑜", data: { cluster: "东吴", type: "person", degree: 4 }, style: { size: 50 } },
  { id: "鲁肃", data: { cluster: "东吴", type: "person", degree: 3 }, style: { size: 42 } },
  { id: "吕蒙", data: { cluster: "东吴", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "陆逊", data: { cluster: "东吴", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "黄盖", data: { cluster: "东吴", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "甘宁", data: { cluster: "东吴", type: "person", degree: 1 }, style: { size: 30 } },
  { id: "太史慈", data: { cluster: "东吴", type: "person", degree: 1 }, style: { size: 30 } },
  // ---- 吕布集团 ----
  { id: "吕布", data: { cluster: "吕布集团", type: "person", degree: 3 }, style: { size: 42 } },
  { id: "貂蝉", data: { cluster: "吕布集团", type: "person", degree: 2 }, style: { size: 30 } },
  // ---- 董卓集团 ----
  { id: "董卓", data: { cluster: "董卓集团", type: "person", degree: 3 }, style: { size: 42 } },
  { id: "李傕", data: { cluster: "董卓集团", type: "person", degree: 1 }, style: { size: 30 } },
  // ---- 袁绍集团 ----
  { id: "袁绍", data: { cluster: "袁绍集团", type: "person", degree: 3 }, style: { size: 42 } },
  { id: "颜良", data: { cluster: "袁绍集团", type: "person", degree: 1 }, style: { size: 30 } },
  { id: "文丑", data: { cluster: "袁绍集团", type: "person", degree: 1 }, style: { size: 30 } },
  // ---- 东汉朝廷 ----
  { id: "刘表", data: { cluster: "东汉朝廷", type: "person", degree: 2 }, style: { size: 38 } },
  { id: "汉献帝", data: { cluster: "东汉朝廷", type: "person", degree: 2 }, style: { size: 38 } },
  // ---- 地点 ----
  { id: "许昌", data: { cluster: "地点", type: "location", degree: 2 }, style: { size: 34 } },
  { id: "成都", data: { cluster: "地点", type: "location", degree: 2 }, style: { size: 34 } },
  { id: "建业", data: { cluster: "地点", type: "location", degree: 2 }, style: { size: 34 } },
  { id: "荆州", data: { cluster: "地点", type: "location", degree: 3 }, style: { size: 42 } },
  { id: "赤壁", data: { cluster: "地点", type: "location", degree: 2 }, style: { size: 34 } },
  // ---- 事件 ----
  { id: "赤壁之战", data: { cluster: "事件", type: "event", degree: 3 }, style: { size: 42 } },
  { id: "官渡之战", data: { cluster: "事件", type: "event", degree: 2 }, style: { size: 34 } },
  { id: "夷陵之战", data: { cluster: "事件", type: "event", degree: 2 }, style: { size: 34 } },
];

/** 边：人物↔人物、人物↔地点、人物↔事件 */
export const sanguoEdges: SanguoEdge[] = [
  // 蜀汉内部
  { source: "刘备", target: "关羽" },
  { source: "刘备", target: "张飞" },
  { source: "刘备", target: "诸葛亮" },
  { source: "刘备", target: "赵云" },
  { source: "刘备", target: "马超" },
  { source: "刘备", target: "黄忠" },
  { source: "关羽", target: "魏延" },
  { source: "诸葛亮", target: "姜维" },
  { source: "刘备", target: "刘禅" },
  // 曹魏内部
  { source: "曹操", target: "曹丕" },
  { source: "曹操", target: "夏侯惇" },
  { source: "曹操", target: "张辽" },
  { source: "曹操", target: "郭嘉" },
  { source: "曹操", target: "荀彧" },
  { source: "曹操", target: "司马懿" },
  { source: "曹操", target: "许褚" },
  { source: "曹操", target: "曹仁" },
  // 东吴内部
  { source: "孙权", target: "周瑜" },
  { source: "孙权", target: "鲁肃" },
  { source: "孙权", target: "吕蒙" },
  { source: "孙权", target: "陆逊" },
  { source: "周瑜", target: "黄盖" },
  { source: "孙权", target: "甘宁" },
  { source: "孙权", target: "太史慈" },
  // 吕布 / 董卓 / 袁绍 / 朝廷
  { source: "吕布", target: "貂蝉" },
  { source: "董卓", target: "李傕" },
  { source: "袁绍", target: "颜良" },
  { source: "袁绍", target: "文丑" },
  { source: "汉献帝", target: "刘表" },
  // 地点归属（主要治所）
  { source: "曹操", target: "许昌" },
  { source: "刘备", target: "成都" },
  { source: "孙权", target: "建业" },
  { source: "刘表", target: "荆州" },
  // 事件关联
  { source: "曹操", target: "赤壁之战" },
  { source: "周瑜", target: "赤壁之战" },
  { source: "诸葛亮", target: "赤壁之战" },
  { source: "曹操", target: "官渡之战" },
  { source: "袁绍", target: "官渡之战" },
  { source: "刘备", target: "夷陵之战" },
  { source: "陆逊", target: "夷陵之战" },
  // 跨势力关键连线（让图有整体连通性）
  { source: "刘备", target: "孙权" },
  { source: "关羽", target: "曹操" },
  { source: "张飞", target: "吕布" },
  { source: "吕布", target: "董卓" },
  { source: "曹操", target: "董卓" },
];
