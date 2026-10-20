const { parse, compileTemplate } = require('D:/ch/project/vue-support-parent-starter/node_modules/.pnpm/@vue+compiler-sfc@3.5.40/node_modules/@vue/compiler-sfc');
const fs = require('fs');

const f = 'D:/ch/project/vue-support-parent-starter/pages/datasource/src/views/console/ElasticsearchManageView.vue';
const src = fs.readFileSync(f, 'utf8');
const parsed = parse(src, { filename: f });
if (parsed.errors && parsed.errors.length) {
  console.log('PARSE_ERROR');
  parsed.errors.forEach(e => console.log(String(e.message || e), e.loc && e.loc.start));
  process.exit(1);
}
if (!parsed.descriptor.template) {
  console.log('NO_TEMPLATE');
  process.exit(1);
}
const compiled = compileTemplate({
  source: parsed.descriptor.template.content,
  filename: f,
  id: f,
  scoped: false,
});
if (compiled.errors && compiled.errors.length) {
  console.log('TEMPLATE_ERROR_COUNT=' + compiled.errors.length);
  compiled.errors.slice(0, 10).forEach(e => console.log(String(e.message || e), e.loc && e.loc.start));
} else {
  console.log('TEMPLATE_OK');
}