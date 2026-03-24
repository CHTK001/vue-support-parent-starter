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
    html: '<div class="sys-loader-default"></div>',
    css: `
      .sys-loader-default,
      .sys-loader-default::before,
      .sys-loader-default::after {
        width: 2.5em;
        height: 2.5em;
        border-radius: 50%;
        animation: sys-loader-load-animation 1.8s infinite ease-in-out;
        animation-fill-mode: both;
      }

      .sys-loader-default {
        position: relative;
        margin: 0 auto;
        font-size: 10px;
        color: #406eeb;
        text-indent: -9999em;
        transform: translateZ(0);
        animation-delay: -0.16s;
      }

      .sys-loader-default::before,
      .sys-loader-default::after {
        position: absolute;
        top: 0;
        content: "";
      }

      .sys-loader-default::before {
        left: -3.5em;
        animation-delay: -0.32s;
      }

      .sys-loader-default::after {
        left: 3.5em;
      }

      @keyframes sys-loader-load-animation {
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
      <div class="sys-loader-loading-spinner">
        <div class="sys-loader-spinner-ring"></div>
        <div class="sys-loader-spinner-ring"></div>
        <div class="sys-loader-spinner-ring"></div>
        <div class="sys-loader-spinner-ring"></div>
      </div>
    `,
    css: `
      .sys-loader-loading-spinner {
        position: relative;
        width: 120px;
        height: 120px;
      }

      .sys-loader-spinner-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid transparent;
        border-radius: 50%;
        animation: sys-loader-spin 2s linear infinite;
      }

      .sys-loader-spinner-ring:nth-child(1) {
        border-top-color: #ff6b6b;
        animation-delay: 0s;
      }

      .sys-loader-spinner-ring:nth-child(2) {
        border-right-color: #4ecdc4;
        animation-delay: 0.5s;
        width: 90%;
        height: 90%;
        top: 5%;
        left: 5%;
      }

      .sys-loader-spinner-ring:nth-child(3) {
        border-bottom-color: #45b7d1;
        animation-delay: 1s;
        width: 80%;
        height: 80%;
        top: 10%;
        left: 10%;
      }

      .sys-loader-spinner-ring:nth-child(4) {
        border-left-color: #f9ca24;
        animation-delay: 1.5s;
        width: 70%;
        height: 70%;
        top: 15%;
        left: 15%;
      }

      @keyframes sys-loader-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  },

  simple: {
    name: "简约圆环",
    description: "简洁的单色旋转圆环",
    html: '<div class="sys-loader-simple-spinner"></div>',
    css: `
      .sys-loader-simple-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(64, 110, 235, 0.2);
        border-top-color: #406eeb;
        border-radius: 50%;
        animation: sys-loader-simple-spin 1s linear infinite;
      }

      @keyframes sys-loader-simple-spin {
        to { transform: rotate(360deg); }
      }
    `
  },

  pulse: {
    name: "脉冲圆点",
    description: "呼吸式脉冲动画",
    html: '<div class="sys-loader-pulse-loader"></div>',
    css: `
      .sys-loader-pulse-loader {
        width: 20px;
        height: 20px;
        background: #406eeb;
        border-radius: 50%;
        animation: sys-loader-pulse-animation 1.5s ease-in-out infinite;
      }

      @keyframes sys-loader-pulse-animation {
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
  <div class="sys-loader-blocks-loader">
  <div class="sys-loader-block"></div>
  <div class="sys-loader-block"></div>
  <div class="sys-loader-block"></div>
  </div>
  `,
    css: `
  .sys-loader-blocks-loader {
  display: flex;
  gap: 8px;
  }

  .sys-loader-block {
  width: 15px;
  height: 15px;
  background: #406eeb;
  border-radius: 3px;
  animation: sys-loader-block-jump 1.4s ease-in-out infinite;
  }

  .sys-loader-block:nth-child(1) {
  animation-delay: 0s;
  }

  .sys-loader-block:nth-child(2) {
  animation-delay: 0.2s;
  }

  .sys-loader-block:nth-child(3) {
  animation-delay: 0.4s;
  }

  @keyframes sys-loader-block-jump {
  0%, 80%, 100% {
  transform: translateY(0);
  }
  40% {
  transform: translateY(-20px);
  }
  }
  `
  },

  book: {
    name: "翻书",
    description: "立体翻页的书本加载动画",
    html: `
      <div class="sys-loader-book-loader">
        <div class="sys-loader-book">
          <div class="sys-loader-page"></div>
          <div class="sys-loader-page"></div>
          <div class="sys-loader-page"></div>
        </div>
      </div>
    `,
    css: `
      .sys-loader-book-loader {
        perspective: 1000px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sys-loader-book-loader .sys-loader-book {
        position: relative;
        width: 80px;
        height: 100px;
        transform-style: preserve-3d;
        transform: rotateY(-8deg);
      }

      .sys-loader-book-loader .sys-loader-page {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #f0f0f0 0%, #ffffff 50%, #f0f0f0 100%);
        border: 2px solid #333333;
        border-radius: 0 8px 8px 0;
        transform-origin: left center;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
      }

      .sys-loader-book-loader .sys-loader-page:nth-child(1) {
        animation: sys-loader-flip-page 1.8s ease-in-out infinite;
        animation-delay: 0s;
      }

      .sys-loader-book-loader .sys-loader-page:nth-child(2) {
        animation: sys-loader-flip-page 1.8s ease-in-out infinite;
        animation-delay: 0.3s;
      }

      .sys-loader-book-loader .sys-loader-page:nth-child(3) {
        animation: sys-loader-flip-page 1.8s ease-in-out infinite;
        animation-delay: 0.6s;
      }

      @keyframes sys-loader-flip-page {
        0% {
          transform: rotateY(0deg);
          opacity: 1;
        }
        60% {
          transform: rotateY(-160deg);
          opacity: 1;
        }
        100% {
          transform: rotateY(-180deg);
          opacity: 0;
        }
      }
    `
  },

  writing: {
    name: "书写加载条",
    description: "多行书写完成后翻页再继续书写",
    html: `
      <div class="sys-loader-writing-loader">
        <div class="sys-loader-pen">✒️</div>
        <div class="sys-loader-paper">
          <div class="sys-loader-line"></div>
          <div class="sys-loader-line"></div>
          <div class="sys-loader-line"></div>
          <div class="sys-loader-line"></div>
        </div>
      </div>
    `,
    css: `
      .sys-loader-writing-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .sys-loader-writing-loader .sys-loader-pen {
        font-size: 36px;
        animation: sys-loader-pen-move 4s ease-in-out infinite;
      }

      .sys-loader-writing-loader .sys-loader-paper {
        width: 140px;
        padding: 20px;
        background: #ffffff;
        border: 2px solid #333333;
        border-radius: 4px;
        box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
        transform-origin: left center;
        animation: page-turn 4s ease-in-out infinite;
      }

      .sys-loader-writing-loader .sys-loader-line {
        height: 3px;
        background: #e5e7eb;
        margin: 6px 0;
        border-radius: 999px;
        overflow: hidden;
      }

      .sys-loader-writing-loader .sys-loader-line::before {
        content: "";
        display: block;
        width: 0;
        height: 100%;
        background: #406eeb;
        border-radius: inherit;
        animation: sys-loader-write-line 4s ease-in-out infinite;
      }

      .sys-loader-writing-loader .sys-loader-line:nth-child(1)::before {
        animation-delay: 0s;
      }

      .sys-loader-writing-loader .sys-loader-line:nth-child(2)::before {
        animation-delay: 0.4s;
      }

      .sys-loader-writing-loader .sys-loader-line:nth-child(3)::before {
        animation-delay: 0.8s;
      }

      .sys-loader-writing-loader .sys-loader-line:nth-child(4)::before {
        animation-delay: 1.2s;
      }

      @keyframes sys-loader-pen-move {
        0% {
          transform: translate(-40px, 0) rotate(-40deg);
        }
        40% {
          transform: translate(40px, 8px) rotate(-40deg);
        }
        50% {
          transform: translate(40px, 8px) rotate(-40deg);
        }
        90% {
          transform: translate(-40px, -6px) rotate(-40deg);
        }
        100% {
          transform: translate(-40px, -6px) rotate(-40deg);
        }
      }

      @keyframes sys-loader-write-line {
        0% {
          width: 0;
        }
        40% {
          width: 100%;
        }
        60% {
          width: 100%;
        }
        100% {
          width: 100%;
        }
      }

      @keyframes page-turn {
        0% {
          transform: rotateY(0deg);
        }
        70% {
          transform: rotateY(0deg);
        }
        90% {
          transform: rotateY(-170deg);
        }
        100% {
          transform: rotateY(-180deg);
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
      html: '<div class="sys-loader-default"></div>',
      css: '.sys-loader-default,.sys-loader-default::before,.sys-loader-default::after{width:2.5em;height:2.5em;border-radius:50%;animation: sys-loader-load-animation 1.8s infinite ease-in-out;animation-fill-mode:both}.sys-loader-default{position:relative;margin:0 auto;font-size:10px;color:#406eeb;text-indent:-9999em;transform:translateZ(0);animation-delay:-0.16s}.sys-loader-default::before,.sys-loader-default::after{position:absolute;top:0;content:""}.sys-loader-default::before{left:-3.5em;animation-delay:-0.32s}.sys-loader-default::after{left:3.5em}@keyframes sys-loader-load-animation{0%,80%,100%{box-shadow:0 2.5em 0 -1.3em}40%{box-shadow:0 2.5em 0 0}}'
    },
    rings: {
      html: '<div class="sys-loader-loading-spinner"><div class="sys-loader-spinner-ring"></div><div class="sys-loader-spinner-ring"></div><div class="sys-loader-spinner-ring"></div><div class="sys-loader-spinner-ring"></div></div>',
      css: ".sys-loader-loading-spinner{position:relative;width:120px;height:120px}.sys-loader-spinner-ring{position:absolute;width:100%;height:100%;border:3px solid transparent;border-radius:50%;animation: sys-loader-spin 2s linear infinite}.sys-loader-spinner-ring:nth-child(1){border-top-color:#ff6b6b;animation-delay:0s}.sys-loader-spinner-ring:nth-child(2){border-right-color:#4ecdc4;animation-delay:0.5s;width:90%;height:90%;top:5%;left:5%}.sys-loader-spinner-ring:nth-child(3){border-bottom-color:#45b7d1;animation-delay:1s;width:80%;height:80%;top:10%;left:10%}.sys-loader-spinner-ring:nth-child(4){border-left-color:#f9ca24;animation-delay:1.5s;width:70%;height:70%;top:15%;left:15%}@keyframes sys-loader-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}"
    },
    simple: {
      html: '<div class="sys-loader-simple-spinner"></div>',
      css: ".sys-loader-simple-spinner{width:50px;height:50px;border:4px solid rgba(64,110,235,0.2);border-top-color:#406eeb;border-radius:50%;animation: sys-loader-simple-spin 1s linear infinite}@keyframes sys-loader-simple-spin{to{transform:rotate(360deg)}}"
    },
    pulse: {
      html: '<div class="sys-loader-pulse-loader"></div>',
      css: ".sys-loader-pulse-loader{width:20px;height:20px;background:#406eeb;border-radius:50%;animation: sys-loader-pulse-animation 1.5s ease-in-out infinite}@keyframes sys-loader-pulse-animation{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.5}}"
    },
    blocks: {
      html: '<div class="sys-loader-blocks-loader"><div class="sys-loader-block"></div><div class="sys-loader-block"></div><div class="sys-loader-block"></div></div>',
      css: ".sys-loader-blocks-loader{display:flex;gap:8px}.sys-loader-block{width:15px;height:15px;background:#406eeb;border-radius:3px;animation: sys-loader-block-jump 1.4s ease-in-out infinite}.sys-loader-block:nth-child(1){animation-delay:0s}.sys-loader-block:nth-child(2){animation-delay:0.2s}.sys-loader-block:nth-child(3){animation-delay:0.4s}@keyframes sys-loader-block-jump{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-20px)}}"
    },
    book: {
      html: '<div class="sys-loader-book-loader"><div class="sys-loader-book"><div class="sys-loader-page"></div><div class="sys-loader-page"></div><div class="sys-loader-page"></div></div></div>',
      css: ".sys-loader-book-loader{perspective:1000px;display:flex;align-items:center;justify-content:center}.sys-loader-book-loader .sys-loader-book{position:relative;width:80px;height:100px;transform-style:preserve-3d;transform:rotateY(-8deg)}.sys-loader-book-loader .sys-loader-page{position:absolute;width:100%;height:100%;background:linear-gradient(90deg,#f0f0f0 0%,#fff 50%,#f0f0f0 100%);border:2px solid #333;border-radius:0 8px 8px 0;transform-origin:left center;box-shadow:2px 2px 8px rgba(0,0,0,0.2)}.sys-loader-book-loader .sys-loader-page:nth-child(1){animation: sys-loader-flip-page 1.8s ease-in-out infinite;animation-delay:0s}.sys-loader-book-loader .sys-loader-page:nth-child(2){animation: sys-loader-flip-page 1.8s ease-in-out infinite;animation-delay:0.3s}.sys-loader-book-loader .sys-loader-page:nth-child(3){animation: sys-loader-flip-page 1.8s ease-in-out infinite;animation-delay:0.6s}@keyframes sys-loader-flip-page{0%{transform:rotateY(0deg);opacity:1}60%{transform:rotateY(-160deg);opacity:1}100%{transform:rotateY(-180deg);opacity:0}}"
    },
    writing: {
      html: '<div class=\"writing-loader\"><div class=\"pen\">✒️</div><div class=\"paper\"><div class=\"line\"></div><div class=\"line\"></div><div class=\"line\"></div><div class=\"line\"></div></div></div>',
      css: '.sys-loader-writing-loader{display:flex;flex-direction:column;align-items:center;gap:10px}.sys-loader-writing-loader .sys-loader-pen{font-size:36px;animation: sys-loader-pen-move 4s ease-in-out infinite}.sys-loader-writing-loader .sys-loader-paper{width:140px;padding:20px;background:#fff;border:2px solid #333;border-radius:4px;box-shadow:2px 2px 8px rgba(0,0,0,0.1);transform-origin:left center;animation:page-turn 4s ease-in-out infinite}.sys-loader-writing-loader .sys-loader-line{height:3px;background:#e5e7eb;margin:6px 0;border-radius:999px;overflow:hidden}.sys-loader-writing-loader .sys-loader-line::before{content:"";display:block;width:0;height:100%;background:#406eeb;border-radius:inherit;animation: sys-loader-write-line 4s ease-in-out infinite}.sys-loader-writing-loader .sys-loader-line:nth-child(1)::before{animation-delay:0s}.sys-loader-writing-loader .sys-loader-line:nth-child(2)::before{animation-delay:0.4s}.sys-loader-writing-loader .sys-loader-line:nth-child(3)::before{animation-delay:0.8s}.sys-loader-writing-loader .sys-loader-line:nth-child(4)::before{animation-delay:1.2s}@keyframes sys-loader-pen-move{0%{transform:translate(-40px,0) rotate(-40deg)}40%{transform:translate(40px,8px) rotate(-40deg)}50%{transform:translate(40px,8px) rotate(-40deg)}90%{transform:translate(-40px,-6px) rotate(-40deg)}100%{transform:translate(-40px,-6px) rotate(-40deg)}}@keyframes sys-loader-write-line{0%{width:0}40%{width:100%}60%{width:100%}100%{width:100%}}@keyframes page-turn{0%{transform:rotateY(0deg)}70%{transform:rotateY(0deg)}90%{transform:rotateY(-170deg)}100%{transform:rotateY(-180deg)}}'
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
