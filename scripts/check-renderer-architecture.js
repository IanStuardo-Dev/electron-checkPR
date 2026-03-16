const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const rendererRoot = path.join(projectRoot, 'src', 'renderer');
const featuresRoot = path.join(rendererRoot, 'features');
const importPattern = /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function toProjectRelative(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return sourceExtensions.includes(path.extname(entry.name)) ? [fullPath] : [];
  });
}

function extractImports(content) {
  return Array.from(content.matchAll(importPattern), (match) => match[1] || match[2]).filter(Boolean);
}

function resolveRelativeImport(importerFile, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const basePath = path.resolve(path.dirname(importerFile), specifier);
  const candidates = [
    basePath,
    ...sourceExtensions.map((extension) => `${basePath}${extension}`),
    ...sourceExtensions.map((extension) => path.join(basePath, `index${extension}`)),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function getFeatureName(filePath) {
  const relativePath = toProjectRelative(filePath);
  const match = relativePath.match(/^src\/renderer\/features\/([^/]+)\//);
  return match ? match[1] : null;
}

function isFeatureRootImport(resolvedFile, featureName) {
  const featureRoot = path.join(featuresRoot, featureName);
  return [
    path.join(featureRoot, 'index.ts'),
    path.join(featureRoot, 'index.tsx'),
    path.join(featureRoot, 'index.js'),
    path.join(featureRoot, 'index.jsx'),
  ].includes(resolvedFile);
}

const files = walk(rendererRoot);
const errors = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const imports = extractImports(content);
  const importerRelative = toProjectRelative(file);
  const sourceFeature = getFeatureName(file);
  const isAppLayer = importerRelative.startsWith('src/renderer/app/');

  for (const specifier of imports) {
    if (specifier.includes('/services/') || specifier.includes('/main/')) {
      errors.push(`${importerRelative}: evita importar capas externas desde renderer -> ${specifier}`);
      continue;
    }

    const resolvedTarget = resolveRelativeImport(file, specifier);
    if (!resolvedTarget) {
      continue;
    }

    const targetRelative = toProjectRelative(resolvedTarget);
    if (!targetRelative.startsWith('src/renderer/features/')) {
      continue;
    }

    const targetFeature = getFeatureName(resolvedTarget);
    if (!targetFeature) {
      continue;
    }

    if (isAppLayer && !isFeatureRootImport(resolvedTarget, targetFeature)) {
      errors.push(`${importerRelative}: app debe consumir la API publica de la feature '${targetFeature}' -> ${specifier}`);
      continue;
    }

    if (sourceFeature && sourceFeature !== targetFeature && !isFeatureRootImport(resolvedTarget, targetFeature)) {
      errors.push(`${importerRelative}: feature '${sourceFeature}' no debe importar internals de '${targetFeature}' -> ${specifier}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Renderer architecture violations found:\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Renderer architecture check passed.');
