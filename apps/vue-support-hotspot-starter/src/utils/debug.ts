import { addListener, launch, crashBrowserCurrentTab } from "devtools-detector";
const view = document.createElement("div");
document.body.appendChild(view);

export const loopDebugger = () => {
  (() => {
    function block() {
      setInterval(() => {
        (function () {
          return false;
        })
          ["constructor"]("debugger")
          ["call"]();
      }, 50);
    }
    try {
      block();
    } catch (err) {}
  })();
};

export const redirectDebugger = () => {
  addListener(isOpen => {
    if (isOpen) {
      setTimeout(crashBrowserCurrentTab, 10);
      // window.location.replace("https://www.baidu.com");
    }
  });
  // 2. launch detect
  launch();
};
