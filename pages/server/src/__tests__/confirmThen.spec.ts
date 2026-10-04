/**
 * 确认框「取消」语义的回归门禁。
 *
 * <p>这个门禁针对的是一个<b>已发生的真实缺陷</b>：{@code message.confirm}
 * 在取消时走 {@code .catch(() => reject(false))}，也就是抛异常而不是返回
 * {@code false}。原 {@code ScServiceManage.onDelete} 写成
 * {@code await message.confirm(...)} 且没有 try/catch，于是<b>用户每点一次
 * 「取消」就产生一个未捕获的 Promise rejection</b>。</p>
 *
 * <p>为什么编译与构建全绿：未捕获的 rejection 不是类型错误，也不是构建错误，
 * 它只在浏览器控制台里出现。TypeScript 层面 {@code await confirm()} 的返回值
 * 甚至被推断为 {@code void}，没有任何东西会提醒你少了返回值判断。</p>
 *
 * <p>最危险的一种「看起来正确」的写法是
 * {@code if (await message.confirm(...)) { delete() }} —— 取消时直接抛穿，
 * 后续语句不执行，于是<b>恰好</b>表现得对，于是没人发现这个函数其实靠抛异常
 * 表达「不」。本 spec 的最后一组用例就是防止这种写法回流。</p>
 */
import { describe, expect, it, vi } from "vitest";
import { confirmThen } from "../utils/confirmThen";

/** 复刻 msgBox 的真实行为：确认 resolve(true)，取消 reject(false) */
function rejectStyleConfirm() {
  return vi.fn().mockRejectedValue(false);
}

/** 复刻 msgBox 的确认分支 */
function resolveStyleConfirm(value: unknown = true) {
  return vi.fn().mockResolvedValue(value);
}

describe("confirmThen 确认分支", () => {
  it("用户点确定返回 true", async () => {
    const confirm = resolveStyleConfirm();
    await expect(confirmThen(confirm, "删除?", "删除服务")).resolves.toBe(true);
  });

  it("参数原样透传给确认框（文案与标题不能丢）", async () => {
    const confirm = resolveStyleConfirm();
    await confirmThen(confirm, "确认删除服务「fs-demo」？", "删除服务");
    expect(confirm).toHaveBeenCalledWith("确认删除服务「fs-demo」？", "删除服务");
  });

  it("确认框 resolve 的是 undefined 也算确认（只看是否抛错，不看返回值）", async () => {
    // msgBox 的成功分支 resolve(true)，但若将来换成 resolve() 无参，
    // 语义上仍应视为「用户点了确定」，不能误判成取消
    const confirm = vi.fn().mockResolvedValue(undefined);
    await expect(confirmThen(confirm)).resolves.toBe(true);
  });
});

describe("confirmThen 取消分支（本门禁的核心）", () => {
  it("取消（reject false）返回 false", async () => {
    const confirm = rejectStyleConfirm();
    await expect(confirmThen(confirm, "删除?", "删除服务")).resolves.toBe(false);
  });

  it("取消时【不抛异常】—— 这是修复的原缺陷", async () => {
    const confirm = rejectStyleConfirm();
    // 关键断言：rejectStyleConfirm 一定 reject，若 confirmThen 没有兜住，
    // 这里会直接失败并把异常抛到用例外，表现为 unhandled rejection
    let thrown: unknown = null;
    try {
      await confirmThen(confirm);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeNull();
  });

  it("关闭弹窗（ESC / 点遮罩）同样按取消处理", async () => {
    // Element Plus 这两种情况也走同一个 catch 分支，值可能是 'cancel' 或 'close'
    for (const reason of ["cancel", "close", undefined]) {
      const confirm = vi.fn().mockRejectedValue(reason);
      await expect(confirmThen(confirm)).resolves.toBe(false);
    }
  });

  it("确认框自身故障（弹不出来）也按「未获得同意」处理", async () => {
    const confirm = vi.fn().mockRejectedValue(new Error("MessageBox 挂载失败"));
    await expect(confirmThen(confirm)).resolves.toBe(false);
  });
});

describe("confirmThen 不会把取消误判成确认", () => {
  it("返回值必须严格为 boolean，不是 truthy 值", async () => {
    // 回归测试若写成 expect(await confirmThen(c)).toBeTruthy()，
    // 那么把 false 改成任意真值也能通过，判别力为零
    const confirm = rejectStyleConfirm();
    const result = await confirmThen(confirm);
    expect(result).toBe(false);
    expect(typeof result).toBe("boolean");
  });

  it("按「取消」为 false 收口时，破坏性操作不会执行", async () => {
    // 完整复刻 onDelete 的控制流，证明布尔语义下不判断返回值就会误删
    const deleted: number[] = [];
    const remove = async (id: number) => {
      const confirmed = await confirmThen(rejectStyleConfirm(), "删除?");
      if (!confirmed) {
        return;
      }
      deleted.push(id);
    };
    await remove(7001);
    expect(deleted).toEqual([]);
  });

  it("按「确认」为 true 收口时，破坏性操作会执行（对照：上例不是恒不执行）", async () => {
    const deleted: number[] = [];
    const remove = async (id: number) => {
      const confirmed = await confirmThen(resolveStyleConfirm(), "删除?");
      if (!confirmed) {
        return;
      }
      deleted.push(id);
    };
    await remove(7001);
    expect(deleted).toEqual([7001]);
  });
});

describe("confirmThen 对同步抛出的确认框也成立", () => {
  it("确认框同步 throw 时返回 false 而不是抛出", async () => {
    const confirm = vi.fn(() => {
      throw new Error("同步炸了");
    });
    await expect(confirmThen(confirm as never)).resolves.toBe(false);
  });
});