const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');

const TitleBar = require('../../../src/renderer/shared/layout/TitleBar').default;

describe('TitleBar', () => {
  beforeEach(() => {
    window.electronApi.invoke.mockReset();
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: '' });
    window.electronApi.onWindowStateChange.mockReset();
    window.electronApi.onWindowStateChange.mockReturnValue(jest.fn());
  });

  test('no explota si el bridge de Electron no esta disponible', () => {
    const originalElectronApi = window.electronApi;
    delete window.electronApi;

    try {
      render(React.createElement(TitleBar, { pathname: '/' }));

      expect(screen.getByRole('heading', { name: 'Pull Requests' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /minimize window/i })).not.toBeInTheDocument();
    } finally {
      window.electronApi = originalElectronApi;
    }
  });

  test('usa controles tipo traffic light en macOS', async () => {
    window.electronApi.invoke.mockImplementation(async (channel) => {
      if (channel === 'window-controls:get-state') {
        return {
          isMaximized: false,
          isFullScreen: false,
          platform: 'darwin',
        };
      }

      return null;
    });

    render(React.createElement(TitleBar, { pathname: '/' }));

    await waitFor(() => {
      expect(
        screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')),
      ).toEqual(['Close window', 'Minimize window', 'Enter full screen']);
    });
  });
});
