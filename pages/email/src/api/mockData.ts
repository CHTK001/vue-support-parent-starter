import { EmailAccount, EmailFolder, EmailInfo, EmailLabel } from "../types";
// 模拟邮箱账户数据
export const emailAccounts: EmailAccount[] = [
  {
    emailAccountId: "1",
    emailAccountName: "工作邮箱",
    emailAccountAddress: "work@example.com",
    emailAccountProvider: "Gmail",
    emailAccountColor: "#4285F4",
    emailAccountAvatar: "https://cdn-icons-png.flaticon.com/512/281/281769.png",
    emailAccountSignature: "<p>Best Regards,<br>John Doe<br>Marketing Manager</p>",
    emailAccountUnreadCount: 5,
  },
  {
    emailAccountId: "2",
    emailAccountName: "个人邮箱",
    emailAccountAddress: "personal@example.com",
    emailAccountProvider: "Outlook",
    emailAccountColor: "#0078D4",
    emailAccountAvatar: "https://cdn-icons-png.flaticon.com/512/732/732223.png",
    emailAccountSignature: "<p>Thanks,<br>John</p>",
    emailAccountUnreadCount: 2,
  },
  {
    emailAccountId: "3",
    emailAccountName: "备用邮箱",
    emailAccountAddress: "backup@example.com",
    emailAccountProvider: "163邮箱",
    emailAccountColor: "#D44638",
    emailAccountAvatar: "https://cdn-icons-png.flaticon.com/512/5968/5968534.png",
    emailAccountSignature: "<p>Sent from my backup email</p>",
    emailAccountUnreadCount: 0,
  },
];

// 模拟邮件文件夹数据
export const emailFolders: EmailFolder[] = [
  {
    emailFolderId: "inbox",
    emailFolderName: "收件箱",
    emailFolderIcon: "ri:inbox-line",
    emailFolderCount: 12,
    emailFolderType: "system",
  },
  {
    emailFolderId: "sent",
    emailFolderName: "已发送",
    emailFolderIcon: "ri:send-plane-line",
    emailFolderCount: 45,
    emailFolderType: "system",
  },
  {
    emailFolderId: "drafts",
    emailFolderName: "草稿箱",
    emailFolderIcon: "ri:draft-line",
    emailFolderCount: 3,
    emailFolderType: "system",
  },
  {
    emailFolderId: "starred",
    emailFolderName: "已加星标",
    emailFolderIcon: "ri:star-line",
    emailFolderCount: 7,
    emailFolderType: "system",
  },
  {
    emailFolderId: "important",
    emailFolderName: "重要邮件",
    emailFolderIcon: "ri:bookmark-line",
    emailFolderCount: 5,
    emailFolderType: "system",
  },
  {
    emailFolderId: "spam",
    emailFolderName: "垃圾邮件",
    emailFolderIcon: "ri:spam-2-line",
    emailFolderCount: 8,
    emailFolderType: "system",
  },
  {
    emailFolderId: "trash",
    emailFolderName: "已删除",
    emailFolderIcon: "ri:delete-bin-line",
    emailFolderCount: 10,
    emailFolderType: "system",
  },
  {
    emailFolderId: "work",
    emailFolderName: "工作项目",
    emailFolderIcon: "ri:folder-line",
    emailFolderCount: 15,
    emailFolderType: "custom",
  },
  {
    emailFolderId: "personal",
    emailFolderName: "个人事务",
    emailFolderIcon: "ri:folder-line",
    emailFolderCount: 6,
    emailFolderType: "custom",
  },
];

// 模拟邮件标签数据
export const emailLabels: EmailLabel[] = [
  {
    emailLabelId: "work",
    emailLabelName: "工作",
    emailLabelColor: "#4285F4",
    emailLabelCount: 24,
  },
  {
    emailLabelId: "personal",
    emailLabelName: "个人",
    emailLabelColor: "#34A853",
    emailLabelCount: 12,
  },
  {
    emailLabelId: "urgent",
    emailLabelName: "紧急",
    emailLabelColor: "#EA4335",
    emailLabelCount: 5,
  },
  {
    emailLabelId: "bills",
    emailLabelName: "账单",
    emailLabelColor: "#FBBC05",
    emailLabelCount: 8,
  },
  {
    emailLabelId: "social",
    emailLabelName: "社交",
    emailLabelColor: "#9C27B0",
    emailLabelCount: 15,
  },
];

// 模拟邮件数据
export const emailMessages: EmailInfo[] = [
  {
    emailId: "1",
    emailSubject: "项目进度报告 - 2023年第二季度",
    emailContent: `<p>尊敬的团队成员：</p>
    <p>附件是我们2023年第二季度的项目进度报告，请查收并提供反馈。</p>
    <p>报告中包含了所有关键指标和里程碑的完成情况，以及下一季度的计划。</p>
    <p>如有任何问题，请随时联系我。</p>
    <p>谢谢！</p>`,
    emailSender: {
      emailName: "张经理",
      emailAddress: "manager@company.com",
      emailAvatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    emailRecipients: {
      emailTo: [{ emailName: "工作邮箱", emailAddress: "work@example.com" }],
      emailCc: [
        { emailName: "李总监", emailAddress: "director@company.com" },
        { emailName: "王助理", emailAddress: "assistant@company.com" },
      ],
    },
    emailAttachments: [
      {
        emailAttachmentId: "a1",
        emailAttachmentName: "项目进度报告-2023Q2.pdf",
        emailAttachmentSize: 2500000,
        emailAttachmentType: "application/pdf",
        emailAttachmentUrl: "#",
      },
      {
        emailAttachmentId: "a2",
        emailAttachmentName: "财务数据.xlsx",
        emailAttachmentSize: 1800000,
        emailAttachmentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        emailAttachmentUrl: "#",
      },
    ],
    emailDate: "2023-07-15T10:30:00",
    emailIsRead: false,
    emailIsStarred: true,
    emailIsImportant: true,
    emailLabels: ["work", "urgent"],
    emailFolder: "inbox",
    emailAccountId: "1",
  },
  {
    emailId: "2",
    emailSubject: "周末聚会邀请",
    emailContent: `<p>嗨！</p>
    <p>我们计划在本周六晚上7点在我家举办一个小型聚会，希望你能来参加。</p>
    <p>会有烧烤、饮料和游戏，请随意带上你喜欢的食物或饮料。</p>
    <p>请回复确认你是否能来，期待见到你！</p>`,
    emailSender: {
      emailName: "李朋友",
      emailAddress: "friend@personal.com",
      emailAvatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    emailRecipients: {
      emailTo: [{ emailName: "个人邮箱", emailAddress: "personal@example.com" }],
      emailCc: [{ emailName: "共同好友", emailAddress: "mutual@friend.com" }],
    },
    emailDate: "2023-07-14T18:45:00",
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: false,
    emailLabels: ["personal", "social"],
    emailFolder: "inbox",
    emailAccountId: "2",
  },
  {
    emailId: "3",
    emailSubject: "您的月度账单已生成",
    emailContent: `<p>尊敬的客户：</p>
    <p>您的7月份账单已生成，请在到期日前完成支付。</p>
    <p>账单摘要：</p>
    <ul>
      <li>账单金额：¥1,250.00</li>
      <li>到期日：2023年8月10日</li>
      <li>账单编号：INV-20230715-001</li>
    </ul>
    <p>您可以通过我们的网站或移动应用程序查看详细账单并完成支付。</p>
    <p>如有任何疑问，请联系我们的客户服务团队。</p>`,
    emailSender: {
      emailName: "账单服务",
      emailAddress: "billing@service.com",
      emailAvatar: "https://cdn-icons-png.flaticon.com/512/1077/1077976.png",
    },
    emailRecipients: {
      emailTo: [{ emailName: "个人邮箱", emailAddress: "personal@example.com" }],
    },
    emailAttachments: [
      {
        emailAttachmentId: "a3",
        emailAttachmentName: "7月账单.pdf",
        emailAttachmentSize: 1200000,
        emailAttachmentType: "application/pdf",
        emailAttachmentUrl: "#",
      },
    ],
    emailDate: "2023-07-15T08:00:00",
    emailIsRead: false,
    emailIsStarred: false,
    emailIsImportant: true,
    emailLabels: ["bills"],
    emailFolder: "inbox",
    emailAccountId: "2",
  },
  {
    emailId: "4",
    emailSubject: "新产品发布会邀请",
    emailContent: `<p>尊敬的合作伙伴：</p>
    <p>我们诚挚地邀请您参加我们即将举行的新产品发布会。</p>
    <p>时间：2023年8月5日 下午2:00</p>
    <p>地点：科技园区会议中心</p>
    <p>在发布会上，我们将展示我们最新的创新产品和解决方案，并有机会与行业专家交流。</p>
    <p>请通过回复此邮件确认您的出席情况。</p>
    <p>期待您的参与！</p>`,
    emailSender: {
      emailName: "市场部",
      emailAddress: "marketing@partner.com",
      emailAvatar: "https://randomuser.me/api/portraits/men/3.jpg",
    },
    emailRecipients: {
      emailTo: [{ emailName: "工作邮箱", emailAddress: "work@example.com" }],
    },
    emailDate: "2023-07-13T14:20:00",
    emailIsRead: true,
    emailIsStarred: true,
    emailIsImportant: false,
    emailLabels: ["work"],
    emailFolder: "inbox",
    emailAccountId: "1",
  },
  {
    emailId: "5",
    emailSubject: "简历投递 - 高级前端开发工程师",
    emailContent: `<p>尊敬的招聘团队：</p>
    <p>我对贵公司招聘的高级前端开发工程师职位非常感兴趣，特此投递我的简历。</p>
    <p>我有5年的前端开发经验，精通Vue、React等前端框架，并有丰富的大型项目经验。</p>
    <p>附件是我的详细简历，期待有机会与您进一步交流。</p>
    <p>谢谢！</p>`,
    emailSender: {
      emailName: "求职者",
      emailAddress: "applicant@email.com",
      emailAvatar: "https://randomuser.me/api/portraits/men/4.jpg",
    },
    emailRecipients: {
      emailTo: [{ emailName: "工作邮箱", emailAddress: "work@example.com" }],
    },
    emailAttachments: [
      {
        emailAttachmentId: "a4",
        emailAttachmentName: "个人简历.pdf",
        emailAttachmentSize: 1500000,
        emailAttachmentType: "application/pdf",
        emailAttachmentUrl: "#",
      },
    ],
    emailDate: "2023-07-12T09:15:00",
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: false,
    emailLabels: ["work"],
    emailFolder: "inbox",
    emailAccountId: "1",
  },
  {
    emailId: "6",
    emailSubject: "家庭旅行计划",
    emailContent: `<p>亲爱的家人：</p>
    <p>我已经初步规划了我们下个月的家庭旅行，请查看附件中的行程安排。</p>
    <p>主要景点包括：</p>
    <ul>
      <li>海滨度假村 - 3天</li>
      <li>历史古城 - 2天</li>
      <li>主题公园 - 1天</li>
    </ul>
    <p>请大家查看后提出建议或意见，我们可以根据大家的反馈进行调整。</p>
    <p>爱你们！</p>`,
    emailSender: {
      emailName: "家人",
      emailAddress: "family@personal.com",
      emailAvatar: "https://randomuser.me/api/portraits/women/5.jpg",
    },
    emailRecipients: {
      emailTo: [{ emailName: "个人邮箱", emailAddress: "personal@example.com" }],
      emailCc: [
        { emailName: "爸爸", emailAddress: "dad@family.com" },
        { emailName: "妈妈", emailAddress: "mom@family.com" },
      ],
    },
    emailAttachments: [
      {
        emailAttachmentId: "a5",
        emailAttachmentName: "旅行计划.docx",
        emailAttachmentSize: 1300000,
        emailAttachmentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        emailAttachmentUrl: "#",
      },
      {
        emailAttachmentId: "a6",
        emailAttachmentName: "预算.xlsx",
        emailAttachmentSize: 950000,
        emailAttachmentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        emailAttachmentUrl: "#",
      },
    ],
    emailDate: "2023-07-11T20:30:00",
    emailIsRead: true,
    emailIsStarred: true,
    emailIsImportant: true,
    emailLabels: ["personal"],
    emailFolder: "inbox",
    emailAccountId: "2",
  },
  {
    emailId: "7",
    emailSubject: "系统维护通知",
    emailContent: `<p>尊敬的用户：</p>
    <p>我们计划在本周日（2023年7月16日）凌晨2:00至6:00进行系统维护。</p>
    <p>在此期间，您可能无法访问我们的服务。我们将尽量缩短维护时间，并在完成后立即恢复服务。</p>
    <p>对于给您带来的不便，我们深表歉意。</p>
    <p>如有任何问题，请联系我们的客户支持团队。</p>`,
    emailSender: {
      emailName: "系统管理员",
      emailAddress: "admin@system.com",
      emailAvatar: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
    },
    emailRecipients: {
      emailTo: [{ emailName: "备用邮箱", emailAddress: "backup@example.com" }],
    },
    emailDate: "2023-07-14T16:00:00",
    emailIsRead: false,
    emailIsStarred: false,
    emailIsImportant: true,
    emailLabels: [],
    emailFolder: "inbox",
    emailAccountId: "3",
  },
];

// 模拟已发送邮件
export const emailSentMessages: EmailInfo[] = [
  {
    emailId: "s1",
    emailSubject: "会议纪要 - 产品开发讨论",
    emailContent: `<p>各位团队成员：</p>
    <p>附件是今天产品开发讨论会议的会议纪要，请查阅。</p>
    <p>主要讨论了以下几点：</p>
    <ol>
      <li>新功能开发时间表</li>
      <li>用户反馈的优先处理事项</li>
      <li>下一版本的发布计划</li>
    </ol>
    <p>如有任何问题或补充，请回复此邮件。</p>
    <p>谢谢！</p>`,
    emailSender: {
      emailName: "工作邮箱",
      emailAddress: "work@example.com",
      emailAvatar: "https://cdn-icons-png.flaticon.com/512/281/281769.png",
    },
    emailRecipients: {
      emailTo: [{ emailName: "开发团队", emailAddress: "dev-team@company.com" }],
      emailCc: [{ emailName: "产品经理", emailAddress: "product@company.com" }],
    },
    emailAttachments: [
      {
        emailAttachmentId: "s1a1",
        emailAttachmentName: "会议纪要-20230714.docx",
        emailAttachmentSize: 1100000,
        emailAttachmentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        emailAttachmentUrl: "#",
      },
    ],
    emailDate: "2023-07-14T17:30:00",
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: true,
    emailLabels: ["work"],
    emailFolder: "sent",
    emailAccountId: "1",
  },
  {
    emailId: "s2",
    emailSubject: "回复：周末聚会邀请",
    emailContent: `<p>嗨，李朋友：</p>
    <p>谢谢你的邀请！我很乐意参加周六的聚会。</p>
    <p>我会带一些饮料和甜点。</p>
    <p>期待见到大家！</p>`,
    emailSender: {
      emailName: "个人邮箱",
      emailAddress: "personal@example.com",
      emailAvatar: "https://cdn-icons-png.flaticon.com/512/732/732223.png",
    },
    emailRecipients: {
      emailTo: [{ emailName: "李朋友", emailAddress: "friend@personal.com" }],
    },
    emailDate: "2023-07-14T19:20:00",
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: false,
    emailLabels: ["personal", "social"],
    emailFolder: "sent",
    emailAccountId: "2",
  },
];

// 模拟草稿邮件
export const emailDraftMessages: EmailInfo[] = [
  {
    emailId: "d1",
    emailSubject: "项目合作提案",
    emailContent: `<p>尊敬的王总：</p>
    <p>关于我们之前讨论的项目合作事宜，我们团队已经准备了一份详细的提案，请查阅附件。</p>
    <p>我们希望能够...</p>`,
    emailSender: {
      emailName: "工作邮箱",
      emailAddress: "work@example.com",
      emailAvatar: "https://cdn-icons-png.flaticon.com/512/281/281769.png",
    },
    emailRecipients: {
      emailTo: [{ emailName: "王总", emailAddress: "wang@partner.com" }],
    },
    emailAttachments: [
      {
        emailAttachmentId: "d1a1",
        emailAttachmentName: "项目合作提案.pdf",
        emailAttachmentSize: 3200000,
        emailAttachmentType: "application/pdf",
        emailAttachmentUrl: "#",
      },
    ],
    emailDate: "2023-07-13T11:45:00",
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: true,
    emailLabels: ["work"],
    emailFolder: "drafts",
    emailAccountId: "1",
  },
  {
    emailId: "d2",
    emailSubject: "生日派对计划",
    emailContent: `<p>嗨，朋友们：</p>
    <p>我计划在下个月举办一个生日派对，希望大家能来参加。</p>
    <p>详情如下：</p>`,
    emailSender: {
      emailName: "个人邮箱",
      emailAddress: "personal@example.com",
      emailAvatar: "https://cdn-icons-png.flaticon.com/512/732/732223.png",
    },
    emailRecipients: {
      emailTo: [{ emailName: "朋友群组", emailAddress: "friends@group.com" }],
    },
    emailDate: "2023-07-10T20:15:00",
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: false,
    emailLabels: ["personal", "social"],
    emailFolder: "drafts",
    emailAccountId: "2",
  },
];

// 所有邮件合并
export const allEmails = [...emailMessages, ...emailSentMessages, ...emailDraftMessages];
