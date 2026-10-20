export default {
  /** 消息滚动区：作为 role="region" 的可读名称（ScrollContainer） */
  messages: 'Message list',
  // ── 输入区 ──
  input: {
    // ChatInput.vue
    readonlyPlaceholder: 'Sub-agent session is in read-only mode',
    tokenLimit: 'Token Limit',
    stopGenerating: 'Stop Generating',
    enqueue: 'Enqueue',
    send: 'Send',
    selectModel: 'Please select a model',
    unlimited: 'Unlimited',
    custom: 'Custom',
    featureTools: 'Tool Calls',
    featureThinking: 'Hybrid Thinking',
    editorPlaceholder: "Press / for skills, {'@'} to summon agent, Shift+Enter for newline",
    optimizeFailed: 'Optimization failed, please try again later',
    optimizeUnavailable: 'Optimization service is unavailable. Please configure an optimizer model in settings',
    optimizeNoChange: 'The content is already clear enough; no optimization needed',
    previewTitle: 'Raw Content Preview - {name}',
    overwriteTitle: 'Overwrite {type}',
    overwriteConfirmDesc: 'Uploading both images and files simultaneously is not supported. Do you want to overwrite all {type}?',
    uploadingTitle: 'File Uploading',
    uploadingDesc: 'There are {count} files uploading. You can wait for the upload to complete or send the message directly (only completed files will be sent).',
    continueWaiting: 'Continue Waiting',
    sendDirectly: 'Send Directly',
    runModeNormal: 'Normal Mode',
    runModeSandbox: 'Lightweight Sandbox Mode',
    runModeBuild: 'Build Mode',
    runModePlan: 'Plan Mode',
    // Run-mode badge short labels (right of the model button, color-coded Build/Plan)
    runModeBuildShort: 'Build',
    runModePlanShort: 'Plan',
    // Prompt forms (user-definable in role settings; build always exists)
    runModeFormBuild: 'Build',
    runModeFormBuildDesc: 'Execute directly, confirm as you go',
    runModeFormEmpty: 'No prompt form available',

    // AttachmentPopover.vue
    uploadImage: 'Upload Image',
    uploadFile: 'Upload File',
    knowledgeBase: 'Knowledge Base',
    noKnowledgeBase: 'No knowledge base available',
    remoteConnection: 'Remote Workspace',
    noConnection: 'No connections available, please add one in settings',

    // CommandPicker.vue
    noMatchCommand: 'No matching command found',
    noMatchMember: 'No matching member found',

    // KnowledgeBasePanel.vue
    searchKnowledgeBase: 'Search knowledge base...',
    noMatchKnowledgeBase: 'No matching knowledge base found',

    // ModelSelectorPanel.vue
    selectModelHint: 'Select a model, hover here to choose a mode',
    reasoningEffort: 'Reasoning Effort',
    favoriteModels: 'Favorite Models',

    // RemoteConnectionDialog.vue
    remoteDir: 'Remote Directory',
    noRemoteConnection: 'No remote connections',
    newConnection: '+ New Connection',
    connectionName: 'Connection Name',
    selectConnectionType: 'Select Connection Type',
    connectionSuccess: '✓ Connection Successful',
    testConnection: 'Test Connection',
    fillConnectionName: 'Please fill in the connection name',

    // RunModePopover.vue
    runModeSandboxTest: 'Lightweight Sandbox Mode (Test)',
    runModeNormalDesc: 'No restrictions on tools, normal read/write to working directory, except command line',
    runModeSandboxDesc: 'Shell commands can write within the working directory, read-only outside',
    runModeBuildDesc: 'Tools and actions are allowed, with read/write to the working directory',
    runModePlanDesc: 'The first turn is read-only research that produces a plan, with no side-effect actions',

    // ThinkingEffortPopover.vue
    thinkingEffortTitle: 'Thinking Effort',
    // Thinking level: unified entry merging the deep-thinking toggle and the reasoning-effort levels
    thinkingLevelTitle: 'Thinking Level',
    // The "off" option inside the thinking level control
    thinkingLevelOff: 'Off',

    // ModelSelectorPanel —— model search box placeholder
    modelSearchPlaceholder: 'Search models',

    // WorkspaceSelectorPopover.vue
    recent: 'Recent',
    usePublicDir: 'Use Public Directory',
    autoCreate: 'Auto Create',
    autoCreateDesc: 'Create a working directory with a random name',
    selectLocalFolder: 'Select Local Folder',
    selectFolderFailed: 'Failed to select folder',
  },

  // ── 工具栏 ──
  toolbar: {
    // ChatInputToolbar.vue
    workspace: 'Working Directory: {path}',
    group: 'Group: {name}',
    autoCreate: 'Auto Create',
    publicDir: 'Public Directory',
    taskList: 'Task List',
  },

  // ── 上传 ──
  upload: {
    waiting: 'Waiting to upload...',
    preparing: 'Preparing to upload...',
    uploading: 'Uploading... {pct}%',
    completed: 'Upload complete, waiting for processing...',
    completedShort: 'Upload Complete',
  },

  // ── 流式响应 ──
  stream: {
    retrying: 'Retrying...',
    error: 'An error occurred',
    cancelled: 'Cancelled',
    rateLimited: 'Too many requests, retrying...',
    timeout: 'Request timed out, retrying...',
    compressing: 'Optimizing conversation history...',
  },

  // ── 消息工具 ──
  message: {
    unnamed: 'Unnamed Message',
    noActiveSession: 'No active session',
    deleteConfirm: 'Are you sure you want to delete this message?',
    deleteWithReply: 'Are you sure you want to delete this message? Associated replies will also be deleted. This action cannot be undone.',
  },

  // ── 面板 ──
  panel: {
    loadingHistory: 'Loading message history...',
    noMoreMessages: 'No more messages',
    compressing: 'Optimizing conversation history, please wait...',
    editingMessage: 'Editing message',
    memoryManagement: 'Memory Management',
    contextUsage: 'Context Usage',
    contextUsagePercent: 'Context Usage {pct}%',
    editCancelled: 'Edit cancelled',
    sessionBusy: 'Session Busy',
    sessionBusyDesc: 'The current session is responding, please try again later',
    sendMessageFailed: 'Failed to send message',
    maxVersionsExceeded: 'Maximum number of answer versions reached',
    mainSession: 'Main Session',
    subTask: 'Sub Task',
    noActiveSession: 'No active session',
    clearChatTitle: 'Clear Chat History',
    clearChatDesc: 'Are you sure you want to delete all chat history? This action cannot be undone.',
    deleteMessageTitle: 'Delete Message',
    deleteUserMessageDesc: 'Are you sure you want to delete this question? The corresponding answer will also be deleted. This action cannot be undone.',
    deleteAssistantMessageDesc: 'Are you sure you want to delete this answer? This action cannot be undone.',
    editMessageTitle: 'Edit Message',
  },

  // ── 头部 ──
  header: {
    closeWorkspace: 'Close Working Directory',
    openWorkspace: 'Open Working Directory',
    moreActions: 'More Actions',
    clearRecords: 'Clear Records',
    exportRecords: 'Export Records',
    importRecords: 'Import Records',
  },

  // ── 会话上下文面板 ──
  context: {
    memory: 'Memories',
    memoryRefresh: 'Refresh memories',
    memoryEmpty: 'No memories yet — they are captured during chat',
    memoryStats: 'Active {active} / cap {capacity} · recallable {recallable}',
    memoryScopeGlobal: 'Global',
    memoryScopeConversation: 'This chat',
    memorySourceManual: 'Manual',
    memorySourceAuto: 'Auto',
    memorySourceTool: 'Tool',
    memorySourceImport: 'Import',
    memoryHit: 'Hits {n}',
    memoryDelete: 'Delete this memory',
    memoryDeleteTitle: 'Delete Memory',
    memoryDeleteDesc: 'Delete this memory? It will no longer be injected into replies. This cannot be undone.',
    memoryClearConversation: 'Clear this chat',
    memoryClearTitle: 'Clear This Chat\'s Memories',
    memoryClearDesc: 'Delete all conversation-scoped memories of this chat? Global memories are kept. This cannot be undone.',
    memoryDeleted: 'Memory deleted',
    memoryCleared: 'Cleared this chat\'s memories ({n})',
    memoryLoadFailed: 'Failed to load memories',
  },

  // ── 侧边栏 ──
  sidebar: {
    chatSessions: 'Chat Sessions',
    newSession: 'New Session',
    searchPlaceholder: 'Search sessions',
    sessionHistory: 'Session History',
    noMatchSession: 'No matching session found',
    noSession: 'No sessions',
    noMatchSessionDesc: 'Try adjusting your search keywords',
    noSessionDesc: 'Click the button above to create a new session',
    loadMore: 'Click to load more ({n} remaining)',
    allLoaded: 'All {n} sessions loaded',
  },

  // ── 浮动面板 ──
  floating: {
    collapse: 'Collapse',
    hide: 'Hide',
    chat: 'Chat',
  },

  // ── 大纲 ──
  outline: {},

  // ── 欢迎页 ──
  welcome: {
    use: 'Use',
    selectCharacter: 'Select Character',
    startNewSession: 'Start New Session',
    greeting: 'Hi, what would you like to chat about?',
    pageTitle: 'What would you like to chat about today',
    newSession: 'New Chat',
    createFailedNoCharacter: 'Please select a character template first',
  },

  // ── 消息项 ──
  turn: {
    systemMessageScheduler: 'System message from scheduled task',
    systemMessageSubAgent: 'System message from sub-agent',
    systemMessage: 'System Message',
    apiError: 'API Request Error',
    requestTimeout: 'Request Timeout',
    routeTitle: 'Provider that actually served this reply',
    routeUnknownProvider: 'Unknown provider',
    serverNoResponse: 'The server has not responded with data for a while, please try again later',
    manuallyTerminated: 'Manually Terminated',
    maxIterationsReached: 'Maximum tool call iterations reached',
    continueExecution: 'Continue Execution',
    working: 'Working',
    codeCopied: 'Code copied to clipboard',
    thinkingActive: 'Thinking...',
    thinkingDone: 'Deep Thinking Complete',
    searchActive: 'Searching the web...',
    searchDone: 'Web Search · {n} sources',
    executingSteps: 'Executing {n} steps',
    executingStepsWithCompleted: 'Executing {n} steps, {m} completed',
    executedSteps: '{n} steps executed',
  },

  // ── 消息操作 ──
  messageActions: {
    copy: 'Copy',
    regenerate: 'Regenerate',
    prevVersion: 'Previous Version',
    nextVersion: 'Next Version',
    more: 'More',
    editContent: 'Edit Content',
    deleteMessage: 'Delete Message',
    rewindHere: 'Rewind from here',
    forkHere: 'Fork from here',
  },

  // ── Token stats bar ──
  tokenStats: {
    used: 'Context usage',
    usedTokens: 'Tokens used',
    totalTokens: 'Context window',
  },

  // ── Session footer stats bar (rounds / steps / speed / tokens / cache / context) ──
  runStats: {
    title: 'Session stats',
    rounds: '{n} rounds',
    steps: '{n} steps',
    speed: '{n} tok/s',
    second: '{n}s',
    minuteSecond: '{m}m {s}s',
    tokens: '{n} tok',
    percent: '{pct}%',
    cacheHit: 'Cache hit {pct}%',
    cacheHitEmpty: 'Cache hit —',
    modelTime: 'Model time',
    toolTime: 'Tool time',
    ttft: 'First token avg (TTFT)',
    tps: 'Output speed (TPS)',
    promptTokens: 'Input',
    cachedTokens: 'Cache hit',
    contextUsage: 'Context usage',
    // ── Token usage popover ──
    usageTitle: 'Token usage',
    cacheRate: 'Cache hit',
    cacheMiss: 'Uncached input',
    cacheRead: 'Cache read',
    outputTokens: 'Output',
    // ── Context popover ──
    contextUsed: 'Context used',
    bdSystem: 'System prompt',
    bdSummary: 'Summary',
    bdUser: 'User input',
    bdHistory: 'Messages',
    bdTools: 'Tool defs',
  },

  // ── Rewind confirm dialog ──
  rewindDialog: {
    title: 'Rewind from here?',
    message: 'This will delete this turn and all {turns} turns after it ({messages} messages). This cannot be undone.',
    workspaceWarning: 'Note: the conversation is rewound, but files already written to the workspace are not rolled back.',
    confirm: 'Rewind',
    cancel: 'Cancel',
    success: 'Rewound, {messages} messages removed',
    successLastTurn: 'Rewound this turn',
    failed: 'Rewind failed',
  },

  // ── Fork ──
  forkSuccess: 'Forked into new session "{title}"',
  forkFailed: 'Fork failed',

  // ── 工具调用 ──
  toolCalls: {
    detailTitle: 'Tool Call Details #{index}',
    callParams: 'Call Parameters',
    paramKey: 'Parameter',
    paramValue: 'Value',
    resultFailed: 'Execution Failed',
    resultSuccess: 'Execution Result',
    fieldKey: 'Field',
    aborted: 'Aborted',
    noResponse: 'No Response',
    executing: 'Executing…',
    viewDetail: 'View details',
    openFileInWorkspace: 'Preview this file in workspace',
  },

  // ── 文件变更 ──
  fileChanges: {
    summary: '{count} files modified in this round',
    viewDiff: 'View Diff',
    diff: 'Diff',
    dialogTitle: 'File Changes',
    dialogTitleWithName: 'File Changes: {name}',
  },

  // ── 工作区 ──
  workspace: {
    back: 'Back',
    forward: 'Forward',
    stop: 'Stop',
    refresh: 'Refresh',
    inputUrlPlaceholder: 'Enter URL or search',
    unmute: 'Unmute',
    mute: 'Mute',
    preview: 'Preview',
    source: 'Source',
    refreshPreview: 'Refresh Preview',
    imageAlt: 'Image Preview',
    unsupportedPreview: 'This file does not support preview',
    openInExplorer: 'Open in Explorer',
    fileNotFound: 'File no longer exists',
    closeTab: 'Close Tab',
    fileTooLarge: 'File is too large to preview',
    loadFileFailed: 'Failed to load file',
    loadImageFailed: 'Failed to load image',
    loadHtmlFailed: 'Failed to load HTML',
    imageLoadFailed: 'Image load failed',
    workspacePathError: 'Unable to get working directory path',
    openFailed: 'Open Failed',
    addSelectionToSession: 'Add Selection to Session',
    addFileToSession: 'Add File to Session',
    subTask: 'Sub Task',
    count: 'items',
    browserWindow: 'Browser Window',
    noBrowserWindow: 'No browser windows',
    unnamedWindow: 'Unnamed Window',
    todoList: 'To-Do List',
    workspaceArea: 'Workspace',
    previewArea: 'Preview Area',
    newWindow: 'New Window',
    newTab: 'New Tab',
    exitFullscreen: 'Exit Fullscreen',
    fullscreen: 'Fullscreen',
    workingDir: 'Working Directory',
    openInFileManager: 'Open in File Manager',
    openInVSCode: 'Open Working Directory in VSCode',
    noFiles: 'No files',
    noPreviewFile: 'No preview file',
    newBrowser: 'New Browser',
    selectFile: 'Select File',
    copyFileName: 'Copy File Name',
    copyPath: 'Copy Path',
    addToSession: 'Add to Session',
    openInExplorerShort: 'Open in Explorer',
    openInVSCodeShort: 'Open in VSCode',
    fileNameCopied: 'File name copied',
    pathCopied: 'Path copied',
    copyFailed: 'Copy failed',
    openedInVSCode: 'Opened in VSCode',
    openVSCodeFailed: 'Failed to open, please make sure VSCode is installed and the code command is available',
    rename: 'Rename',
    delete: 'Delete',
    renameTitle: 'Rename',
    renameInputPlaceholder: 'Enter a new file name',
    nameRequired: 'Name cannot be empty',
    nameNoSeparator: 'Name cannot contain path separators',
    renameSuccess: 'Renamed successfully',
    renameFailed: 'Rename failed',
    deleteConfirmTitle: 'Delete Confirmation',
    deleteConfirmDir: 'Are you sure you want to delete the directory "{name}"? All contents within this directory will be permanently deleted.',
    deleteConfirmFile: 'Are you sure you want to delete the file "{name}"?',
    confirmDelete: 'Confirm Delete',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Delete failed',
    createWindowFailed: 'Failed to create window',
  },

  // ── 备忘录 ──
  memo: {
    contextUsage: 'Context Usage',
    contextUsageTooltip: 'Context is an estimated value for reference only and may differ from the actual value',
    messages: '{count} messages',
    details: 'Details',
    compressing: 'Compressing...',
    compress: 'Compress',
    loading: 'Loading...',
    latestCompressStatus: 'Latest Compress Status',
    compressedTimes: 'Compressed {count} times',
    token: 'Token',
    message: 'Message',
    prunedOnly: 'Pruned Only',
    summaryCompress: 'Summary Compression',
    items: 'items',
    noSummaryContent: 'No summary content',
    history: 'History',
    edit: 'Edit',
    delete: 'Delete',
    noCompressRecords: 'No compression records',
    editSummaryTitle: 'Edit Summary',
    summaryPlaceholder: 'Please enter summary content',
    save: 'Save',
    cancel: 'Cancel',
    compressHistoryTitle: 'Compression History',
    compressTime: 'Compression #{n}',
    summaryContentLabel: 'Summary Content:',
    compressStatsLabel: 'Compression Stats:',
    tokenCount: 'Token Count:',
    messageCount: 'Message Count:',
    compressRate: 'Compression Rate:',
    prunedCount: 'Pruned Count:',
    close: 'Close',
    systemPrompt: 'System Prompt',
    summary: 'Summary',
    userPrompt: 'User Prompt',
    historyLabel: 'History',
    toolDefs: 'Tool Definitions',
    loadSummaryFailed: 'Failed to load summary',
    summaryUpdateSuccess: 'Summary updated successfully',
    summaryUpdateFailed: 'Failed to update summary',
    deleteConfirmTitle: 'Confirm Delete',
    deleteConfirmDesc: 'Are you sure you want to delete this memory summary? This action cannot be undone.',
    summaryDeleteSuccess: 'Summary deleted successfully',
    summaryDeleteFailed: 'Failed to delete summary',
    streamingWarning: 'The current session is streaming, please wait until it finishes before compressing',
    compressConfirmTitle: 'Confirm Compression',
    compressConfirmDesc: 'Are you sure you want to compress the current session\'s history? This action will automatically perform compression based on the session and character configuration.',
    compressSuccess: 'Compression successful! Compression ratio: {ratio}',
    compressNotExecuted: 'Compression not executed',
    compressFailed: 'Compression failed',
  },

  // ── Agent ──
  agent: {
    subAgent: 'Sub-agent',
    subAgentCount: 'Sub-agents: {count}',
    subAgentRunning: ', {count} currently working',
    smartAssistant: 'Smart Assistant',
    defaultDescription: 'A friendly and professional AI assistant that can help you with various questions.',
    noDescription: 'No description',
    noOtherRoles: 'No other roles',
  },

  // ── 队列 ──
  queue: {
    sending: 'Sending',
    queued: 'Queued',
    edit: 'Edit',
    withdraw: 'Withdraw',
  },
}
