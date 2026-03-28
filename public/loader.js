/**
 * 统一的全屏加载动画入口
 * 运行时优先读取 /loader-config.js 注入的全局配置，缺失时回退到最小默认样式。
 */
(function () {
  "use strict";

  var LOADER_STYLE_ID = "app-loader-style";
  var LOADER_CONTAINER_ID = "app-loader";
  var LOADER_SHELL_CLASS = "sys-loader-shell";
  var LOADER_SHELL_STYLE_TEXT =
    ".sys-loader-shell{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%}";

  function createFallbackConfig() {
    return {
      baseStyleText:
        "html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}" +
        "#app{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#fff}" +
        "html.dark #app{background:#1a1a1a}" +
        "#app-loader{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:32px;background:radial-gradient(circle at top,rgba(64,110,235,.08),transparent 44%),#fff;z-index:9999}" +
        "html.dark #app-loader{background:radial-gradient(circle at top,rgba(64,110,235,.14),transparent 44%),#111827}",
      definitions: [
        {
          key: "default",
          name: "三个圆点",
          description: "经典的三点跳动，适合通用加载页",
          previewScale: 0.46,
          html: '<div class="sys-loader-default"></div>',
          css: ".sys-loader-default,.sys-loader-default::before,.sys-loader-default::after{width:2.5em;height:2.5em;border-radius:50%;animation:sys-loader-load-animation 1.8s infinite ease-in-out;animation-fill-mode:both}.sys-loader-default{position:relative;margin:0 auto;font-size:10px;color:#406eeb;text-indent:-9999em;transform:translateZ(0);animation-delay:-0.16s}.sys-loader-default::before,.sys-loader-default::after{position:absolute;top:0;content:''}.sys-loader-default::before{left:-3.5em;animation-delay:-0.32s}.sys-loader-default::after{left:3.5em}@keyframes sys-loader-load-animation{0%,80%,100%{box-shadow:0 2.5em 0 -1.3em}40%{box-shadow:0 2.5em 0 0}}",
        },
      ],
    };
  }

  function resolveConfig() {
    var runtimeConfig = window.__SYS_LOADER_CONFIG__;
    if (
      runtimeConfig &&
      Array.isArray(runtimeConfig.definitions) &&
      runtimeConfig.definitions.length > 0
    ) {
      return runtimeConfig;
    }
    return createFallbackConfig();
  }

  function createLoaderMap(definitions) {
    return definitions.reduce(function (map, definition) {
      if (definition && definition.key) {
        map[definition.key] = definition;
      }
      return map;
    }, {});
  }

  function createLoaderMarkup(loader) {
    return (
      '<div class="' +
      LOADER_SHELL_CLASS +
      '" data-loader-key="' +
      String(loader.key || "default") +
      '">' +
      String(loader.html || "") +
      "</div>"
    );
  }

  function ensureStyleElement(styleText) {
    var existingStyle = document.getElementById(LOADER_STYLE_ID);
    if (existingStyle) {
      existingStyle.textContent = styleText;
      return existingStyle;
    }

    var style = document.createElement("style");
    style.id = LOADER_STYLE_ID;
    style.textContent = styleText;
    (document.head || document.documentElement).appendChild(style);
    return style;
  }

  function mountWhenBodyReady(fn) {
    if (document.body) {
      fn();
      return;
    }

    var mounted = false;
    var run = function () {
      if (mounted || !document.body) {
        return;
      }
      mounted = true;
      fn();
    };

    document.addEventListener("DOMContentLoaded", run, { once: true });

    var timer = window.setInterval(function () {
      if (!document.body) {
        return;
      }
      window.clearInterval(timer);
      run();
    }, 16);
  }

  function ensureLoaderElement(loaderMarkup) {
    mountWhenBodyReady(function () {
      if (document.getElementById(LOADER_CONTAINER_ID)) {
        return;
      }

      var loader = document.createElement("div");
      loader.id = LOADER_CONTAINER_ID;
      loader.innerHTML = loaderMarkup;
      document.body.insertBefore(loader, document.body.firstChild || null);
    });
  }

  function appendOptionalScript(src) {
    mountWhenBodyReady(function () {
      if (
        document.querySelector('script[src="' + src + '"]')
      ) {
        return;
      }

      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      (document.body || document.head || document.documentElement).appendChild(
        script,
      );
    });
  }

  var loaderType = localStorage.getItem("sys-loader-style") || "default";
  var config = resolveConfig();
  var definitions = Array.isArray(config.definitions) ? config.definitions : [];
  var fallbackConfig = createFallbackConfig();
  var fallbackLoader = fallbackConfig.definitions[0];
  var loaderMap = createLoaderMap(definitions);
  var loader =
    loaderMap[loaderType] ||
    loaderMap.default ||
    definitions[0] ||
    fallbackLoader;

  ensureStyleElement(
    String(config.baseStyleText || fallbackConfig.baseStyleText) +
      LOADER_SHELL_STYLE_TEXT +
      String(loader.css || fallbackLoader.css),
  );
  ensureLoaderElement(createLoaderMarkup(loader));

  window.hideAppLoader = function () {
    var appLoader = document.getElementById(LOADER_CONTAINER_ID);
    if (appLoader) {
      appLoader.style.display = "none";
    }
  };

  var enableOptionalScripts =
    localStorage.getItem("sys-enable-optional-scripts") === "true";
  if (enableOptionalScripts) {
    var optionalScripts = ["/adapter.min.js", "/webrtcstreamer.js"];
    optionalScripts.forEach(function (src) {
      fetch(src, { method: "HEAD" })
        .then(function (response) {
          if (response.ok) {
            appendOptionalScript(src);
          }
        })
        .catch(function () {});
    });
  }
})();
