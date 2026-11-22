/**
 * 教育 AI API —— 趣味模块 / 成语 / 汉字 / 词语 / 古诗 / 昆虫。
 * 由 eduaiApi.ts 按业务域拆分而来；聚合出口见 ../eduaiApi.ts。
 */
import { http } from "@repo/utils";
import type {
  PageResult,
  FunConfig,
  Idiom,
  IdiomGameData,
  IdiomChainStart,
  IdiomChainStep,
  IdiomChainHint,
  EduHanzi,
  HanziQuestion,
  EduWord,
  WordRelatedResult,
  Poem,
  PoemChallengeData,
  PoemChallengeMode,
  PoemGameData,
  Insect,
  InsectGameData,
  InsectOrderCount,
  InsectLibraryItem,
  InsectDetail,
  InsectStageView,
  InsectGuideView,
  InsectGuideSaveRequest,
  FunModuleConfig,
} from "../types";
import { unwrap } from "./unwrap";

export const funApi = {
  // 趣味模块配置
  listAllFunConfigs: () =>
    http()
      .get("/v2/edu/fun/list-all")
      .then<FunConfig[]>(unwrap),
  /**
   * 批量保存（后端同一事务，全成或全败）。
   *
   * @param list 配置列表
   * @returns 保存后的配置（新建行带回 configId）
   */
  batchSaveFunConfigs: (list: Partial<FunConfig>[]) =>
    http()
      .post("/v2/edu/fun/batch-save")
      .data(list as unknown as Record<string, unknown>[])
      .then<FunConfig[]>(unwrap),
  deleteFunConfig: (configId: number) =>
    http()
      .delete(`/v2/edu/fun/delete/${configId}`)
      .then<boolean>(unwrap),

  // 成语游戏
  listIdioms: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/idiom/list")
      .query(params)
      .then<Idiom[]>(unwrap),
  /** 成语分页（后端筛选 + 归属隔离，供成语库 ReTable 使用） */
  pageIdioms: (params: {
    keyword?: string;
    gradeLevel?: string;
    grade?: string;
    difficulty?: number;
    pageNum?: number;
    pageSize?: number;
  } = {}) =>
    http()
      .get("/v2/edu/idiom/page")
      .query(params)
      .then<PageResult<Idiom>>(unwrap),
  generateIdiomGame: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/idiom/game/generate")
      .query(params)
      .then<IdiomGameData>(unwrap),
  validateIdiomPair: (data: { idiomId: number; pinyin: string; meaning: string }) =>
    http()
      .post("/v2/edu/idiom/game/validate")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  getIdiomDetail: (idiomId: number) =>
    http()
      .get(`/v2/edu/idiom/detail/${idiomId}`)
      .then<Idiom>(unwrap),
  saveIdiom: (data: Partial<Idiom>) =>
    http()
      .post("/v2/edu/idiom/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deleteIdiom: (idiomId: number) =>
    http()
      .delete(`/v2/edu/idiom/delete/${idiomId}`)
      .then<boolean>(unwrap),
  /** 成语接龙：服务端自动出题（首尾相接），返回起始成语与步数（不含答案） */
  idiomChainStart: (params: { gradeLevel?: string; grade?: string; length?: number } = {}) =>
    http()
      .get("/v2/edu/idiom/chain/start")
      .query(params)
      .then<IdiomChainStart>(unwrap),
  /** 成语接龙：校验一步（答案由服务端判定，前端拿不到答案） */
  idiomChainValidate: (data: { current: string; answer: string }) =>
    http()
      .post("/v2/edu/idiom/chain/validate")
      .data(data as unknown as Record<string, unknown>)
      .then<IdiomChainStep>(unwrap),
  /** 成语接龙：给当前成语一个提示答案 */
  idiomChainHint: (current: string) =>
    http()
      .get("/v2/edu/idiom/chain/hint")
      .query({ current })
      .then<IdiomChainHint>(unwrap),

  // 汉字基础数据（字 / 读音 / 笔顺 / 字画 / 释义）
  /** 分页查询汉字（关键字匹配 字/拼音/释义） */
  pageHanzi: (params: { keyword?: string; gradeLevel?: string; pageNum?: number; pageSize?: number }) =>
    http()
      .get("/v2/edu/hanzi/page")
      .query(params)
      .then<PageResult<EduHanzi>>(unwrap),
  /** 汉字详情 */
  getHanzi: (id: number) =>
    http()
      .get(`/v2/edu/hanzi/${id}`)
      .then<EduHanzi>(unwrap),
  /** 保存汉字（同一个字重复提交则更新） */
  saveHanzi: (data: Partial<EduHanzi>) =>
    http()
      .post("/v2/edu/hanzi/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 删除汉字 */
  deleteHanzi: (id: number) =>
    http()
      .delete(`/v2/edu/hanzi/${id}`)
      .then<boolean>(unwrap),
  /** 汉字识字练习：服务端自动出题（读音 / 笔画，题目带笔顺与释义） */
  hanziPractice: (params: { gradeLevel?: string; count?: number } = {}) =>
    http()
      .get("/v2/edu/hanzi/practice")
      .query(params)
      .then<HanziQuestion[]>(unwrap),

  // 词语库（整词 / 读音 / 释义 / 造句 / 近义 / 反义 / 同音）
  /** 分页查询词语（关键字匹配 整词/拼音/无声调拼音/释义/近义/反义/同音） */
  pageWords: (params: {
    keyword?: string;
    gradeLevel?: string;
    kind?: string;
    pageNum?: number;
    pageSize?: number;
  }) =>
    http()
      .get("/v2/edu/word/page")
      .query(params)
      .then<PageResult<EduWord>>(unwrap),
  /** 词语详情 */
  getWord: (id: number) =>
    http()
      .get(`/v2/edu/word/${id}`)
      .then<EduWord>(unwrap),
  /** 保存词语（同一个词重复提交则更新） */
  saveWord: (data: Partial<EduWord>) =>
    http()
      .post("/v2/edu/word/save")
      .data(data as unknown as Record<string, unknown>)
      .then<number>(unwrap),
  /** 删除词语 */
  deleteWord: (id: number) =>
    http()
      .delete(`/v2/edu/word/${id}`)
      .then<boolean>(unwrap),
  /**
   * 词语关联检索（列表右键菜单）。
   *
   * mode: similar 相似 / antonym 反向 / homophone 同音 / pinyin 同音字词 / sentence 造句 / char 含相同字
   */
  relatedWords: (params: { wordId: number; mode: string }) =>
    http()
      .get("/v2/edu/word/related")
      .query(params)
      .then<WordRelatedResult>(unwrap),

  // 古诗库与古诗游戏（补全下句）
  listPoems: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/poem/list")
      .query(params)
      .then<Poem[]>(unwrap),
  /** 分页查询古诗（服务端分页：关键字/学段过滤 + 全库 total，替代前端 count=5000 全量拉取） */
  pagePoems: (params: { keyword?: string; gradeLevel?: string; grade?: string; pageNum?: number; pageSize?: number }) =>
    http()
      .get("/v2/edu/poem/page")
      .query(params)
      .then<PageResult<Poem>>(unwrap),
  generatePoemGame: (params: { gradeLevel?: string; grade?: string; count?: number }) =>
    http()
      .get("/v2/edu/poem/game/generate")
      .query(params)
      .then<PoemGameData>(unwrap),
  getPoemDetail: (poemId: number) =>
    http()
      .get(`/v2/edu/poem/detail/${poemId}`)
      .then<Poem>(unwrap),
  savePoem: (data: Partial<Poem>) =>
    http()
      .post("/v2/edu/poem/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deletePoem: (poemId: number) =>
    http()
      .delete(`/v2/edu/poem/delete/${poemId}`)
      .then<boolean>(unwrap),

  // 古诗文趣味游戏（七种玩法，见 EduPoemChallengeController）
  poemChallenge: (
    mode: PoemChallengeMode,
    params: { gradeLevel?: string; grade?: string; keyword?: string; count?: number },
  ) =>
    http()
      .get(`/v2/edu/poem-challenge/${mode}`)
      .query(params)
      .then<PoemChallengeData>(unwrap),
  poemChallengeKeywords: () =>
    http()
      .get("/v2/edu/poem-challenge/keywords")
      .then<string[]>(unwrap),

  // 昆虫图鉴（后端 EduInsectController；数据源自开源项目 insect-world，63 种 / 14 个目）
  insectLibrary: () =>
      http()
        .get("/v2/edu/insect/all")
        .then<InsectLibraryItem[]>(unwrap),
  insectStage: (insectCode: string) =>
    http()
      .get("/v2/edu/insect/stage")
      .query({ insectCode })
      .then<InsectStageView>(unwrap),
  insectGuide: (insectCode: string) =>
    http()
      .get(`/v2/edu/insect/guide/${insectCode}`)
      .then<InsectGuideView>(unwrap),
  saveInsectGuide: (data: InsectGuideSaveRequest) =>
    http()
      .post("/v2/edu/insect/guide/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  listInsects: (params: { order?: string; metamorphosis?: string; maxDifficulty?: number; count?: number }) =>
    http()
      .get("/v2/edu/insect/list")
      .query(params)
      .then<Insect[]>(unwrap),
  insectOrders: () =>
    http()
      .get("/v2/edu/insect/orders")
      .then<InsectOrderCount[]>(unwrap),
  generateInsectGame: (params: { order?: string; metamorphosis?: string; maxDifficulty?: number; count?: number }) =>
    http()
      .get("/v2/edu/insect/game/generate")
      .query(params)
      .then<InsectGameData>(unwrap),
  validateInsectPair: (data: { insectId: number; latin: string }) =>
    http()
      .post("/v2/edu/insect/game/validate")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  // /detail 与 /stage 返回同一形态的详情视图：四个 JSON 列都已解析成数组，
  // 所以这里返回 InsectDetail（数组）而不是落库契约 Insect（JSON 字符串）。
  // 保存走 saveInsect，那才是字符串形态。
  getInsectDetail: (insectId: number) =>
    http()
      .get(`/v2/edu/insect/detail/${insectId}`)
      .then<InsectDetail>(unwrap),
  saveInsect: (data: Partial<Insect>) =>
    http()
      .post("/v2/edu/insect/save")
      .data(data as unknown as Record<string, unknown>)
      .then<boolean>(unwrap),
  deleteInsect: (insectId: number) =>
    http()
      .delete(`/v2/edu/insect/delete/${insectId}`)
      .then<boolean>(unwrap),

  /**
   * 指定学段的模块清单（学生端首页用）。
   * 后台在「模块配置」里按学段增删改排序，学生端不需要改代码。
   *
   * @param gradeLevel PRIMARY / JUNIOR / SENIOR
   */
  funModules: (gradeLevel: string) =>
    http()
      .get("/v2/edu/fun/modules")
      .query({ gradeLevel })
      .then<FunModuleConfig[]>(unwrap),
  /**
   * 门户菜单清单（含停用项，学生端/教师端用）。
   *
   * <p>只返回编码/名称/路径/学段/启停/排序，用来区分「从没配过」与「全部停用」，
   * 并过滤「全部功能」里的停用入口；不含 configJson 等管理端信息。</p>
   *
   * @param level PRIMARY / JUNIOR / SENIOR / TEACHER
   */
  portalMenu: (level: string) =>
    http()
      .get("/v2/edu/fun/portal-menu")
      .query({ level })
      .then<FunModuleConfig[]>(unwrap),
};
