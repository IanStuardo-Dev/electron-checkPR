const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, 'src');
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const importPattern = /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

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

function normalizeCycle(cycle) {
  const nodes = cycle.slice(0, -1).map(toProjectRelative);
  const variants = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const rotated = [...nodes.slice(index), ...nodes.slice(0, index)];
    variants.push([...rotated, rotated[0]].join(' -> '));
    variants.push([...rotated].reverse().concat(rotated[rotated.length - 1]).join(' -> '));
  }

  return variants.sort()[0];
}

const files = walk(srcRoot);
const graph = new Map();

for (const file of files) {
  const imports = extractImports(fs.readFileSync(file, 'utf8'));
  const dependencies = new Set();

  for (const specifier of imports) {
    const resolvedTarget = resolveRelativeImport(file, specifier);

    if (resolvedTarget && resolvedTarget.startsWith(srcRoot)) {
      dependencies.add(resolvedTarget);
    }
  }

  graph.set(file, [...dependencies]);
}

const visited = new Set();
const visiting = new Set();
const stack = [];
const cycles = new Set();

function walkGraph(node) {
  visiting.add(node);
  visited.add(node);
  stack.push(node);

  const dependencies = graph.get(node) ?? [];
  for (const dependency of dependencies) {
    if (!graph.has(dependency)) {
      continue;
    }

    if (!visited.has(dependency)) {
      walkGraph(dependency);
      continue;
    }

    if (visiting.has(dependency)) {
      const cycleStartIndex = stack.indexOf(dependency);
      const cycle = [...stack.slice(cycleStartIndex), dependency];
      cycles.add(normalizeCycle(cycle));
    }
  }

  stack.pop();
  visiting.delete(node);
}

for (const file of graph.keys()) {
  if (!visited.has(file)) {
    walkGraph(file);
  }
}

if (cycles.size > 0) {
  console.error('Import cycles found:\n');
  [...cycles].sort().forEach((cycle) => console.error(`- ${cycle}`));
  process.exit(1);
}

console.log('Import cycle check passed.');
