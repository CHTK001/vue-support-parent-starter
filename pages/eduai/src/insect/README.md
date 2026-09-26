# 昆虫识图 —— 如何自己添加昆虫

本文档说明如何往「昆虫识图」里加自己的物种。

当前内置 63 个物种，来自开源项目 [insect-world](https://github.com/xr843/insect-world)（MIT）。
自有物种与内置物种走完全相同的机制，没有"内置/外置"之分。

---

## 一、先理解两个身份

一个物种有**两个 slug**，必须分清：

| 身份 | 字段 | 作用 |
|---|---|---|
| 数据身份 | `edu_insect.insect_code` | 取哪条讲解与详情、记哪条笔记、URL 里的标识 |
| 建模身份 | `edu_insect.insect_model_code` | 加载哪套 3D 几何、哪套生活史阶段模型、哪套动作 |

`insect_model_code` 为**空**时，建模身份 = 数据身份（用自己 slug 的建模文件）。
**指定**它，就复用了另一个物种的模型 —— 这是"不写 three.js 也能加物种"的关键。

---

## 二、三种添加方式

### 方式 A：只加数据，复用已有模型（推荐先走这条）

适用于形态与某个内置物种相近的情况。**完全不需要写代码。**

1. 往 `edu_insect` 插一条，`insect_model_code` 填被复用物种的 slug；
2. 往 `edu_insect_guide` 插对应的讲解与测验；
3. 刷新页面即可看到。

关键约束：**`insect_hotspots` 里每个 `anchor` 必须存在于被复用的那套模型里**。
可用的 anchor 取值见被复用物种自己的 `insect_hotspots`（例如借用 `honeybee`
模型，可用 `stinger` / `wing` / `eye` / `antenna` / `thorax` / `pollenBasket`）。
用了不存在的 anchor，那个标注点不会显示（不会报错，只是静默不出现）。

参考实现见本文末尾的 SQL 模板。

### 方式 B：写一个自己的建模文件

形态与现有物种差得远时，需要自己写程序化建模。

1. 在 `pages/eduai/src/insect/three/builders/` 下新建 `<你的slug>.ts`；
2. 导出**任意以 `build` 开头**的函数，返回 `InsectModel`；
3. 不用注册 —— `registry.ts` 用 `import.meta.glob('./builders/*.ts')` 在构建期
   自动扫描该目录，文件放进去就生效（这也是为什么文件名必须等于 slug）。

最小骨架：

```ts
import * as THREE from 'three'
import { finalize, type InsectModel } from './kit'

/** 我的物种 */
export function buildMyInsect(): InsectModel {
  const group = new THREE.Group()

  // 用 kit 提供的构件拼装：loft / spindle / elytra / antennaPair /
  // legPair / compoundEyePair / chitin ...
  // 完整能力见 three/builders/kit.ts

  // 标注点：key 必须与 edu_insect.insect_hotspots 的 anchor 一致
  const anchors: Record<string, THREE.Vector3> = {
    head: new THREE.Vector3(0, 0, 0.4),
  }

  return finalize({ group, anchors, radius: 1 })
}
```

`InsectModel` 的字段（`kit.ts`）：

| 字段 | 必填 | 说明 |
|---|---|---|
| `group` | 是 | 模型根节点 |
| `anchors` | 是 | 标注点锚位，key 对应 hotspot.anchor |
| `radius` | 是 | 包围球半径，用于全身取景 |
| `frameRadius` | 否 | 取景专用半径；缺省= radius（触角/尾须特别长的物种才需要） |
| `rig` | 否 | 骨架，`finalize()` 会从带 `userData` 标记的部件自动收集 |

不需要自己写相机、灯光、渲染循环 —— `InsectStage3D.vue` 全包了，
取景距离用 `three/framing.ts` 的覆盖率反解，细长虫与圆虫走同一条判据。

### 方式 C：连生活史阶段模型一起做

阶段模型放在 `pages/eduai/src/insect/three/builders/stages/`，命名规则是
`<物种slug>-<阶段>.ts`，阶段取 `egg` / `larva` / `pupa` / `nymph`。
登记表在 `three/stages.ts` 的 `hasStage` / `loadStageModel`。

只有做了模型的阶段，前端生活史按钮才可点（没做的显示为禁用，并有"暂无模型"提示）。

---

## 三、注意事项

1. **加完数据要重启后端**，前端刷新即可。
2. **没建模的物种不会出现在名录里**。数据加了但模型没做时，页面顶部会显示
   "另有 N 种未建模"，不会被静默吞掉，也不会出现点开报错的条目。
3. **`insect_difficulty`** 仅用于旧的配对玩法筛选，与 3D 图鉴无关。
4. **讲解步骤的 anchor** 同样要与模型对齐 —— 讲解切换时镜头会对到该部位；
   anchor 不存在时镜头退回全身取景，不会报错。
5. 三个 JSON 列（`insect_facts` / `insect_hotspots` / `insect_lifecycle` /
   `insect_relatives`）在库里是 TEXT，服务层解析后下发；格式写错会让该字段变空数组，
   不会 500。

---

## 四、SQL 模板（方式 A）

以"中华蜜蜂复用西方蜜蜂模型"为例：

```sql
INSERT INTO edu_insect (
  insect_code, insect_name, insect_latin, insect_epithet, insect_order, insect_summary,
  insect_facts, insect_hotspots, insect_ecology, insect_trivia, insect_metamorphosis,
  insect_lifecycle, insect_range, insect_status, insect_relatives, insect_accent,
  insect_model_code, insect_difficulty)
SELECT 'apis-cerana', '中华蜜蜂', 'Apis cerana', '会认路的东方采蜜者', 'hymenoptera',
  '中华蜜蜂是东亚常见的本土蜂种，蜂群规模比西方蜜蜂小，但更耐寒、更善于利用零星蜜源。',
  '[{"key":"体长","value":"工蜂约10–13毫米","icon":"size"},
    {"key":"寿命","value":"夏季工蜂约5–7周","icon":"time"},
    {"key":"栖息环境","value":"树洞、岩缝、人工蜂箱","icon":"place"},
    {"key":"食性","value":"采集花蜜与花粉","icon":"food"},
    {"key":"通讯","value":"以摆尾舞传递蜜源方位","icon":"ability"},
    {"key":"耐寒","value":"比西方蜜蜂更耐低温，可提早出巢","icon":"ability"}]',
  '[{"id":"apis-cerana-stinger","label":"螫针","note":"工蜂的螫针带倒钩，蜇后自身会受伤","anchor":"stinger","tone":"amber"},
    {"id":"apis-cerana-wing","label":"翅","note":"前后翅以翅钩列连锁成一片","anchor":"wing","tone":"coral"},
    {"id":"apis-cerana-eye","label":"复眼","note":"能感知紫外光，辨认花朵上的导蜜纹","anchor":"eye","tone":"sage"},
    {"id":"apis-cerana-antenna","label":"触角","note":"感知气味与振动","anchor":"antenna","tone":"amber"},
    {"id":"apis-cerana-thorax","label":"胸部","note":"着生两对翅与三对足","anchor":"thorax","tone":"lavender"},
    {"id":"apis-cerana-pollen","label":"花粉篮","note":"后足胫节用于携带花粉团","anchor":"pollenBasket","tone":"lavender"}]',
  '本土传粉者，对零星蜜源与低温环境的适应性强。',
  '中华蜜蜂能利用西方蜜蜂不愿出巢的低温时段采蜜。',
  'complete', '["卵","幼虫","蛹","成虫"]', '中国及东亚多地', '常见，本土蜂种',
  '["西方蜜蜂","熊蜂"]', '#c2941f',
  'honeybee', 2                                  -- ← 复用西方蜜蜂模型
WHERE NOT EXISTS (SELECT 1 FROM edu_insect WHERE insect_code = 'apis-cerana');

INSERT INTO edu_insect_guide (
  insect_code, guide_lesson, guide_motion_title, guide_motion_body,
  guide_quiz, guide_habitat_title, guide_habitat_body)
SELECT 'apis-cerana',
  '[{"title":"和西方蜜蜂的区别","body":"蜂群规模较小，但更耐寒、更善于利用零散蜜源。","anchor":"antenna"},
    {"title":"怎么认路","body":"靠太阳角度与体内生物钟校准方向。"},
    {"title":"本土传粉价值","body":"对零星蜜源与低温环境的适应，使它成为本土植物的重要传粉者。","anchor":"pollenBasket"},
    {"title":"蜂群分工","body":"工蜂一生依次承担清巢、育幼、筑巢与采集。","anchor":"thorax"}]',
  '采集与归巢', '工蜂出巢后循气味寻找蜜源，回巢以摆尾舞报告方位与距离。',
  '[{"question":"中华蜜蜂相比西方蜜蜂的主要优势是什么？","options":["体型更大","更耐寒、善用零星蜜源","蜂群规模更大"],"answer":1,"explain":"中华蜜蜂耐低温且能利用分散蜜源。"},
    {"question":"它靠什么传递蜜源方位？","options":["摆尾舞","振翅声","触角触碰"],"answer":0,"explain":"蜜蜂以摆尾舞的角度与时长编码方位和距离。"}]',
  '本土花丛与蜂箱', '树洞、岩缝或人工蜂箱营巢，终年不冬眠。'
WHERE NOT EXISTS (SELECT 1 FROM edu_insect_guide WHERE insect_code = 'apis-cerana');
```

`icon` 取值：`size` / `weight` / `time` / `place` / `food` / `ability`
`tone` 取值：`coral` / `sage` / `amber` / `lavender`

---

## 五、关于内置数据的来源与许可

63 个内置物种与其讲解、测验来自 insect-world，**MIT 许可**。
`three/builders/` 下的建模代码保留了上游原始文件头（含作者与说明）。
若二次分发本模块，请一并保留该许可声明。
