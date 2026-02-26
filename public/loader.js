/**
 * 统一的全屏加载动画管理器
 */
(function () {
  "use strict";

  var loaderType = localStorage.getItem("sys-loader-style") || "default";

  // 加载动画样式配置
  var loaderStyles = {
    default: {
      html: '<div class="loader"></div>',
      css: '.loader,.loader::before,.loader::after{width:2.5em;height:2.5em;border-radius:50%;animation:load-animation 1.8s infinite ease-in-out;animation-fill-mode:both}.loader{position:relative;margin:0 auto;font-size:10px;color:#406eeb;text-indent:-9999em;transform:translateZ(0);animation-delay:-0.16s}.loader::before,.loader::after{position:absolute;top:0;content:""}.loader::before{left:-3.5em;animation-delay:-0.32s}.loader::after{left:3.5em}@keyframes load-animation{0%,80%,100%{box-shadow:0 2.5em 0 -1.3em}40%{box-shadow:0 2.5em 0 0}}',
    },
    rings: {
      html: '<div class="loading-spinner"><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div><div class="spinner-ring"></div></div>',
      css: ".loading-spinner{position:relative;width:120px;height:120px}.spinner-ring{position:absolute;width:100%;height:100%;border:3px solid transparent;border-radius:50%;animation:spin 2s linear infinite}.spinner-ring:nth-child(1){border-top-color:#ff6b6b;animation-delay:0s}.spinner-ring:nth-child(2){border-right-color:#4ecdc4;animation-delay:0.5s;width:90%;height:90%;top:5%;left:5%}.spinner-ring:nth-child(3){border-bottom-color:#45b7d1;animation-delay:1s;width:80%;height:80%;top:10%;left:10%}.spinner-ring:nth-child(4){border-left-color:#f9ca24;animation-delay:1.5s;width:70%;height:70%;top:15%;left:15%}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}",
    },
    simple: {
      html: '<div class="simple-spinner"></div>',
      css: ".simple-spinner{width:50px;height:50px;border:4px solid rgba(64,110,235,0.2);border-top-color:#406eeb;border-radius:50%;animation:simple-spin 1s linear infinite}@keyframes simple-spin{to{transform:rotate(360deg)}}",
    },
    pulse: {
      html: '<div class="pulse-loader"></div>',
      css: ".pulse-loader{width:20px;height:20px;background:#406eeb;border-radius:50%;animation:pulse-animation 1.5s ease-in-out infinite}@keyframes pulse-animation{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.5}}",
    },
    blocks: {
      html: '<div class="blocks-loader"><div class="block"></div><div class="block"></div><div class="block"></div></div>',
      css: ".blocks-loader{display:flex;gap:8px}.block{width:15px;height:15px;background:#406eeb;border-radius:3px;animation:block-jump 1.4s ease-in-out infinite}.block:nth-child(1){animation-delay:0s}.block:nth-child(2){animation-delay:0.2s}.block:nth-child(3){animation-delay:0.4s}@keyframes block-jump{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-20px)}}",
    },
    minecraft: {
      html: '<div class="minecraft-loader"><div class="pickaxe">⛏️</div><div class="blocks"><div class="block"></div><div class="block"></div><div class="block"></div></div></div>',
      css: ".minecraft-loader{display:flex;flex-direction:column;align-items:center;gap:20px}.pickaxe{font-size:48px;animation:mining 0.8s ease-in-out infinite}@keyframes mining{0%,100%{transform:rotate(-20deg) translateY(0)}50%{transform:rotate(20deg) translateY(-10px)}}.blocks{display:flex;gap:8px}.block{width:20px;height:20px;background:linear-gradient(135deg,#8B4513 0%,#654321 100%);border:2px solid #000;animation:break-block 2.4s ease-in-out infinite}.block:nth-child(1){animation-delay:0s}.block:nth-child(2){animation-delay:0.8s}.block:nth-child(3){animation-delay:1.6s}@keyframes break-block{0%,100%{opacity:1;transform:scale(1)}80%{opacity:1;transform:scale(1)}90%{opacity:0.5;transform:scale(0.8)}95%{opacity:0;transform:scale(0)}}",
    },
    pokemon: {
      html: '<div class="pokemon-loader"><div class="charmander">🔥</div><div class="squirtle">💧</div></div>',
      css: ".pokemon-loader{position:relative;width:200px;height:60px}.charmander,.squirtle{position:absolute;font-size:40px;animation:chase 3s linear infinite}.charmander{left:0;animation-delay:0s}.squirtle{left:0;animation-delay:1.5s}@keyframes chase{0%{left:0;transform:scaleX(1)}45%{left:calc(100% - 40px);transform:scaleX(1)}50%{left:calc(100% - 40px);transform:scaleX(-1)}95%{left:0;transform:scaleX(-1)}100%{left:0;transform:scaleX(1)}}",
    },
    cyberpunk: {
      html: '<div class="cyberpunk-loader"><div class="glitch">LOADING</div><div class="bars"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div></div>',
      css: ".cyberpunk-loader{display:flex;flex-direction:column;align-items:center;gap:20px}.glitch{font-size:32px;font-weight:bold;color:#00ff41;text-shadow:2px 2px #ff00de,-2px -2px #00ffff;animation:glitch 1s infinite}@keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,2px)}40%{transform:translate(2px,-2px)}60%{transform:translate(-2px,-2px)}80%{transform:translate(2px,2px)}}.bars{display:flex;gap:8px}.bar{width:6px;height:40px;background:linear-gradient(180deg,#00ff41 0%,#ff00de 100%);animation:cyber-pulse 1.2s ease-in-out infinite}.bar:nth-child(1){animation-delay:0s}.bar:nth-child(2){animation-delay:0.2s}.bar:nth-child(3){animation-delay:0.4s}@keyframes cyber-pulse{0%,100%{height:20px;opacity:0.5}50%{height:50px;opacity:1}}",
    },
    book: {
      html: '<div class="book-loader"><div class="book"><div class="page"></div><div class="page"></div><div class="page"></div></div></div>',
      css: ".book-loader{perspective:1000px}.book{position:relative;width:80px;height:100px;transform-style:preserve-3d;animation:book-open 2s ease-in-out infinite}.page{position:absolute;width:100%;height:100%;background:linear-gradient(90deg,#f0f0f0 0%,#fff 50%,#f0f0f0 100%);border:2px solid #333;border-radius:0 8px 8px 0;transform-origin:left center;box-shadow:2px 2px 8px rgba(0,0,0,0.2)}.page:nth-child(1){animation:flip-page 2s ease-in-out infinite;animation-delay:0s}.page:nth-child(2){animation:flip-page 2s ease-in-out infinite;animation-delay:0.3s}.page:nth-child(3){animation:flip-page 2s ease-in-out infinite;animation-delay:0.6s}@keyframes flip-page{0%,100%{transform:rotateY(0deg)}50%{transform:rotateY(-180deg)}}@keyframes book-open{0%,100%{transform:rotateY(0deg)}50%{transform:rotateY(10deg)}}",
    },
    writing: {
      html: '<div class="writing-loader"><div class="pen">✒️</div><div class="paper"><div class="line"></div><div class="line"></div><div class="line"></div></div></div>',
      css: ".writing-loader{display:flex;flex-direction:column;align-items:center;gap:10px}.pen{font-size:36px;animation:pen-move 2s ease-in-out infinite}@keyframes pen-move{0%,100%{transform:translateX(-30px) rotate(-45deg)}50%{transform:translateX(30px) rotate(-45deg)}}.paper{width:120px;padding:20px;background:#fff;border:2px solid #333;border-radius:4px;box-shadow:2px 2px 8px rgba(0,0,0,0.1)}.line{height:3px;background:#333;margin:8px 0;border-radius:2px;animation:write-line 2s ease-in-out infinite}.line:nth-child(1){animation-delay:0s}.line:nth-child(2){animation-delay:0.3s}.line:nth-child(3){animation-delay:0.6s}@keyframes write-line{0%,100%{width:0}50%{width:100%}}",
    },
  };

  var loader = loaderStyles[loaderType] || loaderStyles.default;
  var baseCSS =
    "html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}#app{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#ffffff}html.dark #app{background:#1a1a1a}";

  document.write("<style>" + baseCSS + loader.css + "</style>");
  document.write('<body><div id="app">' + loader.html + "</div>");

  // 动态加载可选的 JS 文件（默认不启用）
  var enableOptionalScripts =
    localStorage.getItem("sys-enable-optional-scripts") === "true";
  if (enableOptionalScripts) {
    var optionalScripts = ["/adapter.min.js", "/webrtcstreamer.js"];
    optionalScripts.forEach(function (src) {
      fetch(src, { method: "HEAD" })
        .then(function (response) {
          if (response.ok) {
            var script = document.createElement("script");
            script.src = src;
            script.async = true;
            document.body.appendChild(script);
          }
        })
        .catch(function () {});
    });
  }
})();
