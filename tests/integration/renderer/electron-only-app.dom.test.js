const React = require('react');
const { render, screen } = require('@testing-library/react');

const ElectronOnlyApp = require('../../../src/renderer/app/ElectronOnlyApp').default;

describe('ElectronOnlyApp', () => {
  test('muestra una pantalla de compatibilidad cuando falta el bridge nativo', () => {
    render(React.createElement(ElectronOnlyApp));

    expect(screen.getByRole('heading', { name: /Esta aplicacion requiere Electron/i })).toBeInTheDocument();
    expect(screen.getByText(/Ejecuta la app desde Electron con/i)).toBeInTheDocument();
  });
});
