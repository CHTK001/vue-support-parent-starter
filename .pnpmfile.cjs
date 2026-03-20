/**
 * pnpm hooks file
 * 用于在安装依赖时修改包的配置
 */

function readPackage(pkg, context) {
  // 将 sharp 和 ttf2woff2 标记为可选依赖
  if (pkg.name === 'sharp' || pkg.name === 'ttf2woff2') {
    context.log(`Making ${pkg.name} optional to prevent installation failures`)
    pkg.optional = true
  }

  // 如果某个包依赖了 sharp，将其标记为可选
  if (pkg.dependencies && pkg.dependencies.sharp) {
    context.log(`Making sharp optional in ${pkg.name}`)
    pkg.optionalDependencies = pkg.optionalDependencies || {}
    pkg.optionalDependencies.sharp = pkg.dependencies.sharp
    delete pkg.dependencies.sharp
  }

  // 修复 vite 版本兼容性问题
  if (pkg.peerDependencies) {
    // 允许 vite 7.x
    if (pkg.peerDependencies.vite) {
      if (pkg.peerDependencies.vite.includes('^5.0.0') || 
          pkg.peerDependencies.vite.includes('^6.0.0')) {
        pkg.peerDependencies.vite = '^5.0.0 || ^6.0.0 || ^7.0.0'
      }
    }
    
    // 允许 stylelint 16.x
    if (pkg.peerDependencies.stylelint) {
      if (pkg.peerDependencies.stylelint.includes('^17.0.0') ||
          pkg.peerDependencies.stylelint.includes('^18.0.0')) {
        pkg.peerDependencies.stylelint = '^16.0.0 || ^17.0.0 || ^18.0.0'
      }
    }
    
    // 放宽 onnxruntime-web 版本要求
    if (pkg.peerDependencies['onnxruntime-web']) {
      pkg.peerDependencies['onnxruntime-web'] = '>=1.21.0'
    }
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
