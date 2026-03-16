const React = require('react');
const { render, screen } = require('@testing-library/react');

const TitleBar = require('../../../src/renderer/shared/layout/TitleBar').default;

describe('TitleBar', () => {
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
});
