/**
 * 全屏加载动画管理器
 * 统一管理所有应用的 HTML 加载动画
 */

/**
 * 加载动画样式配置
 */
export const LOADER_STYLES = {
  default: {
    name: "三个圆点",
    description: "经典的三个跳动圆点动画",
    html: '<div class="loader"></div>',
    css: `
      .loader,
      .loader::before,
      .loader::after {
        width: 2.5em;
        height: 2.5em;
        border-radius: 50%;
        animation: load-animation 1.8s infinite ease-in-out;
        animation-fill-mode: both;
      }

      .loader {
        position: relative;
        margin: 0 auto;
        font-size: 10px;
        color: #406eeb;
        text-indent: -9999em;
        transform: translateZ(0);
        animation-delay: -0.16s;
      }

      .loader::before,
      .loader::after {
        position: absolute;
        top: 0;
        content: "";
      }

      .loader::before {
        left: -3.5em;
        animation-delay: -0.32s;
      }

      .loader::after {
        left: 3.5em;
      }

      @keyframes load-animation {
        0%, 80%, 100% {
          box-shadow: 0 2.5em 0 -1.3em;
        }
        40% {
          box-shadow: 0 2.5em 0 0;
        }
      }
    `
  },

  rings: {
    name: "彩色圆环",
    description: "多彩旋转圆环动画",
    html: `
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
    `,
    css: `
      .loading-spinner {
        position: relative;
        width: 120px;
        height: 120px;
      }

      .spinner-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid transparent;
        border-radius: 50%;
        animation: spin 2s linear infinite;
      }

      .spinner-ring:nth-child(1) {
        border-top-color: #ff6b6b;
        animation-delay: 0s;
      }

      .spinner-ring:nth-child(2) {
        border-right-color: #4ecdc4;
        animation-delay: 0.5s;
        width: 90%;
        height: 90%;
        top: 5%;
        left: 5%;
      }

      .spinner-ring:nth-child(3) {
        border-bottom-color: #45b7d1;
        animation-delay: 1s;
        width: 80%;
        height: 80%;
        top: 10%;
        left: 10%;
      }

      .spinner-ring:nth-child(4) {
        border-left-color: #f9ca24;
        animation-delay: 1.5s;
        width: 70%;
        height: 70%;
        top: 15%;
        left: 15%;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  },

  simple: {
    name: "简约圆环",
    description: "简洁的单色旋转圆环",
    html: '<div class="simple-spinner"></div>',
    css: `
      .simple-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(64, 110, 235, 0.2);
        border-top-color: #406eeb;
        border-radius: 50%;
        animation: simple-spin 1s linear infinite;
      }

      @keyframes simple-spin {
        to { transform: rotate(360deg); }
      }
    `
  },

  pulse: {
    name: "脉冲圆点",
    description: "呼吸式脉冲动画",
    html: '<div class="pulse-loader"></div>',
    css: `
      .pulse-loader {
        width: 20px;
        height: 20px;
        background: #406eeb;
        border-radius: 50%;
        animation: pulse-animation 1.5s ease-in-out infinite;
      }

      @keyframes pulse-animation {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.5);
          opacity: 0.5;
        }
      }
    `
  },

  blocks: {
    name: "跳动方块",
    description: "三个跳动的方块",
    html: `
      <div class="blocks-loader">
        <div class="block"></div>
        <div class="block"></div>
        <div class="block"></div>
      </div>
    `,
    css: `
      .blocks-loader {
        display: flex;
        gap: 8px;
      }

      .block {
        width: 15px;
        height: 15px;
        background: #406eeb;
        border-radius: 3px;
        animation: block-jump 1.4s ease-in-out infinite;
      }

      .block:nth-child(1) {
        animation-delay: 0s;
      }

      .block:nth-child(2) {
        animation-delay: 0.2s;
      }

      .block:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes block-jump {
        0%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
      }
    `
  }
};

/**
 * 基础样式（所有加载器共用）
 */
const BASE_STYLES = `
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  #app {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #ffffff;
  }

  html.dark #app {
    background: #1a1a1a;
  }
`;

/**
 * 生成完整的加载器 HTML（用于 document.write）
 */
export function generateLoaderHTML(type = "default") {
  const loader = LOADER_STYLES[type] || LOADER_STYLES.default;

  return `
    <style>${BASE_STYLES}${loader.css}</style>
    <body>
      <div id="app">${loader.html}</div>
    </body>
  `;
}

/**
 * 生成压缩的加载器代码（用于内联脚本）
 */
export function generateInlineLoaderScript() {
  // 压缩版本的样式配置
  const compressedStyles = {
    default: {
      html: '<div class="loader"></div>',
      css: '.loader,.loader::before,.loader::after{width:2.5em;height:2.5em;border-radius:50%;animation:load-animation 1.8s infinite ease-in-out;animation-fill-mode:both}.loader{position:relative;margin:0 auto;font-size:10px;color:#406eeb;text-indent:-9999em;transform:translateZ(0);animation-delay:-0.16s}.loader::before,.loader::after{position:absolute;top:0;content:""}.loader::before{left:-3.5em;animation-delay:-0.32s}.loader::after{left:3.5em}@keyframes load-animation{0%,80%,100%{box-shadow:0 2.5em 0 -1.3em}40%{box-shadow:0 2.5em 0 0}}'
    },
    rings: {
      html: '<div class="loading-spinner"><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div></div>',
      css: ".loading-spinner{position:relative;width:120px;height:120px}.spinner-ring{position:absolute;width:100%;height:100%;border:3px solid transparent;border-radius:50%;animation:spin 2s linear infinite}.spinner-ring:nth-child(1){border-top-color:#ff6b6b;animation-delay:0s}.spinner-ring:nth-child(2){border-right-color:#4ecdc4;animation-delay:0.5s;width:90%;height:90%;top:5%;left:5%}.spinner-ring:nth-child(3){border-bottom-color:#45b7d1;animation-delay:1s;width:80%;height:80%;top:10%;left:10%}.spinner-ring:nth-child(4){border-left-color:#f9ca24;animation-delay:1.5s;width:70%;height:70%;top:15%;left:15%}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}"
    },
    simple: {
      html: '<div class="simple-spinner"></div>',
      css: ".simple-spinner{width:50px;height:50px;border:4px solid rgba(64,110,235,0.2);border-top-color:#406eeb;border-radius:50%;animation:simple-spin 1s linear infinite}@keyframes simple-spin{to{transform:rotate(360deg)}}"
    },
    pulse: {
      html: '<div class="pulse-loader"></div>',
      css: ".pulse-loader{width:20px;height:20px;background:#406eeb;border-radius:50%;animation:pulse-animation 1.5s ease-in-out infinite}@keyframes pulse-animation{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.5}}"
    },
    blocks: {
      html: '<div class="blocks-loader"><div class="block"></div><div class="block"></div><div class="block"></div></div>',
      css: ".blocks-loader{display:flex;gap:8px}.block{width:15px;height:15px;background:#406eeb;border-radius:3px;animation:block-jump 1.4s ease-in-out infinite}.block:nth-child(1){animation-delay:0s}.block:nth-child(2){animation-delay:0.2s}.block:nth-child(3){animation-delay:0.4s}@keyframes block-jump{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-20px)}}"
    }
  };

  const baseCSS =
    "html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}#app{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#ffffff}html.dark #app{background:#1a1a1a}";

  return `
    (function() {
      var loaderType = localStorage.getItem('sys-loader-style') || 'default';
      var loaderStyles = ${JSON.stringify(compressedStyles)};
      var loader = loaderStyles[loaderType] || loaderStyles.default;
      document.write('<style>${baseCSS}' + loader.css + '</style>');
      document.write('<body><div id="app">' + loader.html + '</div>');
    })();
  `.trim();
}

/**
 * 在运行时更新加载器（用于预览）
 */
export function updateLoader(type = "default") {
  if (typeof window === "undefined") return;

  const app = document.getElementById("app");
  if (!app) return;

  const loader = LOADER_STYLES[type] || LOADER_STYLES.default;

  // 更新样式
  let styleTag = document.querySelector("#loader-style");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "loader-style";
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = BASE_STYLES + loader.css;

  // 更新 HTML
  app.innerHTML = loader.html;
}

/**
 * 获取所有可用的加载器样式列表
 */
export function getLoaderStylesList() {
  return Object.keys(LOADER_STYLES).map(key => ({
    value: key,
    label: LOADER_STYLES[key].name,
    description: LOADER_STYLES[key].description
  }));
}
