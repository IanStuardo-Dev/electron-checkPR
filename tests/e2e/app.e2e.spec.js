const { test, expect, _electron: electron } = require('@playwright/test');

test('la app abre el dashboard y permite navegar a settings', async () => {
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

    await expect(page.getByText('Repo Command Center')).toBeVisible();
    await expect(page.getByText(/No hay provider activo/i)).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByText('Configuracion de fuentes e integraciones')).toBeVisible();
  } finally {
    await electronApp.close();
  }
});
