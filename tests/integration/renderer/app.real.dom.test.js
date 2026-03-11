const React = require('react');
const { render, screen } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;

const App = require('../../../src/renderer/App').default;

describe('App real navigation', () => {
  beforeEach(() => {
    window.location.hash = '#/';
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.electronApi.invoke.mockReset();
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: '' });
  });

  test('renderiza settings al navegar desde el sidebar', async () => {
    const user = userEvent.setup();

    render(React.createElement(App));

    await user.click(screen.getByRole('link', { name: 'Settings' }));

    expect(await screen.findByRole('heading', { name: 'Configuracion de fuentes e integraciones' })).toBeInTheDocument();
  });
});
