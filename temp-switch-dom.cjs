const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto("http://localhost:8090/#/debug/ReSwitch", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(12000);
  const d = await p.evaluate(() => {
    const items = [...document.querySelectorAll(".el-form-item")].map(fi => {
      const label = (fi.querySelector(".prop-field-name")?.textContent || "").trim();
      const ctrl = fi.querySelector(".el-form-item__content");
      return { label, ctrlClass: ctrl ? String(ctrl.firstElementChild?.className || "").slice(0,90) : null };
    });
    return { items, preview: String(document.querySelector(".debug-preview, .preview, main")?.className || "") };
  });
  console.log(JSON.stringify(d, null, 1));
  await b.close();
})();
