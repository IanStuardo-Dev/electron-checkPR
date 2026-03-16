const React = require('react');
const { render, screen } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;

jest.mock('../../../src/renderer/pages/Dashboard', () => () => React.createElement('div', null, 'Dashboard page'));
jest.mock('../../../src/renderer/pages/History', () => () => React.createElement('div', null, 'History page'));
jest.mock('../../../src/renderer/pages/RepositoryAnalysis', () => () => React.createElement('div', null, 'Repository Analysis page'));
jest.mock('../../../src/renderer/pages/Settings', () => () => React.createElement('div', null, 'Settings page'));
jest.mock('../../../src/renderer/features/dashboard/context/RepositorySourceContext', () => ({
  RepositorySourceProvider: ({ children }) => React.createElement(React.Fragment, null, children),
}));

const App = require('../../../src/renderer/App').default;

describe('App', () => {
  test('monta sidebar y dashboard por defecto', () => {
    window.location.hash = '#/';

    render(React.createElement(App));

    expect(screen.getByText('Repo Command Center')).toBeInTheDocument();
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  test('navega desde el sidebar a settings e historico', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/';

    render(React.createElement(App));

    await user.click(screen.getByRole('link', { name: /settings/i }));
    expect(screen.getByText('Settings page')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /historico/i }));
    expect(screen.getByText('History page')).toBeInTheDocument();
  });
});
