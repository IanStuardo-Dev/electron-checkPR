const { execFileSync } = require('child_process');
const path = require('path');

const projectRoot = process.cwd();
const hooksPath = path.join(projectRoot, '.githooks');

try {
  execFileSync('git', ['config', 'core.hooksPath', hooksPath], { stdio: 'ignore' });
  console.log(`Git hooks configured at ${hooksPath}`);
} catch (error) {
  console.warn('No se pudo configurar core.hooksPath automaticamente.');
  console.warn('Ejecuta manualmente: git config core.hooksPath .githooks');
}
