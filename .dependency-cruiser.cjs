/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Se detecto un ciclo de dependencias. Rompe el ciclo antes de continuar.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'renderer-no-main-or-services',
      severity: 'error',
      comment: 'Renderer debe depender de shared/core o de APIs publicas, no de main/services.',
      from: { path: '^src/renderer/' },
      to: { path: '^src/(main|services)/' },
    },
    {
      name: 'main-no-renderer',
      severity: 'error',
      comment: 'Main process no debe importar renderer.',
      from: { path: '^src/main/' },
      to: { path: '^src/renderer/' },
    },
    {
      name: 'services-no-ui',
      severity: 'error',
      comment: 'La capa services no debe depender de renderer ni de main.',
      from: { path: '^src/services/' },
      to: { path: '^src/(renderer|main)/' },
    },
    {
      name: 'shared-no-app-layers',
      severity: 'error',
      comment: 'src/shared debe mantenerse desacoplado de main, services y renderer.',
      from: { path: '^src/shared/' },
      to: { path: '^src/(renderer|main|services)/' },
    },
    {
      name: 'types-no-app-layers',
      severity: 'error',
      comment: 'src/types solo debe exponer contratos y no depender de capas de aplicacion.',
      from: { path: '^src/types/' },
      to: { path: '^src/(renderer|main|services)/' },
    },
    {
      name: 'renderer-shared-no-app',
      severity: 'error',
      comment: 'renderer/shared no debe depender de app.',
      from: { path: '^src/renderer/shared/' },
      to: { path: '^src/renderer/app/' },
    },
    {
      name: 'renderer-shared-no-features',
      severity: 'error',
      comment: 'renderer/shared no debe depender de internals de features.',
      from: { path: '^src/renderer/shared/' },
      to: { path: '^src/renderer/features/' },
    },
    {
      name: 'app-uses-feature-public-api',
      severity: 'error',
      comment: 'renderer/app debe consumir solo el index publico de cada feature.',
      from: { path: '^src/renderer/app/' },
      to: { path: '^src/renderer/features/[^/]+/(?!index\\.(?:ts|tsx|js|jsx)$).+' },
    },
    {
      name: 'feature-data-no-presentation',
      severity: 'error',
      comment: 'La capa data de una feature no debe depender de presentation.',
      from: { path: '^src/renderer/features/[^/]+/data/' },
      to: { path: '^src/renderer/features/[^/]+/presentation/' },
    },
    {
      name: 'feature-application-no-presentation',
      severity: 'error',
      comment: 'La capa application de una feature no debe depender de presentation.',
      from: { path: '^src/renderer/features/[^/]+/application/' },
      to: { path: '^src/renderer/features/[^/]+/presentation/' },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: '^src',
    exclude: {
      path: '^(dist|coverage|test-results)(/|$)',
    },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
  },
};
