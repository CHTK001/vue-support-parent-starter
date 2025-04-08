import { ref, reactive } from "vue";
import type { SchoolInfo, SchoolInfoQuery } from "@/api";

// 查询参数
export const queryParams = reactive<SchoolInfoQuery>({
  pageNum: 1,
  pageSize: 10,
  schoolName: "",
  schoolType: "",
  schoolLevel: "",
  schoolProvince: "",
  schoolCity: "",
  schoolDistrict: "",
  schoolIs985: undefined,
  schoolIs211: undefined,
  schoolIsDoubleFirst: undefined,
  sortField: "",
  sortOrder: "",
});

// 排序方式
export const sortType = ref<"score" | "rank" | "">("");

// 总数
export const total = ref(0);

// 学校列表
export const schoolList = ref<(SchoolInfo & { schoolInfoStudentCount?: number; schoolInfoTeacherCount?: number })[]>([]);

// 获取排序标签
export const getSortLabel = (type: "score" | "rank" | "") => {
  switch (type) {
    case "score":
      return "按分数排序";
    case "rank":
      return "按排名排序";
    default:
      return "默认排序";
  }
};

// 院校类型选项
export const schoolTypeOptions = [
  { label: "全部", value: "" },
  { label: "综合", value: "综合" },
  { label: "理工", value: "理工" },
  { label: "农林", value: "农林" },
  { label: "医药", value: "医药" },
  { label: "师范", value: "师范" },
  { label: "语言", value: "语言" },
  { label: "财经", value: "财经" },
  { label: "政法", value: "政法" },
  { label: "体育", value: "体育" },
  { label: "艺术", value: "艺术" },
  { label: "民族", value: "民族" },
  { label: "军事", value: "军事" },
];

// 院校特征选项
export const schoolFeatureOptions = [
  { label: "985院校", value: "985" },
  { label: "211院校", value: "211" },
  { label: "双一流院校", value: "双一流" },
  { label: "教育部直属", value: "教育部直属" },
  { label: "中央部委", value: "中央部委" },
  { label: "省部共建", value: "省部共建" },
  { label: "民办院校", value: "民办" },
  { label: "中外合作办学", value: "中外合作" },
];

// 办学层次选项
export const schoolLevelOptions = [
  { label: "全部", value: "" },
  { label: "本科", value: "本科" },
  { label: "专科", value: "专科" },
];

// 地区选项（示例数据，实际应从API获取）
export const regionOptions = [
  {
    value: "北京",
    label: "北京",
    children: [
      {
        value: "海淀区",
        label: "海淀区",
      },
      {
        value: "朝阳区",
        label: "朝阳区",
      },
    ],
  },
  {
    value: "上海",
    label: "上海",
    children: [
      {
        value: "浦东新区",
        label: "浦东新区",
      },
      {
        value: "徐汇区",
        label: "徐汇区",
      },
    ],
  },
];

// 排序选项
export const sortOptions = [
  { label: "综合排序", value: "" },
  { label: "按分数排序", value: "score" },
  { label: "按排名排序", value: "rank" },
  { label: "按热度排序", value: "hot" },
  { label: "按新增时间", value: "time" },
] as any;
