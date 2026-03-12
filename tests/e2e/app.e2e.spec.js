const { test, expect, _electron: electron } = require('@playwright/test');

test('la app abre el dashboard y permite navegar entre vistas principales', async () => {
  const env = {
    ...process.env,
    NODE_ENV: 'test',
  };
  delete env.ELECTRON_RUN_AS_NODE;

  const electronApp = await electron.launch({
    args: ['.'],
    env,
  });

  try {
    const page = await electronApp.firstWindow();

    await expect(page.getByRole('heading', { name: /repo command center/i })).toBeVisible();
    await expect(page.getByText(/No hay provider activo/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await settingsLink.click();
    await page.waitForURL(/#\/settings$/);
    await expect(page).toHaveURL(/#\/settings$/);
    await expect(page.getByRole('heading', { name: /Configuracion de fuentes e integraciones/i })).toBeVisible();

    const repositoryAnalysisLink = page.getByRole('link', { name: 'Repo Analysis' });
    await repositoryAnalysisLink.click();
    await page.waitForURL(/#\/repository-analysis$/);
    await expect(page).toHaveURL(/#\/repository-analysis$/);
    await expect(page.getByText(/Repository Analysis/i)).toBeVisible();
    await expect(page.getByText(/Seleccion de alcance/i)).toBeVisible();
  } finally {
    await electronApp.close();
  }
});
