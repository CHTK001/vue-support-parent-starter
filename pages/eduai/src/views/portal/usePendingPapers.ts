/**
 * usePendingPapers —— 本班「待完成试卷」数（三个学段首页提醒条共用的数据源）
 *
 * <p>「待完成」= 布置给本班的卷子中没有对应本人阅卷任务（markingTaskPaperId
 * 对不上），与 StudentPapersView 的「开始作答 / 查看结果」判断同口径。
 * 任一接口失败都保持安静：沿用上一次结果，不弹错误、不造数字。</p>
 */
import { onMounted, ref, watch } from "vue";
import type { StudentOverview } from "../../api/types";
import { eduaiApi } from "../../api/eduaiApi";

/**
 * @param overview 取当前学生 overview 的 getter（宿主在关模块回首页 /
 * 标签页回前台时会静默刷新它，届时待完成数跟着重算）
 * @returns pendingPapers：待完成试卷数，> 0 时首页显示「去做试卷」提醒条
 */
export function usePendingPapers(overview: () => StudentOverview | null) {
  const pendingPapers = ref(0);

  async function loadPendingPapers(): Promise<void> {
    try {
      const papers = (await eduaiApi.myClassPapers()) || [];
      const tasks = (await eduaiApi.studentMarkingTasks(50)) || [];
      const done = new Set(tasks.map((t) => t.markingTaskPaperId));
      pendingPapers.value = papers.filter((p) => !done.has(p.paperId)).length;
    } catch {
      // 静默降级：首页的提醒条不该因为一次接口抖动报错
    }
  }

  // 首次进首页拉一次；之后 overview 每次被宿主刷新时重算
  onMounted(() => {
    void loadPendingPapers();
  });
  watch(overview, () => {
    void loadPendingPapers();
  });

  return { pendingPapers };
}
