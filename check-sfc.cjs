const { parse, compileTemplate } = require('D:/ch/project/vue-support-parent-starter/node_modules/.pnpm/@vue+compiler-sfc@3.5.40/node_modules/@vue/compiler-sfc');
const fs = require('fs');

const files = [
  'D:/ch/project/vue-support-parent-starter/apps/vue-support-monitor-starter/src/views/HostDetailView.vue',
  'D:/ch/project/vue-support-parent-starter/apps/vue-support-monitor-starter/src/views/HostProfileView.vue',
];

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const parsed = parse(src, { filename: f });
  if (parsed.errors && parsed.errors.length) {
    console.log('PARSE_ERROR', f, parsed.errors.map(e => e.message));
  }
  if (!parsed.descriptor.template) {
    console.log('NO_TEMPLATE', f);
    continue;
  }
  const tpl = parsed.descriptor.template;
  const compiled = compileTemplate({
    source: tpl.content,
    filename: f,
    id: f,
    scoped: false,
  });
  if (compiled.errors && compiled.errors.length) {
    console.log('TEMPLATE_ERROR', f, compiled.errors.map(e => String(e.message || e)));
  } else {
    console.log('TEMPLATE_OK', f);
  }
}
