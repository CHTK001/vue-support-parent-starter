export interface JobFieldGuideLink {
  label: string;
  url: string;
}

export interface JobFieldGuideMedia {
  title: string;
  src: string;
  caption: string;
}

export interface JobFieldGuideDefinition {
  fieldKey: string;
  fieldLabel: string;
  headline: string;
  description: string;
  bullets: string[];
  example?: string;
  media: JobFieldGuideMedia[];
  links?: JobFieldGuideLink[];
}

interface JobFieldGuideContext {
  fieldKey: string;
  form?: Record<string, any>;
  executorData?: Array<Record<string, any>>;
}

const GUIDE_MEDIA = {
  basic: {
    title: "任务基础配置示意",
    src: "/guide-images/job-basic-config.png",
    caption: "基础配置页主要确定任务归属、运行模式和执行入口名称。",
  },
  schedule: {
    title: "任务调度配置示意",
    src: "/guide-images/job-schedule-config.png",
    caption: "调度配置页用于选择触发方式、配置 Cron 或固定间隔，并填写运行参数。",
  },
  advanced: {
    title: "任务高级策略示意",
    src: "/guide-images/job-advanced-config.png",
    caption: "高级配置页控制路由、过期策略、阻塞策略、超时、重试和子任务编排。",
  },
} as const;

function mediaOf(section: "basic" | "schedule" | "advanced") {
  return [GUIDE_MEDIA[section]];
}

function currentExecutorName(executorData?: Array<Record<string, any>>, monitorId?: any) {
  if (!executorData?.length || monitorId == null) {
    return "";
  }
  const executor = executorData.find((item) => item.monitorId == monitorId);
  return executor?.monitorName || "";
}

function runtimeModeName(form?: Record<string, any>) {
  return (form?.jobGlueType || "BEAN").toString().toUpperCase();
}

export function getJobFieldGuide({
  fieldKey,
  form,
  executorData,
}: JobFieldGuideContext): JobFieldGuideDefinition | null {
  if (!fieldKey) {
    return null;
  }

  const executorName = currentExecutorName(executorData, form?.monitorId);
  const runtimeMode = runtimeModeName(form);
  const scheduleType = (form?.jobScheduleType || "CRON").toString().toUpperCase();

  switch (fieldKey) {
    case "jobName":
      return {
        fieldKey,
        fieldLabel: "任务名称",
        headline: "先把任务的业务含义写清楚",
        description:
          "任务名称是运营和排障时最先看到的字段，建议直接写成“业务动作 + 条件/周期”的格式，避免只有技术缩写。",
        bullets: [
          "建议控制在 20 到 30 个字内，能一眼看出做什么。",
          "如果同一业务有多条任务，建议把环境、渠道或批次写进名称。",
          "任务名称主要用于管理界面展示，不直接参与执行匹配。",
        ],
        example: "示例: 支付超时订单关闭任务",
        media: mediaOf("basic"),
      };
    case "jobAuthor":
      return {
        fieldKey,
        fieldLabel: "负责人",
        headline: "负责人要能对应到实际维护人",
        description:
          "任务失败、报警和变更时，需要先定位到责任人。这里建议填统一账号、姓名缩写或团队值班标识，不要留空。",
        bullets: [
          "优先填写值班人或模块 owner，避免只写“管理员”。",
          "如果任务跨团队，建议写主责人，协作人放到说明文档。",
          "报警邮件通常也会围绕负责人对应的邮箱组配置。",
        ],
        example: "示例: payment-oncall",
        media: mediaOf("basic"),
      };
    case "jobApplicationActive":
      return {
        fieldKey,
        fieldLabel: "任务环境",
        headline: "环境要和执行器所在实例保持一致",
        description:
          "任务环境用于区分 dev、test、prod 等不同实例集合，避免把测试任务下发到生产执行器。",
        bullets: [
          "开发环境建议只连接开发执行器，生产环境要严格独立。",
          "如果你是复制任务，记得检查环境是否还沿用旧值。",
          "环境字段建议和应用启动 profile 命名一致。",
        ],
        example: "示例: prod",
        media: mediaOf("basic"),
      };
    case "monitorId":
      return {
        fieldKey,
        fieldLabel: "执行器",
        headline: "执行器决定任务最终在哪个应用实例运行",
        description:
          "这里选择的是任务所属的执行器应用。平台负责调度，真正执行任务的是你选中的应用节点。",
        bullets: [
          executorName
            ? `当前已选执行器: ${executorName}。提交前再确认是否选对应用。`
            : "先从下拉框中选择目标执行器，再继续填写运行名称。",
          "执行器必须已经注册在线，否则任务即使保存也无法正常触发。",
          "同一业务最好按应用维度拆开配置，避免误投递到错误实例。",
        ],
        media: mediaOf("basic"),
      };
    case "jobGlueType":
      return {
        fieldKey,
        fieldLabel: "运行模式",
        headline: "运行模式决定平台如何解释你的任务入口",
        description:
          "BEAN 模式适合调用后端已注册的任务处理器；GLUE 模式通常表示脚本或动态代码执行，要求对应执行器具备相应能力。",
        bullets: [
          "通用业务任务优先使用 BEAN，最稳定也最容易治理。",
          "只有在你明确需要 Shell、Python、NodeJs 或动态脚本时再切换到 GLUE 模式。",
          `当前模式会影响“运行名称”的填写方式，当前为 ${runtimeMode}。`,
        ],
        example: "示例: BEAN",
        media: mediaOf("basic"),
        links: [
          {
            label: "Quartz Cron 参考",
            url: "https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html",
          },
        ],
      };
    case "jobExecuteBean":
      return {
        fieldKey,
        fieldLabel: "运行名称",
        headline: "运行名称必须能被执行器准确识别",
        description:
          runtimeMode === "BEAN"
            ? "BEAN 模式下，这里通常填写后端注册的任务处理器名称，也就是执行器收到调度请求后要调用的 handler key。"
            : "GLUE 模式下，这里建议填写脚本标识、入口名或后端约定的执行名称，确保执行器能把请求路由到对应脚本实现。",
        bullets: [
          "这个字段是真正参与执行匹配的关键值，不能只写展示名。",
          "如果后端用了 @Job 或统一 handler 注册，这里应和注册名保持一致。",
          "改错一个字符就会导致触发成功但执行器找不到目标处理器。",
        ],
        example:
          runtimeMode === "BEAN"
            ? "示例: payment-order-timeout"
            : "示例: job_scripts/payment-cleanup.py",
        media: mediaOf("basic"),
      };
    case "jobAlarmEmail":
      return {
        fieldKey,
        fieldLabel: "报警邮件",
        headline: "报警邮箱用于兜底通知，不要只填个人邮箱",
        description:
          "任务失败、重试耗尽或执行异常时，报警会按这里的邮箱列表发送。建议优先填团队邮箱或告警组地址。",
        bullets: [
          "多个地址用英文逗号分隔。",
          "如果任务非常关键，建议配置团队组 + 主责人双重接收。",
          "不依赖邮件告警的平台，也建议保留一个可追溯邮箱组。",
        ],
        example: "示例: payment-oncall@example.com,devops@example.com",
        media: mediaOf("basic"),
      };
    case "jobScheduleType":
      return {
        fieldKey,
        fieldLabel: "调度类型",
        headline: "先决定任务是 Cron、固定频率还是暂不调度",
        description:
          "调度类型决定平台如何计算下次触发时间。Cron 适合规则时间点，固定速率适合轮询型任务，NONE 适合暂存配置但不自动执行。",
        bullets: [
          "Cron 适合每天、每小时、每周等固定时点任务。",
          "固定速率适合每隔 N 秒执行一次的轮询型任务。",
          "如果只是先录入任务但暂时不上线，可以先设为 NONE。",
        ],
        example: "示例: CRON",
        media: mediaOf("schedule"),
      };
    case "jobScheduleTime":
      return {
        fieldKey,
        fieldLabel: scheduleType === "FIX_RATE" ? "间隔时间" : "Cron表达式",
        headline:
          scheduleType === "FIX_RATE"
            ? "固定速率任务要明确轮询间隔"
            : "Cron 表达式决定任务的精确触发时间",
        description:
          scheduleType === "FIX_RATE"
            ? "固定速率模式下，这里填写两个执行周期之间的间隔秒数。值越小，触发越频繁，对执行器压力也越大。"
            : "Cron 模式下建议直接用弹出的规则生成器填写，不要手写复杂表达式后再猜测执行时间。",
        bullets: [
          scheduleType === "FIX_RATE"
            ? "先从 30 秒、60 秒这类保守值开始，再按业务实时性调小。"
            : "优先用可视化生成器生成，再回看表达式是否符合预期。",
          scheduleType === "FIX_RATE"
            ? "如果任务执行时间可能超过间隔时间，要同步关注阻塞策略。"
            : "复杂表达式上线前至少核对一次下次触发时间。",
          scheduleType === "FIX_RATE"
            ? "秒级任务会明显增加执行器负载，不建议默认就配很小。"
            : "平台使用 Quartz 风格 Cron，包含秒字段。",
        ],
        example:
          scheduleType === "FIX_RATE" ? "示例: 60" : "示例: 0 0/30 * * * ?",
        media: mediaOf("schedule"),
        links:
          scheduleType === "FIX_RATE"
            ? undefined
            : [
                {
                  label: "Quartz Cron 语法",
                  url: "https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html",
                },
              ],
      };
    case "jobExecutorParam":
      return {
        fieldKey,
        fieldLabel: "任务参数",
        headline: "任务参数是调度层传给执行器的业务入参",
        description:
          "这里适合放任务运行时需要的轻量参数，比如时间窗口、批次大小、业务标识。复杂结构建议用 JSON，并和后端约定格式。",
        bullets: [
          "入参要保持可回放，便于失败重试和问题排查。",
          "不建议把大段脚本、证书或超长文本直接塞到参数里。",
          "如果参数会频繁变更，最好在任务说明文档里同步记录含义。",
        ],
        example: '示例: {"batchSize":200,"bizType":"payment"}',
        media: mediaOf("schedule"),
      };
    case "jobExecutorRouteStrategy":
      return {
        fieldKey,
        fieldLabel: "路由策略",
        headline: "路由策略决定多执行器节点时把任务发给谁",
        description:
          "当一个执行器应用下挂了多个实例时，平台会按这里的路由策略选择实际执行节点。",
        bullets: [
          "单实例任务通常保持 FIRST 就够了。",
          "想均摊压力时选 ROUND 或 RANDOM。",
          "对分片任务或广播任务，使用 SHARDING_BROADCAST 前要确保业务本身支持分片执行。",
        ],
        example: "示例: ROUND",
        media: mediaOf("advanced"),
      };
    case "jobExecuteMisfireStrategy":
      return {
        fieldKey,
        fieldLabel: "过期策略",
        headline: "过期策略决定错过调度窗口后怎么补偿",
        description:
          "当调度器或执行器短暂异常、停机恢复、线程堆积时，任务可能错过原本的执行点，这里定义后续处理方式。",
        bullets: [
          "DO_NOTHING 适合幂等要求高但可以接受跳过的任务。",
          "FIRE_ONCE_NOW 适合需要尽快补偿一次的任务。",
          "如果任务执行代价很高，补偿策略要和业务方先确认。",
        ],
        example: "示例: FIRE_ONCE_NOW",
        media: mediaOf("advanced"),
      };
    case "jobExecutorBlockStrategy":
      return {
        fieldKey,
        fieldLabel: "阻塞策略",
        headline: "阻塞策略用来处理“上一次还没跑完，下一次又到了”",
        description:
          "当任务执行耗时超过调度间隔时，新触发会和旧执行重叠。这里定义后续调度是排队、丢弃还是覆盖。",
        bullets: [
          "SERIAL_EXECUTION 最稳妥，适合大部分串行任务。",
          "DISCARD_LATER 适合实时性高但允许跳过旧批次的任务。",
          "COVER_EARLY 只适合明确支持中断或覆盖的业务。",
        ],
        example: "示例: SERIAL_EXECUTION",
        media: mediaOf("advanced"),
      };
    case "jobExecutorTimeout":
      return {
        fieldKey,
        fieldLabel: "超时时间",
        headline: "超时阈值要比正常执行时间略宽，不要拍脑袋",
        description:
          "超时时间用于防止任务长时间挂死。一般建议参考历史执行耗时，设置成正常耗时的 2 到 3 倍。",
        bullets: [
          "0 表示不限制，只建议用于极少数长任务。",
          "如果任务依赖外部接口，超时阈值要覆盖网络波动范围。",
          "超时不是越短越好，过短会制造大量误报和无效重试。",
        ],
        example: "示例: 300",
        media: mediaOf("advanced"),
      };
    case "jobExecutorFailRetryCount":
      return {
        fieldKey,
        fieldLabel: "重试次数",
        headline: "重试次数只解决瞬时故障，不能替代幂等设计",
        description:
          "任务失败后的自动重试次数。适合网络抖动、依赖服务偶发超时等短暂故障，不适合处理业务数据本身有问题的情况。",
        bullets: [
          "关键任务可以配 1 到 3 次，避免失败即丢。",
          "重试前提是任务本身必须幂等，否则可能造成重复处理。",
          "如果失败一定需要人工介入，重试次数就不要配太大。",
        ],
        example: "示例: 2",
        media: mediaOf("advanced"),
      };
    case "childJobId":
      return {
        fieldKey,
        fieldLabel: "子任务ID",
        headline: "子任务用于编排顺序，不建议随意串联",
        description:
          "当前任务执行完成后，平台会尝试触发这里配置的后续任务。适合明确的编排链路，不适合拿来做复杂流程引擎。",
        bullets: [
          "多个子任务用英文逗号分隔。",
          "子任务要确认已经存在并且执行顺序可接受。",
          "如果上下游存在失败补偿关系，建议先在测试环境整链路验证。",
        ],
        example: "示例: 1024,1025",
        media: mediaOf("advanced"),
      };
    default:
      return null;
  }
}
