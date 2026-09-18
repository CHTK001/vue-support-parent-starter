const { parse, compileScript, compileTemplate } = require("vue/compiler-sfc");
const fs = require("fs");
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, "utf8");
  const { descriptor, errors } = parse(src);
  if (errors.length) { console.log(f, "PARSE ERRORS", errors); process.exit(1); }
  const s = compileScript(descriptor, { id: "x" });
  const t = compileTemplate({ source: descriptor.template.content, filename: f, id: "x", compilerOptions: { bindingMetadata: s.bindings } });
  console.log(f, t.errors.length ? t.errors : "ok");
  if (t.errors.length) process.exit(1);
}
console.log("OK");
