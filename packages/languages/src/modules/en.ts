export default {
  project: {
    title: "ADMIN"
  },
  menu: {
    login: {
      auth: "Login",
      title: "ADMIN Platform",
      welcome: "Welcome to login",
      platform: "Management platform",
      description: "Maybe we just got lucky",
      account: "Account password login",
      in: "Log in",
      loading: "Be logging in",
      beiAnHao: "Website record number",
      picture: "I can't see it. Change it",
      systemUnavailable: "System temporarily unavailable",
      systemUnavailableDesc: "Failed to load system configuration, please try again later",
      retry: "Retry",
      otpTip: "Enter the 6-digit code from your authenticator app",
      totpTip: "Enter the 6-digit code from your authenticator app",
      otpTitle: "OTP Verification",
      otpConfirm: "Confirm",
      otpCancel: "Cancel",
      sliderTip: "Slide right to verify",
      sliderTipPuzzle: "Drag the slider to the matching slot",
      sliderSuccess: "Verified",
      sliderRequired: "Please complete the slider verification first",
      style: "Login Style",
      styleDesc: "Switch between different layouts and visual styles",
      styleOptions: {
        defaultLabel: "Simple Dual-pane",
        defaultDesc: "Brand showcase + login form",
        cardLabel: "Centered Card",
        cardDesc: "Floating split-card layout",
        bubbleLabel: "Bubble Minimal",
        bubbleDesc: "Bubble background lightweight card",
        glassLabel: "Glassmorphism",
        glassDesc: "Frosted glass card",
        slideLabel: "Gradient Flow",
        slideDesc: "Gradient glow floating card",
        splitLabel: "Split Immersive",
        splitDesc: "Large-screen split immersive layout",
        splitReverseLabel: "Mirrored Split Immersive",
        splitReverseDesc: "Form left · brand immersive right",
        minecraftDesc: "Pixel block style",
        voxelLabel: "Modern 3D",
        voxelDesc: "3D dimensional particle style",
        monoLabel: "Monochrome Terminal",
        monoDesc: "Geek monospace terminal style",
        simpleLabel: "Light Terminal",
        simpleDesc: "Clean terminal style",
      },
      featureTags: {
        manage: "Efficient Management",
        design: "Modern Design",
        security: "Secure & Reliable"
      },
      form: {
        loginName: "Please enter your username",
        password: "Please enter password",
        securityCode: "Please enter the verification code",
        tenantCode: "Tenant code (leave empty for the platform)",
      },
      rules: {
        loginName: {
          required: "The user name cannot be empty",
          validator: "The account can only contain letters, numbers, underscores and hyphens"
        },
        password: {
          required: "The password cannot be empty",
          validator2: "The password must contain both numbers and letters",
        },
        securityCode: {
          required: "The verification code cannot be empty"
        },
        tenantCode: {
          validator: "The tenant code is 2-32 characters: letters, numbers, underscores or hyphens"
        },
        otpCode: {
          required: "Please enter the 6-digit one-time code"
        }
      }
    },
    home: {
      auth: "Master Station",
      work: {
        name: "Workbench page"
      },
      analysis: {
        name: "Analysis page"
      },
      console: {
        name: "Console Page"
      }
    },
    system: {
      auth: "System Manage",
      user: {
        name: "User Manage",
        search: {
          label: {
            loginName: "Login name",
            userName: "User name",
            phone: "Phone number",
            deptId: "Department",
            loginTime: "Login time",  
          },
          placeholder: {
            loginName: "Please enter your login account",
            userName: "Please enter the user name",
            phone: "Please enter your phone number",
            deptId: "Please select a department",
          }
        },
        table: {
          loginName: "Login name",
          deptName: "Department",
          avatar: "Avatar",
          userName: "User name",
          email: "Email",
          phone: "Phone number",
          userType: "User type",
          sex: "Gender",
          userStatus: "User status",
          loginTime: "Login time"
        },
        form: {
          label: {
            loginName: "Login name",
            password: "Password",
            userName: "User name",
            deptId: "Department",
            postId: "Job allocation",
            roleId: "Assign roles",
            userType: "User type",
            userStatus: "User status",
            sex: "Gender",
            avatar: "Avatar",
            phone: "Phone number",
            email: "Email",
            remark: "Remark"
          },
          placeholder: {
            loginName: "Please enter your login account",
            password: "Please enter your password",
            userName: "Please enter the user name",
            deptId: "Please select a department",
            postId: "Please select the position",
            roleId: "Please select a role",
            userType: "Please select the user type",
            userStatus: "Please select the user status",
            sex: "Please select the user's gender",
            avatar: {
              description: "Upload an avatar",
              tip: "The maximum size of the picture is 3M"
            },
            phone: "Please enter your phone number",
            email: "Please enter your email address",
            remark: "Please enter the user's remarks"
          }
        },
        rules: {
          loginName: { required: "Please enter your login account" },
          password: { required: "Please enter your user password", validator: "At least 6 digits and containing letters and numbers" },
          userName: { required: "Please enter the user name"},
          deptId: { required: "Please select the department" },
          userType: { required: "Please enter the user type" },
          sex: { required: "Please select the user's gender" },
          userStatus: { required: "Please select the user status" },
          phone: { required: "Please enter your phone number" }
        },
        transfer: {
          role: "List of roles",
          post: "Job list"
        }
      },
      role: {
        name: "Role Manage"
      },
      menu: {
        name: "Menu Manage"
      },
      dictType: {
        name: "DictType Manage"
      },
      dictData: {
        name: "DictData Manage"
      },
      dept: {
        name: "Dept Manage"
      },
      post: {
        name: "Post Manage"
      },
      loginLogs: {
        name: "Login Logs"
      },
      operateLogs: {
        name: "Operate Logs"
      },
      notice: {
        name: "Notice Manage"
      },
      personage: {
        name: "Personage Center"
      }
    },
    hotsport: {
      auth: "Hotsport Monitor",
      dashboard: {
        name: "Dashboard"
      },
      traces: {
        name: "Traces"
      },
      dependencies: {
        name: "Dependencies"
      },
      leaks: {
        name: "Leaks"
      }
    },
    monitor: {
      auth: "System Monitor",
      scheduled: {
        name: "Scheduled Task"
      },
      online: {
        name: "Online User"
      },
      service: {
        name: "Service Monitor"
      },
      redis: {
        name: "Redis Monitor"
      },
      cache: {
        name: "Data Cache"
      },
      blocklist: {
        name: "Blocklist Manage"
      }
    },
    tools: {
      auth: "System Tool",
      generate: {
        name: "Code Generate"
      },
      config: {
        name: "Config Management"
      },
      file: {
        name: "Files Manage"
      },
      picture: {
        name: "Pictures Manage"
      },
      testDept: {
        name: "TestDept Manage"
      },
      testParams: {
        name: "TestDept Params"
      }
    },
    link: {
      auth: "External Link",
      back: {
        name: "Back Version"
      },
      front: {
        name: "Front Version"
      },
      blog: {
        name: "Blog Version"
      },
      element: {
        name: "ElementPlus"
      }
    },
    blog: {
      auth: "Blog Manage",
      category: {
        name: "Article Category"
      },
      tag: {
        name: "Tags Manage"
      },
      article: {
        name: "Article Manage"
      },
      friend: {
        name: "Friend Link"
      },
      circle: {
        name: "Circle Manage"
      },
      danMu: {
        name: "DanMu Manage"
      },
      notice: {
        name: "Notice Manage"
      },
      library: {
        name: "Knowledge Base"
      },
      libraryCatalog: {
        name: "Knowledge Catalog"
      },
      libraryPreview: {
        name: "Knowledge Preview"
      },
      comment: {
        name: "Comment Manage"
      },
    },
    coding: {
      404: {
        name: "404 Page"
      },
      403: {
        name: "403 Page"
      },
      500: {
        name: "500 Page"
      }
    }
  },
  button: {
    search: "Search",
    reset: "Reset",
    add: "Add",
    update: "Update",
    delete: "Delete",
    export: "Export",
    import: "Import",
    preview: "Preview",
    password: "Reset Password",
    expand: "Expand/Fold",
    role: "Assign Roles",
    post: "Assign Jobs",
    menu: "Assign Menu",
    dept: "Assign Dept",
    refreshCache: "Refresh Cache",
    view: "View",
    detail: "Detail",
    save: "Save",
    force: "Force Offline",
    logout: "Logout",
    execute: "Execute",
    executeOnce: "Execute Once",
    file: "File Upload",
    image: "Image Upload",
    upload: "Upload",
    download: "Download",
    confirm: "Confirm",
    cancel: "Cancel",
    refresh: "Refresh",
    hideSearch: "Hide Search",
    displaySearch: "Display Search",
    close: "Close",
    genCode: "Generate Code",
    previewCode: "Preview Code",
    sync: "Sync",
    switch: "Switch",
    publish: "Publish",
    catalog: "Catalog",
    minimize: "Minimize",
    restoreMinimized: "Restore form window"
  },
  home: {
    welcome: "Welcome"
  },
  tabs: {
    refresh: "Refresh",
    maximize: "Maximize",
    exitMaximize: "Exit Maximize",
    closeCurrent: "Close Current",
    listLabel: "Open page tabs",
    closeLeft: "Close Left",
    closeRight: "Close Right",
    closeOther: "Close Other",
    closeAll: "Close All",
    affix: "Affix Tab",
    unaffix: "Unfix Tab"
  },
  themeConfig: {
    title: "Theme Config",
    tabs: {
      appearance: "Appearance",
      interface: "Interface",
      extension: "Extension",
      advanced: "Advanced",
    },
    sections: {
      userConfig: "User Config",
      themeMode: "Theme Mode",
      themeColor: "Theme Color",
      colorStatus: "Color Status",
      layoutStyle: "Layout Style",
      loginStyle: "Login Style",
      loaderStyle: "Loading Animation",
      interfaceConfig: "Interface Config",
      toolbarSwitch: "Toolbar Switches",
      messageNotify: "Message Notify",
      homeConfig: "Home Config",
      weatherConfig: "Weather Config",
    },
    io: {
      export: "Export Config",
      import: "Import Config",
      exportSuccess: "Config exported",
      importSuccess: "Config imported",
      importError: "Import failed: invalid file format",
    },
    customColor: {
      title: "Custom Color",
      desc: "Pick from palette or enter HEX value",
    },
    loaderStyle: {
      hint: "The boot loader and in-app loading overlays share one animation. Your choice applies here at once and to the boot screen after a refresh.",
      lockedHint: "The animation is locked by the deployment config (other.loaderConfig in app.yaml) and cannot be changed here.",
      size: "Boot size",
      sizeNarrow: "Narrow",
      sizeWide: "Wide",
      speed: "Animation speed",
      adaptColor: "Follow theme color",
      adaptColorSub: "The animation follows the theme primary color",
      adaptColorTip: "Off uses the fixed color from the deployment config; on keeps the loader in sync when the theme changes",
    },
    themeModeTabs: {
      light: "Light",
      dark: "Dark",
      auto: "Auto",
    },
    msgStatus: {
      success: "Success",
      warning: "Warning",
      danger: "Danger",
      info: "Info",
      successToast: "Success: Operation completed",
      warningToast: "Warning: Please confirm the operation",
      dangerToast: "Danger: Operation failed",
      infoToast: "Info: This is a message",
    },
    layout: {
      vertical: "Vertical",
      columns: "Columns",
      double: "Double",
      classic: "Classic",
      optimum: "Optimum",
      horizontal: "Horizontal",
      group: "Grouped",
    },
    interface: {
      routeAnimation: {
        label: "Route Animation",
        placeholder: "Select route animation",
        none: "None",
        default: "Default",
        fade: "Fade",
        slide: "Slide",
        zoomFade: "Zoom Fade",
        fadeBottom: "Fade Bottom",
        fadeScale: "Fade Scale",
      },
      menuWidth: "Menu Width",
      tabsStyle: {
        label: "Tab Style",
        placeholder: "Select tab style",
        card: "Card",
        google: "Google",
        plain: "Plain",
      },
      dimension: {
        label: "Component Size",
        placeholder: "Select component size",
      },
    },
    switchBlocks: {
      accordion: {
        title: "Menu Accordion",
        sub: "Accordion Mode",
        tip: "Menu expand [on-single/off-multiple]",
        description: "Menus fold like accordion (only one expanded)",
      },
      asideInverted: {
        title: "Aside Inverted",
        sub: "Inverted",
        tip: "Aside uses inverted background",
        description: "Aside applies inverted background",
      },
      headerInverted: {
        title: "Header Inverted",
        sub: "Inverted",
        tip: "Header uses inverted background",
        description: "Header applies inverted background",
      },
      headerShown: {
        title: "Show Header",
        sub: "Top Nav",
        tip: "Toggle Header visibility",
        description: "Header will hide when off",
      },
      tabsShown: {
        title: "Show Tabs",
        sub: "Multi Tabs",
        tip: "Toggle multi-tab bar visibility",
        description: "Tab bar hides when off",
      },
      grey: {
        title: "Grey Mode",
        sub: "Color Assist",
        tip: "Global grey filter (memorial/eye-care)",
        description: "Global grey filter (memorial/eye-care)",
      },
      weak: {
        title: "Color Weak Mode",
        sub: "Color Assist",
        tip: "Color-blind friendly filter (higher contrast)",
        description: "Color-blind friendly filter (higher contrast)",
      },
      collapse: {
        title: "Collapse Menu",
        sub: "Aside Collapse",
        tip: "Collapse aside to icon bar",
        description: "Collapse aside to icon bar",
      },
      collapseToButton: {
        title: "Collapse to Button",
        sub: "Vertical layout only",
        tip: "When collapsed, hide the icon menu and shrink the entire menu into one expand button (vertical layout only)",
        description: "When collapsed, hide the icon menu and shrink the entire menu into one expand button (vertical layout only)",
      },
      collapseButton: {
        title: "Show Menu Button",
        sub: "Vertical layout only",
        tip: "Show an expand button when the menu is collapsed (in addition to the icon bar)",
        description: "An expand button appears when the menu is collapsed",
      },
      collapseBar: {
        title: "Keep Mini Bar",
        sub: "Vertical layout only",
        tip: "Keep a mini icon menu bar when collapsed",
        description: "The menu bar shrinks to a mini icon bar when collapsed",
      },
    },
    message: {
      position: {
        label: "Position",
        toolbar: "Toolbar Bell",
        rightBottom: "Floating Bottom-Right",
        hidden: "Hide All",
      },
      push: {
        title: "Real-time Push",
        sub: "Socket",
        tip: "Depends on Socket push; falls back to HTTP polling",
        description: "Depends on Socket push; falls back to HTTP polling",
      },
    },
    home: {
      customLayout: {
        title: "Custom Layout Button",
        sub: "Home",
        tip: "Custom layout switch button at top-right of home",
        description: "Custom layout button at home top bar right",
      },
    },
    weather: {
      enable: {
        title: "Show Weather",
        sub: "Toolbar",
        tip: "Show weather info at top-right of toolbar",
        description: "Show current weather and weekly forecast",
      },
    },
    toolbar: {
      searchMenu: {
        label: "Search Menu",
        sub: "Top Search",
        tip: "Top search box quick menu search",
        description: "Top-right quick search menu item",
      },
      refresh: {
        label: "Route Cache Refresh",
        sub: "Cache Clear",
        tip: "Click to clear keepAlive cache",
        description: "Click to clear keepAlive cache",
      },
      dark: {
        label: "Light/Dark Toggle",
        sub: "Theme Toggle",
        tip: "Toggle light/dark theme",
        description: "Light/dark theme toggle",
      },
      language: {
        label: "Language",
        sub: "i18n",
        tip: "Switch i18n texts like Chinese/English",
        description: "Switch Chinese/English localization",
      },
      fullScreen: {
        label: "Fullscreen Toggle",
        sub: "Fullscreen",
        tip: "Toggle browser fullscreen",
        description: "Toggle browser fullscreen",
      },
      themeSetting: {
        label: "Theme Config Entry",
        sub: "Panel Entry",
        tip: "Open theme config panel",
        description: "Open theme config panel",
      },
      user: {
        label: "User Dropdown",
        sub: "User Menu",
        tip: "Top user dropdown menu",
        description: "Top user dropdown menu",
      },
      breadcrumb: {
        label: "Breadcrumb Nav",
        sub: "Breadcrumb",
        tip: "Top breadcrumb navigation",
        description: "Top breadcrumb navigation",
      },
      breadcrumbDropdown: {
        label: "Breadcrumb Sub-dropdown",
        sub: "Dropdown",
        tip: "Dropdown when breadcrumb overflows",
        description: "Dropdown when breadcrumb overflows",
      },
      breadcrumbIcon: {
        label: "Breadcrumb Icon",
        sub: "Icon Prefix",
        tip: "Show icon before each breadcrumb",
        description: "Show icon before each breadcrumb",
      },
      tabIcon: {
        label: "Tab Icon",
        sub: "Tab Icon",
        tip: "Show icon before each tab",
        description: "Show icon before each tab",
      },
      logo: {
        label: "Logo Display",
        sub: "Brand",
        tip: "Show logo at top of sidebar",
        description: "Show logo at top of sidebar",
      },
      message: {
        label: "Message Bell",
        sub: "Messages",
        tip: "Toolbar message bell with unread dot",
        description: "Toolbar message bell with unread dot",
      },
      quickNote: {
        label: "Quick Note",
        sub: "Notes",
        tip: "Create a floating sticky note from the toolbar",
        description: "Toolbar note entry that creates floating sticky notes",
      },
      quickNoteConfirm: {
        label: "Note close confirmation",
        sub: "Confirm",
        tip: "Ask before closing a note",
        description: "Confirm before closing a note to avoid losing content",
      },
      weather: {
        label: "Toolbar Weather",
        sub: "Weather",
        tip: "Weather at top-right, click for weekly forecast",
        description: "Show weather component at top-right",
      },
      bigscreen: {
        label: "Bigscreen Entry",
        sub: "Bigscreen",
        tip: "Show bigscreen icon at top, click to open route in new window",
        description: "Show bigscreen entry icon and inject dedicated bigscreen route",
      },
      typhoon: {
        label: "Typhoon Monitor",
        sub: "Typhoon",
        tip: "Show active typhoon icons at top-right",
        description: "Show typhoon monitor at top-right",
      },
      exchangeRate: {
        label: "Toolbar Exchange Rate",
        sub: "Exchange Rate",
        tip: "Show exchange rate at top-right, click to view panel",
        description: "Show exchange rate component at top-right",
      },
    },
  },
  aiChat: {
    title: "AI Chat",
    enable: "Enable AI Assistant",
    enableTip: "Shows a floating AI entry at bottom-right when on",
    modePlaceholder: "Run Mode",
    modelPlaceholder: "Select local inference model",
    vendorPlaceholder: "Select vendor",
    modeOptions: {
      webllm: "In-browser Inference (WebLLM)",
      vendor: "Vendor API (Online)",
    },
    vendorOptions: {
      openai: "OpenAI (GPT series)",
      deepseek: "DeepSeek",
      custom: "Custom (OpenAI-compatible)",
    },
    webllmModelRecommend: "(Recommended · Lightweight)",
    modelLight: "Ultra-light",
    modelMedium: "Medium",
    status: {
      loading: "Loading model...",
      generating: "Generating reply...",
      idle: "Model ready, ready to chat",
    },
    actions: {
      loading: "Loading",
      loadModel: "Load Model",
      unload: "Unload",
    },
    apiUrl: "API URL",
    apiUrlPlaceholder: "https://api.openai.com/v1/chat/completions",
    apiKey: "API Key",
    apiKeyPlaceholder: "sk-...",
    modelId: "Model ID",
    modelIdPlaceholder: "Select or enter model ID",
    modelIdInputPlaceholder: "Manually enter model ID",
    syncTooltip: "Fetch model list",
    advanced: {
      title: "Advanced Parameters",
      maxTokens: "Max Tokens",
      maxTokensSub: "Limit",
      temperature: "Temperature",
      temperatureSub: "Randomness",
    },
    context: {
      title: "Context Management",
      limit: "Context Limit",
      limitSub: "Messages",
      summaryThreshold: "Auto-summary Threshold",
      summaryThresholdSub: "Percentage",
      summaryEnabled: "Round-N Compression",
      summaryEnabledSub: "Compress history into summary once over threshold",
      retainRounds: "Retain Rounds",
      retainRoundsSub: "Recent rounds kept verbatim after summary",
    },
    character: {
      title: "Assistant Avatar",
      placeholder: "Select avatar",
      model3d: "3D Model",
      model2d: "2D Icon",
      glbPlaceholder: "GLB model URL",
    },
    toast: {
      loaded: "Model loaded, ready to chat",
      loadFailed: "Failed to load model",
      unloaded: "Model unloaded, memory released",
    },
  },
  accessibility: {
    title: "Accessibility",
    screenReader: {
      title: "Screen Reader Mode",
      sub: "Focus Highlight",
      tip: "Optimize focus highlight and readability for visually impaired users",
    },
    highContrast: {
      title: "High Contrast Mode",
      sub: "Contrast Boost",
      tip: "Increase text/background contrast, independent of dark mode",
    },
    voiceRead: {
      title: "Voice Read",
      sub: "TTS",
      tip: "Auto-read focused element content",
      unsupportedTip: "Speech synthesis not supported in this browser",
    },
  },
  performance: {
    title: "Performance Monitor",
    fps: { title: "FPS", sub: "Frame Rate", tip: "Measures page smoothness; 60FPS is best" },
    memory: { title: "Memory", sub: "JS Heap", tip: "JS heap used by current page (Chrome/Edge only)" },
    cpu: { title: "CPU", sub: "Main Thread Load", tip: "Load estimated from main-thread frame interval" },
    battery: { title: "Battery", sub: "Level Status" },
    bluetooth: { title: "Bluetooth", sub: "Availability" },
    screen: { title: "Screen", sub: "Resolution" },
    position: {
      label: "Position",
      topLeft: "Top Left",
      topCenter: "Top Center",
      topRight: "Top Right",
      leftCenter: "Left Center",
      rightCenter: "Right Center",
      bottomLeft: "Bottom Left",
      bottomCenter: "Bottom Center",
      bottomRight: "Bottom Right",
    },
    content: {
      label: "Content",
      detailed: "Detailed",
      simple: "Simple",
      minimal: "Minimal",
    },
    layout: {
      label: "Layout Mode",
      merged: "Merged",
      split: "Split",
    },
    direction: {
      label: "Layout Direction",
      auto: "Auto",
      vertical: "Vertical",
      horizontal: "Horizontal",
    },
  },
  devTools: {
    title: "Dev Tools",
    liteTools: { title: "Light Debugging", sub: "Master Switch", tip: "Show ruler, grid and hover info debugging aids" },
    ruler: { title: "Ruler", sub: "Pixel Scale", tip: "Show pixel rulers at top and left of page" },
    grid: { title: "Grid", sub: "Layout Aid", tip: "Show 8px layout grid to aid alignment" },
    hoverInspector: { title: "Hover Inspector", sub: "Element Info", tip: "Show element tag, class and size on hover" },
  },
  heatmap: {
    title: "Heatmap Tools",
    cover: { title: "Heatmap Overlay", sub: "Click Heatmap", tip: "Record click hotspots and overlay as heatmap (dev/test only)" },
    clear: "Clear Hotspots",
    hint: "{count} hotspots recorded",
    cleared: "Heatmap data cleared",
  },
  systemDebug: {
    title: "System Debug",
    eruda: {
      title: "Eruda Console",
      sub: "Mobile Debugger",
      tip: "Integrates eruda providing Console / Elements / Network / Resources panels",
      description: "Loads CDN script dynamically; destroyed when off",
    },
  },
  emptyState: {
    title: "Empty State Style",
    desc: "Style shown when lists / tables have no data. Admins only.",
    enable: { title: "Unified Empty State", sub: "Global", tip: "When off, every ReEmpty without an explicit layout falls back to el-empty" },
    layout: { title: "Style", el: "Classic", modern: "Modern", plot: "Animated" },
    figure: { title: "Figure" },
    figures: {
      plot: "Plot",
      phosphor: "Phosphor",
      slow: "Conveyor",
      terrain: "Terrain",
      riffle: "Cards",
      stack: "Call Stack",
      branches: "Commit Graph",
      drawer: "Drawer",
      vault: "Vault",
      turntable: "Turntable",
      sieve: "Sieve",
      query: "Question",
    },
    tip: "Applies only to ReEmpty without an explicit layout; changes preview and save instantly",
  },
  header: {
    searchMenu: "Search menu",
    componentSize: "Component size",
    refreshCache: "Refresh cache",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    autoMode: "Follow system",
    language: "Language translation",
    fullScreen: "Full Screen",
    exitFullScreen: "Exit Full Screen",
    bigscreen: "Bigscreen",
    collapseToolbar: "Collapse toolbar",
    expandToolbar: "Expand toolbar",
    timer: {
      tip: "Multi-timezone timer",
      title: "Multi-timezone Time",
      localLabel: "Local Time",
      empty: "Add timezones in Theme Config > Advanced",
      weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      configTitle: "Timer Config",
      enableTitle: "Enable Top Timer",
      enableSub: "Worker Driven",
      enableTip: "Display time in Header top-right, hover for multi-timezone view (repo/work Worker)",
      enableDesc: "Multi-timezone clock in Header, hover to view all timezones",
      zoneTitle: "Display Timezones",
      zonePlaceholder: "Select timezone",
      zoneAdd: "Add Timezone",
      zoneTip: "Max 3 timezones, UTC-12 ~ UTC+12; clear to show local time only",
      groupAmericas: "Americas / Pacific",
      groupEurope: "Europe / Africa",
      groupAsia: "Asia / Oceania",
    },
    weather: {
      tip: "View weather",
    },
    exchangeRate: {
      empty: "No exchange rate data",
    },
    personalCenter: "Personal Center",
    settings: "Settings",
    logout: "Log out",
    dimensionList: {
      default: "default",
      large: "large",
      small: "small"
    },
    languageList: {
      chinese: "Chinese",
      english: "English"
    },
    menuSearch: "Menu search: Support menu name, path",
    searchMenuHint: "Type a menu name or path to navigate quickly",
    searchMenuSelect: "Navigate",
    searchMenuEnter: "Open",
    searchMenuEsc: "Close",
    pinMenu: "Pin submenu",
    unpinMenu: "Unpin",
    envBadge: {
      prod: "PROD",
      test: "TEST",
      dev: "DEV",
      mode: "Runtime mode",
      backend: "Backend",
      sameOrigin: "same origin"
    },
    alerts: {
      none: "No open alerts",
      open: "{n} open alert(s)",
      empty: "Nothing needs attention right now"
    },
    noteEntry: {
      title: "Quick Note",
      label: "Quick Note",
      placeholder: "Type something...",
      confirmDelete: "Confirm to delete this note?",
      created: "Saved",
      deleted: "Deleted",
      count: "note(s)",
      minimize: "Minimize",
      maximize: "Maximize",
      fullscreen: "Fullscreen",
      restore: "Restore",
      close: "Close",
    },
    commandPalette: {
      tip: "Command palette (Ctrl/⌘ + K)",
      placeholder: "Search menus or type an action…",
      title: "Command palette",
      hint: "Jump to a page or run an action. Ctrl/⌘ + K anytime",
      recent: "Recent",
      actions: "Actions",
      menus: "Menus",
      actionHint: {
        refresh: "Clear cache and reload",
        theme: "Switch theme mode",
        fullscreen: "Toggle fullscreen",
        settings: "Open theme settings drawer"
      }
    }
  },
  msg: {
    success: "Operation successful",
    fail: "Operation failed. Please refresh and try again",
    selectData: "Please select the data",
    validFail: "Validation failed. Please check the form contents",
    null: "No data for now",
    closeTips: "Are you sure you want to close it?",
    closed: "Closed",
    cancelled: "Cancelled",
    remind: "Friendly reminder:",
    confirmWant: "Do you confirm that you want",
    confirmDelete: "Are you sure you want to delete it?",
    confirmLogin: "The account identity has expired, please log in again",
    selectDate: "Please select a date",
    selectDateTime: "Please select a date and time",
    selectNumber: "Please enter the number",
    beginTime: "Begin Time",
    endTime: "End Time",
    to: "to",
    keyword: "Keyword search",
    configFail: "Configuration failed",
    logIn: "Please log in again",
    logInFail: "Login failed, please check your account or password",
    yzmFail: "Captcha acquisition failed",
    requestFailed: "Request failed",
    http: {
      serverBusy: "Server is busy, please try again later",
      serverUnavailable: "Service temporarily unavailable, please try again later",
      serverTimeout: "Server response timeout, please try again later",
      serverError: "Internal server error, please try again later",
      networkError: "Network connection error, please check your network",
    },
  },
  table: {
    number: "#",
    operate: "Operation"
  },
  tree: {
    topLevel: "Top level data",
    selectParent: "Please select parent data"
  },
  dict: {
    sys_switch_status: {
      open: "open",
      stop: "stop",
    },
    sys_user_sex: {
      man: "man",
      woman: "woman",
      unknown: "unknown"
    },
    sys_yes_no: {
      yes: "yes",
      no: "no"
    }
  },
  hotsport: {
    refresh: "Refresh",
    graph: "Graph",
    list: "List",
    dashboard: {
      title: "Live Call Topology",
      trend: "Recent Call Trend",
      transmissionCount: "Calls",
      traceCount: "Traces",
      dependencyCount: "Dependencies",
      leakCount: "Leaks",
      fetchStatsError: "Failed to fetch stats"
    },
    traces: {
      title: "Live Traces (Spans)",
      className: "Class",
      method: "Method",
      durationMs: "Duration (ms)",
      status: "Status",
      startTime: "Start Time",
      empty: "No data",
      fetchError: "Failed to fetch traces"
    },
    dependencies: {
      title: "Service Dependencies",
      source: "Source",
      target: "Target",
      callCount: "Calls",
      errorCount: "Errors",
      avgDurationMs: "Avg (ms)",
      lastCallAt: "Last Call",
      fetchError: "Failed to fetch dependencies"
    },
    leaks: {
      title: "Resource Leak Detection",
      resourceType: "Resource Type",
      resourceName: "Resource Name",
      stack: "Stack",
      view: "View",
      noStack: "No stack",
      fetchError: "Failed to fetch leaks"
    }
  },
  policy: {
    common: {
      action: "Action",
      remark: "Remark",
      status: "Status",
      active: "Active",
      createTime: "Created At",
      hits: "Hits",
      burst: "Burst",
      matchTarget: "Match Target",
      enabled: "Enabled",
      enable: "Enable",
      disabled: "Disabled",
      whitelist: "Allowlist",
      blacklist: "Blocklist",
      listType: "List Type",
      all: "All",
      current: "Current",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      deleteConfirm: "Confirm Delete",
      saveFailed: "Save failed",
      deleteFailed: "Delete failed",
      toggleFailed: "Toggle failed",
      reloadFailed: "Reload failed",
      account: "Account",
      deleted: "Deleted",
      stopped: "Disabled",
      remove: "Delete",
      hitDetailOf: "Hit detail {name}",
      editOf: "Edit {name}",
      deleteOf: "Delete {name}",
      activeOf: "Activate {name}",
      enableOf: "Enable {name}",
      hitOf: "Hit {name}",
      notConfigured: "Not configured",
    },
    hero: {
      title: "Policy Console",
      subtitle: "Manage runtime policy in one place: config publishing, traffic protection and access lists",
      chainOk: "Pipeline healthy",
      refresh: "Refresh",
      enterConfig: "Enter config →"
    },
    nav: {
      aria: "Policy console navigation",
      workspace: "Policy workspace",
      overview: { label: "Overview", caption: "Pipeline & capacity" },
      hotreload: { label: "Hot Reload", caption: "Runtime settings" },
      ratelimit: { label: "Rate Limit", caption: "QPS & rules" },
      blackwhite: { label: "Access List", caption: "IP & account" },
      gray: { label: "Gray Release", caption: "Traffic split" },
      header: { label: "Header Block", caption: "UA & crawlers" },
      route: { label: "API Control", caption: "Disable & forward" },
      rate: {
        interface: "By endpoint",
        ip: "By IP",
        account: "By account"
      },
      bw: {
        ip: "IP list",
        account: "Account list"
      }
    },
    overview: {
      chain: "Pipeline",
      chainDesc: "Policy takes effect in the order config → rate limit → list, and a blocklist always wins over an allowlist exemption.",
      refreshStats: "Refresh stats",
      hotReload: "Hot reload publish",
      hotReloadCount: "{count} runtime settings",
      rateLimit: "Traffic rate limit",
      rateCount: "{enabled}/{total} rules enabled",
      // While the global gate is off, "enabled" only means each rule's own switch is on;
      // nothing actually runs. The qualifier has to be spelled out or the figure reads
      // as "rate limiting is already active".
      rateCountGlobalOff: "{enabled}/{total} rules enabled · global ceiling off (rules still apply)",
      blackwhite: "Access list",
      blackwhiteCount: "{count} list entries",
      passBlock: "Pass / block",
      passBlockDesc: "Allowlist bypasses rate limiting",
      rateRule: "Rate limit semantics",
      rateRuleDesc: "A matched rule consumes a QPS token bucket; the burst parameter is currently stored only and does not size the bucket.",
      manageRules: "Manage rules",
      hotReloadBoundary: "Hot reload boundary",
      hotReloadBoundaryDesc: "Saving selectively evicts the settings cache and publishes a change event, so only runtime consumers that explicitly opt in react.",
      manageConfig: "Manage settings",
      listPriority: "List priority",
      listPriorityDesc: "An IP or account on a blocklist is rejected immediately and an allowlist cannot override it. An allowlist is a pass-through exemption, not an admission list: that IP skips rate limiting, and any IP on no list at all is still allowed by default.",
      manageList: "Manage list",
      cards: {
        hotreload: { label: "Hot reload settings", unit: "items" },
        ratelimit: { label: "Rate limit rules", unit: "rules" },
        blackwhite: { label: "Access list", unit: "entries" },
        overview: { label: "Pipeline", unit: "stages" }
      }
    },
    hotreload: {
      title: "Hot Reload Settings",
      desc: "Maintain runtime settings in the {hotReload} group. Saving with an ID updates, without an ID creates.",
      reloadNow: "Hot reload now",
      add: "Add setting",
      contract: "Publish contract",
      contractDesc: "Supports string / number / boolean / json; after the transaction commits the hot_reload cache is evicted and the latest value is read through AOP.",
      lastReload: "Last reload {time} · {count} enabled",
      empty: "No hot reload settings",
      col: { name: "Setting Name", code: "Setting Code", value: "Value", type: "Type" },
      typeString: "String",
      typeNumber: "Number",
      typeBoolean: "Boolean",
      formValueType: "Value Type",
      phName: "Enter setting name",
      phValue: "Enter setting value",
      errValue: "Setting name and code are required",
      errCode: "Setting code accepts only letters, digits, dots, hyphens and underscores, and must start with a letter",
      errNotNumber: "Setting value must be a valid number",
      errNotBoolean: "Setting value must be true or false",
      errNotJson: "Setting value must be valid JSON",
      errDuplicate: "Not saved, please check whether the setting code is duplicated",
      saved: "Hot reload setting updated",
      created: "Hot reload setting created",
      reloaded: "Hot reload done, {count} settings enabled",
      reloadFailed: "Hot reload failed",
      loadFailed: "Failed to load hot reload settings",
      dialogEdit: "Edit Hot Reload Setting",
      dialogAdd: "Add Hot Reload Setting",
      deleteTitle: "Delete hot reload setting",
      deleteBody: "Delete \"{name}\"? The runtime will stop reading this setting.",
      deleted: "Hot reload setting deleted",
      errNotDeleted: "Setting not deleted; it may no longer exist"
    },
    rate: {
      desc: "Maintain exact rules by endpoint, IP and account; global parameters are configured separately from the entry on the right.",
      add: "Add rule",
      empty: "No {name}",
      globalAria: "Global rate limit config, currently {state}",
      global: "Global rate limit",
      // Two independent rate-limit layers (not a gate): the global limit is one shared
      // system-wide token bucket; each rule has its own bucket keyed by dimension:target.
      // PolicyRateLimitFilter.enforceRule() reads the rule cache and never consults the
      // global switch, so rules keep working while the global limit is off.
      globalOffNotice:
        "Global rate limiting is off: no system-wide QPS ceiling is applied, but the enabled rules below still enforce their own QPS. Turn it on only if you need a ceiling for the whole system.",
      on: "On",
      off: "Off",
      hitTitle: "Rate limit rule {target}",
      dimLabel: "Dimension",
      dimInterface: "Endpoint",
      dimAccount: "Account",
      keepEnabled: "The rule will be written to the runtime cache",
      keepDisabled: "The rule stays disabled",
      ruleQps: "Rule QPS",
      ruleBurst: "Rule burst",
      enableRule: "Enable rule",
      enableRuleAria: "Enable rate limit rule",
      meta: {
        interface: {
          title: "Endpoint rules",
          description: "Matches the request path after the context-path is stripped, e.g. /v2/user/page",
          target: "Enter the endpoint path, e.g. /v2/user/page"
        },
        ip: {
          title: "IP rules",
          description: "Set an access frequency for one exact IP",
          target: "Enter the exact IP, e.g. 192.168.1.10"
        },
        account: {
          title: "Account rules",
          description: "Set an access frequency for one exact login account",
          target: "Enter the login account"
        }
      },
      col: {
        runStatus: "Run Status",
      },
      globalDialog: {
        title: "Global Rate Limit",
        enable: "Enable global rate limit",
        enableDesc: "When off no system-wide QPS ceiling applies (rules still enforce their own QPS); when on all traffic shares one ceiling",
        enableAria: "Enable global rate limit",
        qps: "Global QPS",
        burst: "Burst",
        burstAria: "Global burst",
        domain: "Scope",
        domainDesc: "At runtime rate limiting centres on QPS; the burst parameter is currently stored only and does not size the token bucket.",
        apply: "Apply"
      },
      errQps: "QPS must be an integer greater than 0",
      errBurst: "Burst must be a non-negative integer",
      loadGlobalFailed: "Failed to load global config",
      loadRulesFailed: "Failed to load rate limit rules",
      globalApplied: "Global config applied",
      globalApplyFailed: "Failed to apply global config",
      errTargetTooLong: "Rule target must not exceed 500 characters",
      errNotCreated: "Rule not created",
      errNotUpdated: "Rule not updated, the record may have been deleted",
      saved: "Rate limit rule updated",
      created: "Rate limit rule created",
      errStatusNotUpdated: "Rule status not updated",
      ruleEnabled: "Rule enabled",
      ruleStopped: "Rule disabled",
      statusFailed: "Failed to update status",
      deleteTitle: "Delete Rate Limit Rule",
      deleteBody: "Delete rule {target}?",
      errNotDeleted: "Rule not deleted, the record may have been deleted",
      deleted: "Rate limit rule deleted",
      dialogEdit: "Edit Rate Limit Rule",
      dialogAdd: "Add Rate Limit Rule"
    },
    bw: {
      desc: "Manage IP ranges and login accounts; blocklist wins, allowlist bypasses rate limiting.",
      addRule: "Add {kind} rule",
      emptyIp: "No IP rules",
      emptyAccount: "No account rules",
      hitTitleIp: "IP list {ip}",
      hitTitleAccount: "Account list {account}",
      phIp: "e.g. 192.168.1.0/24",
      phAccount: "Enter account",
      dialogIpEdit: "Edit IP Rule",
      dialogIpAdd: "Add IP Rule",
      dialogAccEdit: "Edit Account Rule",
      dialogAccAdd: "Add Account Rule",
      errIpBlank: "Enter an IP address or CIDR",
      errIpInvalid: "Enter a valid IPv4 address or IPv4 CIDR, e.g. 192.168.1.0/24",
      errIpNotUpdated: "IP rule not updated, the record may have been deleted",
      ipSaved: "IP rule updated",
      ipCreated: "IP rule created",
      deleteIpTitle: "Delete IP Rule",
      deleteIpBody: "Delete IP rule {ip}?",
      errIpNotDeleted: "IP rule not deleted, the record may have been deleted",
      ipDeleted: "IP rule deleted",
      errAccTooLong: "Account must not exceed 100 characters",
      errPickType: "Pick a list type",
      errPickStatus: "Pick a status",
      errAccNotUpdated: "Account rule not updated, the record may have been deleted",
      accSaved: "Account rule updated",
      accCreated: "Account rule created",
      deleteAccTitle: "Delete Account Rule",
      deleteAccBody: "Delete account rule {account}?",
      errAccNotDeleted: "Account rule not deleted, the record may have been deleted",
      accDeleted: "Account rule deleted"
    },
    header: {
      desc: "Block crawlers and automated clients by request header (mainly {ua}). Save, toggle and delete {immediate}, no restart needed.",
      reload: "Reload rules",
      add: "Add rule",
      ruleTitle: "Matches by contains, and runs before authentication",
      ruleDesc: "Crawlers are recognised in the UA by characteristic fragments ({bot}, {headless}, {python}), so the default is to block when the word appears. The filter runs {before} authentication: these clients rarely carry valid credentials, so blocking after authentication would just waste a token check. Any error while parsing or matching a rule lets the request {pass}, so a bug in the policy itself never takes the site down.",
      empty: "No header block rules",
      hitTitle: "Header {name}",
      termImmediate: "takes effect immediately",
      termImmediateAll: "takes effect on every node immediately",
      termBefore: "before",
      termPass: "pass",
      defaultMessage: "Automated client access rejected",
      phPatterns: "One per line, e.g.:\nGooglebot\npython-requests\nHeadlessChrome",
      presetFill: "Fill in {count} preset patterns",
      col: {
        headerName: "Header",
        matchType: "Match Type",
        patterns: "Patterns",
        blockStatus: "Block Status",
        active: "Active"
      },
      match: {
        CONTAINS: { label: "Contains", hint: "Recommended. Discriminating UA features are fragments, block when present" },
        EQUALS: { label: "Equals", hint: "Block only when the whole UA string is identical" },
        PREFIX: { label: "Prefix", hint: "Block only when it starts with the given string" },
        REGEX: { label: "Regex", hint: "Most powerful and easiest to get wrong. A mistake only skips that pattern, the rest still work" }
      },
      form: {
        name: "Header",
        nameDesc: "Usually {ua}. Renaming a header invalidates and rebuilds existing rules, so editing does not allow it.",
        matchType: "Match Type",
        patterns: "Patterns",
        blockStatus: "Block Status",
        blockDefault: "403 Forbidden (default)",
        message: "Message",
        messagePh: "msg returned to the caller",
        active: "Active",
        desc: "Takes effect on every node {immediate}, no restart needed. A wrong pattern only skips that one entry; the rest still block.",
        dialogEdit: "Edit Header Block Rule",
        dialogAdd: "Add Header Block Rule"
      },
      errPresets: "Presets are not loaded yet, try again later",
      presetFilled: "Filled in {count} preset patterns, remove the ones you do not need",
      errNameBlank: "Enter the header name",
      errPatternsEmpty: "Enter at least one pattern",
      saved: "Rule updated, in effect immediately",
      created: "Rule created, in effect immediately",
      enabledNow: "Enabled, in effect immediately",
      stoppedNow: "Disabled, no longer in effect",
      deletedNow: "Deleted, no longer in effect",
      deleteBody: "Delete the block rule for {name}?",
      reloaded: "Reloaded {count} rules",
    },
    gray: {
      desc: "Maintain gray release rules by business key: weight decides the ramp share, hit strategy describes user/role/IP conditions in JSON.",
      add: "Add gray rule",
      landing: "Where it lives",
      landingDesc: "One row is one config, stored in the unified policy table with {table}; ordered by sort ascending then created time descending.",
      empty: "No gray release configs",
      enableOf: "Enable gray release {key}",
      col: {
        bizKey: "Business Key",
        weight: "Weight %",
        hitStrategy: "Hit Strategy (JSON)",
      },
      form: {
        bizKey: "Business Key",
        bizKeyPh: "e.g. order.submit.v2",
        weight: "Weight (%)",
        sort: "Sort",
        hitStrategy: "Hit Strategy",
        // Braces must be wrapped in vue-i18n literal interpolation {'…'}: written bare they are
        // parsed as message placeholders, which throws at compile time and kills the dialog's
        // whole render (visible only in the console — in the UI it just "does nothing").
        hitStrategyPh: 'JSON, e.g. {\'{"users":["sa"],"ips":["10.0.0.0/8"],"rule":"1==1"}\'}',
        dialogEdit: "Edit Gray Release Config",
        dialogAdd: "Add Gray Release Config"
      },
      loadFailed: "Failed to load gray release configs",
      errKeyBlank: "Enter the business key",
      errNotJson: "Hit strategy must be valid JSON",
      saved: "Gray release config updated",
      created: "Gray release config created",
      deleteBody: "Delete gray release config {key}?"
    },
    route: {
      desc: "Disable an endpoint online, or forward one endpoint's traffic to another registered endpoint. Rule changes take effect on every node immediately.",
      reloadIndex: "Reload route index",
      add: "Add rule",
      forwardTitle: "Forward targets come only from routes registered in this app",
      forwardDesc: "A target is not a hand typed address: the server looks it up from Spring's registered {requestMapping}, so this service cannot be turned into a jump host to reach outside addresses. When a target cannot be resolved it is treated as disabled, never passed. Rules apply {byPath}, so several methods on the same path (e.g. {getPost}) are disabled or forwarded together.",
      pathDesc: "Write the in-app path (without a context-path like {ctx}). Forward targets can only be picked from the dropdown; the server resolves the real path from Spring's registered routes, and it {cannot} point at an external address.",
      indexCount: "The index currently holds {indexed} registered route entries, merged by path into {total} rows here.",
      phFilter: "Filter by path / method / handler / remark",
      filterAria: "API control keyword filter",
      query: "Query",
      empty: "No API control rules",
      hitTitle: "API control {path}",
      customPathHint: "Custom path (not in the registered routes)",
      actionDisableLabel: "Disable (reject directly)",
      actionForwardLabel: "Forward (to another endpoint)",
      stateBlocked: "Blocked",
      stateForwarded: "Forwarded",
      stateInactive: "Inactive (endpoint allowed)",
      stateRuleOn: "Rule active",
      stateRuleOff: "Rule inactive",
        stateNoteUnconfigured: "No policy rule is configured for this endpoint, so it is not governed and passes through.",
        stateNoteInactive: "A rule exists but is switched off, so it does not run and the endpoint passes through.",
        stateNoteBlocked: "The rule is active; matching requests are rejected with {code}.",
        stateNoteForwarded: "The rule is active; matching requests are forwarded to {target}.",
        stateLegendTitle: "What the states mean",
        stateLegend:
          "States: Unconfigured = no rule, endpoint not governed. Inactive = a rule exists but is off, endpoint passes through. Blocked = rule active, matches rejected with the response code. Forwarded = rule active, matches go to the target endpoint.",
        deleteRule: "Delete rule",
        deleteRuleTip: "Delete the policy rule of this endpoint",
        ruleDeleted: "Rule deleted",
      toastBlocked: "Endpoint blocked",
      toastForwardOn: "Forwarding active",
      toastAllowed: "Endpoint allowed",
      customStatusHint: "Custom status code, not in the candidate list.",
      termCannot: "cannot",
      termByPath: "by path",
      actionLabelEdit: "Edit",
      actionLabelConfig: "Configure",
      col: {
        method: "Method",
        handler: "Handler",
        action: "Action",
        target: "Forward Target",
        status: "Active",
      },
      form: {
        path: "Endpoint Path",
        pathPh: "In-app path, without context-path, e.g. /v2/user/me",
        action: "Action",
        statusCode: "Status Code",
        statusCodePh: "Status code returned when disabled",
        statusCodeAria: "Disable status code",
        message: "Message",
        messagePh: "msg returned to the caller",
        target: "Forward Target",
        targetPh: "Pick from the registered routes",
        dialogEdit: "Edit API Control Rule",
        dialogAdd: "Add API Control Rule"
      },
      defaultMessage: "This endpoint is disabled, please try again later",
      loadFailed: "Failed to load API control",
      routesLoadFailed: "Failed to load registered routes",
      synced: "Synced to tables: {routes} routes, {policies} rules",
      errPathBlank: "Enter the endpoint path",
      errPathSlash: "The endpoint path must start with /",
      errTargetBlank: "Pick a forward target",
      errPathUnknown: "This path is not in the registered routes, so the rule will be saved but will not affect any request",
      saved: "Rule updated",
      created: "Rule created",
      errNotConfigured: "This route has no policy yet, click Configure first",
      errNothingToDelete: "This route has never had a policy, nothing to delete",
      deleteBody: "Delete the disable/forward rule for {path}?"
    },
    status: {
      "503": "Service unavailable. The usual 'temporarily disabled' semantics; clients will typically retry or degrade.",
      "502": "Bad gateway. Fits 'this endpoint was taken out, upstream cannot reach it'.",
      "500": "Internal server error. Reads as 'internal exception'; using 500 to disable an endpoint is easily confused with a real outage.",
      "429": "Too many requests. Fits 'not disabled, but I want to squeeze the traffic'.",
      "403": "Forbidden. Fits 'the endpoint is there, but this caller may not use it'.",
      "404": "Not found. Fits hiding an endpoint from the outside without revealing it ever existed.",
      "401": "Unauthorized. Use with care: it gets mixed up with real authentication failures when debugging."
    },
    hit: {
      title: "Hit Detail · {name}",
      total: "Total hits",
      ipCount: "Source IPs",
      last: "Last hit",
      empty: "This policy has never taken effect. Only requests where the rule really {effective} are counted: blocked by a blocklist, rate limited, or an endpoint disabled or forwarded. Passed requests are not counted.",
      topIps: "Top 10 Source IPs",
      trend: "Hit trend (per minute)",
      trendEmpty: "No per-minute trend data (the trend keeps only the last hour and is cleared on restart).",
      detailTitle: "Client IP detail (who is calling)",
      colIp: "Client IP",
      colCount: "Count",
      termEffective: "really did something",
      loadFailed: "Failed to load hit detail"
    }
  }
};
