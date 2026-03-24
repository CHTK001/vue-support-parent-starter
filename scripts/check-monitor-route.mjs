import fs from "node:fs";

const browserWs =
  "ws://127.0.0.1:9222/devtools/browser/3214c86d-5ea6-4514-b4f2-4d2f8b487275";
const route = process.argv[2] || "/home";
const screenshotPath = process.argv[3] || "";

const ws = new WebSocket(browserWs);
let id = 0;
let activeSessionId = null;
const pending = new Map();
const collectedErrors = [];

function send(method, params = {}, sessionId) {
  const msg = { id: ++id, method, params };
  if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
  return new Promise((resolve, reject) =>
    pending.set(id, { resolve, reject }),
  );
}

async function evalExpr(expression) {
  const res = await send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    activeSessionId,
  );
  return res.result?.value;
}

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
    return;
  }
  if (msg.sessionId !== activeSessionId) return;
  if (msg.method === "Runtime.exceptionThrown") {
    collectedErrors.push(
      msg.params.exceptionDetails?.exception?.description ||
        msg.params.exceptionDetails?.text,
    );
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    collectedErrors.push(
      `${msg.params.entry.text} ${msg.params.entry.url || ""}`.trim(),
    );
  }
};

ws.onopen = async () => {
  try {
    const create = await send("Target.createTarget", {
      url: "http://127.0.0.1:8848/#/home",
    });
    const attach = await send("Target.attachToTarget", {
      targetId: create.targetId,
      flatten: true,
    });
    activeSessionId = attach.sessionId;
    await send("Runtime.enable", {}, activeSessionId);
    await send("Page.enable", {}, activeSessionId);
    await send("Log.enable", {}, activeSessionId);
    await new Promise((r) => setTimeout(r, 10000));

    await evalExpr(`(async()=>{ 
      const app=document.getElementById('app').__vue_app__;
      const router=app?.config?.globalProperties?.$router;
      if (!router) return false;
      try { await router.push('${route}'); } catch {}
      return true;
    })()`);

    await new Promise((r) => setTimeout(r, 8000));

    const info = await evalExpr(`(()=>{ 
      const app=document.getElementById('app').__vue_app__;
      const router=app?.config?.globalProperties?.$router;
      return {
        hasApp: !!app,
        current: router?.currentRoute?.value?.fullPath || null,
        matched: router?.currentRoute?.value?.matched?.map(x=>x.path) || [],
        title: document.title,
        text: (document.body.innerText||'').slice(0,800)
      };
    })()`);

    if (screenshotPath) {
      const shot = await send(
        "Page.captureScreenshot",
        { format: "png" },
        activeSessionId,
      );
      fs.writeFileSync(screenshotPath, Buffer.from(shot.data, "base64"));
    }

    console.log(
      JSON.stringify(
        {
          route,
          info,
          errorCount: collectedErrors.length,
          errors: collectedErrors.slice(0, 10),
        },
        null,
        2,
      ),
    );

    await send("Target.closeTarget", { targetId: create.targetId });
    ws.close();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
    ws.close();
  }
};

ws.onclose = () => process.exit(process.exitCode || 0);
