export default {
  // ── RAG 未配置拦截（知识库依赖 RAG，未配置不给入口）──
  ragGate: {
    title: '知识库暂不可用',
    desc: '知识库依赖 RAG，请先在「系统配置 → 默认模型」中配置好 RAG 所需的模型与存储参数。',
    goConfig: '去配置',
    fetchFailed: '无法获取 RAG 配置状态，请稍后重试或先完成配置。',
  },

  // ── 共用状态文本 ──
  status: {
    queued: '待上传',
    uploading: '上传中',
    // 磁盘上有原文、但向量库里没有它的分片（上传后未索引 / 进程重启后索引状态丢失）
    uploaded: '待重建索引',
    pending: '等待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    queuedShort: '排队中',
    uploadedShort: '已上传',
  },

  // ── 页面级 (KnowledgeBasePage.vue) ──
  page: {
    title: '知识库',
    subtitle: '管理文档知识库，支持文件上传、分块索引和语义搜索。',
    searchPlaceholder: '搜索知识库',
    docs: '使用说明',
    createKb: '新建知识库',
    tagPublic: '公开',
    tagPrivate: '私有',
    noDescription: '暂无描述',
    enter: '进入',
    readonlyHint: '该知识库为他人公开的只读知识库，可查看与搜索，但不能上传、编辑或删除。',
    notFound: '未找到匹配的知识库',
    empty: '暂无知识库',
    notFoundHint: '尝试调整搜索关键词',
    emptyHint: '点击上方按钮创建第一个知识库',
    backToList: '返回知识库列表',
    tabFiles: '文件列表',
    tabSearch: '搜索',
    tabAsk: '智能问答',
    // 创建/编辑对话框
    createTitle: '创建知识库',
    editTitle: '编辑知识库',
    kbName: '知识库名称',
    kbNamePlaceholder: '请输入知识库名称',
    description: '描述',
    descriptionPlaceholder: '可选，描述知识库的用途和特点',
    embeddingModel: '向量模型',
    embeddingModelPlaceholder: '请选择向量模型',
    chunkMaxSize: '最大分块大小',
    chunkOverlapSize: '重叠大小',
    chunkMinSize: '最小分块大小',
    chunkSection: '分块配置',
    visibility: '可见性',
    visibilityHint: '公开的知识库可被其他人查看',
    inputNameWarning: '请输入知识库名称',
    selectModelWarning: '请选择向量模型',
    // 确认弹窗
    switchModelTitle: '切换向量模型',
    switchModelDesc: '切换模型需要重新处理全部文档，可能导致较高的成本。确定要继续吗？',
    switchModelConfirm: '确定切换',
    // 错误提示
    loadFileListFailed: '加载文件列表失败',
    retryFileTitle: '警告',
    retryFileConfirm: '确定重建“{name}”的索引吗？将读回原文并重新切分、向量化，不会改动文件内容。',
    retryStarted: '已提交重建索引',
    retryFailed: '重建索引失败',
    waitRetry: '等待重建索引...',
    reindexAll: '重建全部索引',
    reindexAllConfirm: '将 {count} 篇未索引文档重新提交入库（读原文回写，不改内容）。',
    reindexing: '正在重建索引...',
    reindexDone: '重建完成：成功 {ok} 篇，失败 {fail} 篇',
    reindexPartial: '重建已跑完：成功 {ok} 篇，仍有 {rest} 篇未入库（后端切块或向量化失败，见后端日志）',
    reindexStillPending: '“{name}”仍未入库，重建没有真正完成',
    reindexNone: '没有需要重建的文档',
    // 待重建横幅与工序带共用：点掉之后要知道「后端没做完」和「你没点」不是一回事
    reindexHint: '重建只补索引，不改原文；若重建后仍显示待重建，说明后端切块或向量化失败。',
    fileNotReady: '文件尚未处理完成，无法查看分块内容',
    deleteFileTitle: '警告',
    deleteFileConfirm: '确定要删除文件“{name}”吗？此操作不可恢复。',
    deleteDirConfirm: '确定要删除文件夹“{name}”吗？其中的内容将一并删除，此操作不可恢复。',
    deleteKbTitle: '警告',
    deleteKbConfirm: '确定要删除知识库“{name}”吗？此操作不可恢复。',
    deleteKbNote: '删除后将解除该知识库与所有会话、角色的绑定；托管目录中的原始文件默认保留在服务器，如需彻底清理请先在「文件」中删除。',
  },

  // ── 文件项 (KBFileItem.vue) ──
  file: {
    processing: '处理中...',
    waitUpload: '等待上传...',
    retry: '重新处理',
    chunks: '分块',
    unknown: 'UNKNOWN',
  },

  // ── 文件树 (KBFileTree.vue) ──
  tree: {
    root: '知识库',
    loading: '加载中..',
    loadingMore: '加载中...',
    colName: '名称',
    colStatus: '状态',
    colType: '类型',
    colSize: '大小',
    colModified: '修改时间',
    folder: '文件夹',
    folderEmpty: '该文件夹为空',
    empty: '暂无文件',
    allLoaded: '已加载全部文件',
    // 右键菜单
    rename: '重命名',
    moveTo: '移动到...',
    retry: '重建索引',
    delete: '删除',
    // 重命名对话框
    renameTitle: '重命名',
    newNamePlaceholder: '输入新名称',
    // 移动对话框
    moveTitle: '移动到',
    rootDir: '根目录',
    // 验证
    nameEmpty: '名称不能为空',
    nameTooLong: '名称不能超过 255 个字符',
    nameInvalidChars: "名称包含非法字符，不允许使用：\\ / : * ? \" < > {'|'} 及控制字符",
    nameReserved: '名称「{name}」是系统保留名称，不能使用',
    nameStartEnd: '名称不能以空格或点号开头或结尾',
    moveSuccess: '移动成功',
    moveFailed: '移动失败',
    waitProcess: '等待处理...',
  },

  // ── 上传 (KBFileUploader.vue) ──
  upload: {
    newFolder: '新建文件夹',
    uploadFile: '上传文件',
    uploadFolder: '上传文件夹',
    uploadTask: '上传任务',
    // 新建文件夹
    newFolderTitle: '新建文件夹',
    folderNamePlaceholder: '输入文件夹名称',
    folderNameEmpty: '文件夹名称不能为空',
    folderCreateSuccess: '文件夹创建成功',
    folderCreateFailed: '创建文件夹失败',
    // 冲突对话框
    conflictTitle: '文件冲突',
    conflictDesc: '以下文件/目录已存在，请选择处理方式：',
    conflictDir: '目录',
    conflictFile: '文件',
    conflictExists: '已存在',
    conflictRenameTo: '将重命名为: {name}',
    conflictOverwrite: '覆盖已有文件',
    conflictOverwriteDesc: '新文件将替换旧文件',
    conflictKeepBoth: '都保留（自动重命名）',
    conflictKeepBothDesc: '在名称后添加时间戳以区分',
    // 文件验证
    nameEmpty: '名称不能为空',
    nameTooLong: '名称不能超过 255 个字符',
    nameInvalidChars: "名称包含非法字符，不允许使用：\\ / : * ? \" < > {'|'} 及控制字符",
    nameReserved: '名称「{name}」是系统保留名称，不能使用',
    nameStartEnd: '名称不能以空格或点号开头或结尾',
    // 上传提示
    unsupportedFormat: '未找到支持的文件格式',
    fileTooLarge: '{path} 文件大小超过限制 (1GB)，已跳过',
    uploadFailed: '{path} 上传失败',
  },

  // ── 搜索 (KBSearchDialog.vue, KBSearchPanel.vue) ──
  search: {
    title: '知识库搜索',
    kbLabel: '知识库',
    kbPlaceholder: '选择知识库',
    contentLabel: '搜索内容',
    contentPlaceholder: '输入要搜索的内容...',
    resultCount: '结果数量',
    searchBtn: '搜索',
    searching: '搜索中...',
    foundResults: '找到 {count} 条结果',
    clearResults: '清空结果',
    semantic: '语义',
    keyword: '关键词',
    comprehensive: '综合',
    similarity: '相似度',
    /** 单分数模式的相关度（后端只回 score 时用，不臆造百分比量纲） */
    relevance: '相关度',
    unknownFile: '未知文件',
    chunk: '分块',
    notFound: '未找到相关结果',
    notFoundHint: '尝试调整搜索关键词或选择其他知识库',
    initial: '输入关键词开始搜索',
    initialHint: '支持语义搜索和关键词匹配',
    selectKbWarning: '请选择知识库并输入搜索内容',
    selectKbFirst: '请先选择一个知识库',
    searchFailed: '搜索失败',
  },

  // ── 侧边栏 (KBSidebar.vue) ──
  sidebar: {
    title: '知识库',
    create: '新建',
    searchPlaceholder: '搜索知识库',
    notFound: '未找到匹配的知识库',
    empty: '没有知识库',
    notFoundHint: '尝试调整搜索关键词',
    emptyHint: '点击上方按钮创建新的知识库',
    edit: '编辑',
    delete: '删除',
  },

  // ── 分块查看器 (FileChunksViewer.vue) ──
  chunks: {
    title: '文件分块内容 - {name}',
    loading: '正在加载分块内容...',
    empty: '暂无分块内容',
    index: '索引',
    tokenCount: 'Token数',
    pagination: '共 {total} 个分块，当前显示 {start} - {end}',
    noFileSelected: '未选择文件或知识库',
    fileNotReady: '文件尚未处理完成，无法查看分块内容',
    loadFailed: '获取文件分块失败',
    view: '查看分块',
  },

  // ── 树节点 (TreeNode.vue) ──
  treeNode: {
    emptyFolder: '(空文件夹)',
  },

  // ── 上传任务弹窗 (UploadTaskModal.vue) ──
  uploadTask: {
    title: '上传任务',
    empty: '暂无上传任务',
  },
}
