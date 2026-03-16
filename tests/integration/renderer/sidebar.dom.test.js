const React = require('react');
const { render, screen } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const Sidebar = require('../../../src/renderer/components/Layout/Sidebar').default;

describe('Sidebar', () => {
  test('muestra navegacion principal y settings al final', () => {
    render(React.createElement(
      MemoryRouter,
      { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      React.createElement(Sidebar),
    ));

    expect(screen.getByText('Repo Command Center')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Historico/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Repo Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });
});
