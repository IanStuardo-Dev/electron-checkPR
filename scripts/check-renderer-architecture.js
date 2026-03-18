const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, 'src');
const rendererRoot = path.join(srcRoot, 'renderer');
const featuresRoot = path.join(rendererRoot, 'features');
const importPattern = /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const disallowedSpecifierPatterns = [
  {
    importerLayer: 'renderer',
    regex: /(^|\/)src\/(?:main|services)\//,
    message: 'renderer no debe importar main/services',
  },
  {
    importerLayer: 'main',
    regex: /(^|\/)src\/renderer\//,
    message: 'main no debe importar renderer',
  },
  {
    importerLayer: 'services',
    regex: /(^|\/)src\/(?:renderer|main)\//,
    message: 'services no debe importar renderer/main',
  },
  {
    importerLayer: 'shared',
    regex: /(^|\/)src\/(?:renderer|main|services)\//,
    message: 'shared debe mantenerse desacoplado de capas de aplicacion',
  },
  {
    importerLayer: 'types',
    regex: /(^|\/)src\/(?:renderer|main|services)\//,
    message: 'types debe mantenerse desacoplado de capas de aplicacion',
  },
];

function toProjectRelative(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

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

function classifyLayer(filePath) {
  const relativePath = toProjectRelative(filePath);

  if (relativePath.startsWith('src/renderer/')) {
    return 'renderer';
  }

  if (relativePath.startsWith('src/main/')) {
    return 'main';
  }

  if (relativePath.startsWith('src/services/')) {
    return 'services';
  }

  if (relativePath.startsWith('src/shared/')) {
    return 'shared';
  }

  if (relativePath.startsWith('src/types/')) {
    return 'types';
  }

  return 'other';
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

function validateLayerImport(importerRelative, importerLayer, resolvedTarget, errors) {
  const targetLayer = classifyLayer(resolvedTarget);

  if (importerLayer === 'renderer' && (targetLayer === 'main' || targetLayer === 'services')) {
    errors.push(`${importerRelative}: renderer no debe importar ${targetLayer}`);
  }

  if (importerLayer === 'main' && targetLayer === 'renderer') {
    errors.push(`${importerRelative}: main no debe importar renderer`);
  }

  if (importerLayer === 'services' && (targetLayer === 'renderer' || targetLayer === 'main')) {
    errors.push(`${importerRelative}: services no debe importar ${targetLayer}`);
  }

  if ((importerLayer === 'shared' || importerLayer === 'types')
    && ['renderer', 'main', 'services'].includes(targetLayer)) {
    errors.push(`${importerRelative}: ${importerLayer} debe mantenerse desacoplado de ${targetLayer}`);
  }
}

const files = walk(srcRoot);
const errors = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const imports = extractImports(content);
  const importerRelative = toProjectRelative(file);
  const importerLayer = classifyLayer(file);
  const sourceFeature = getFeatureName(file);
  const isAppLayer = importerRelative.startsWith('src/renderer/app/');
  const isRendererShared = importerRelative.startsWith('src/renderer/shared/');

  for (const specifier of imports) {
    for (const pattern of disallowedSpecifierPatterns) {
      if (pattern.importerLayer === importerLayer && pattern.regex.test(specifier)) {
        errors.push(`${importerRelative}: ${pattern.message} -> ${specifier}`);
      }
    }

    const resolvedTarget = resolveRelativeImport(file, specifier);
    if (!resolvedTarget) {
      continue;
    }

    validateLayerImport(importerRelative, importerLayer, resolvedTarget, errors);

    const targetRelative = toProjectRelative(resolvedTarget);
    if (!targetRelative.startsWith('src/renderer/features/')) {
      if (isRendererShared && targetRelative.startsWith('src/renderer/app/')) {
        errors.push(`${importerRelative}: renderer/shared no debe importar app -> ${specifier}`);
      }

      continue;
    }

    const targetFeature = getFeatureName(resolvedTarget);
    if (!targetFeature) {
      continue;
    }

    if (isRendererShared) {
      errors.push(`${importerRelative}: renderer/shared no debe depender de internals de features -> ${specifier}`);
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
  console.error('Architecture violations found:\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Architecture check passed.');
