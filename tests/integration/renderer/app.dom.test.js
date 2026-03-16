const React = require('react');
const { render, screen } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;

jest.mock('../../../src/renderer/app/pages/Dashboard', () => () => React.createElement('div', null, 'Dashboard page'));
jest.mock('../../../src/renderer/app/pages/History', () => () => React.createElement('div', null, 'History page'));
jest.mock('../../../src/renderer/app/pages/RepositoryAnalysis', () => () => React.createElement('div', null, 'Repository Analysis page'));
jest.mock('../../../src/renderer/app/pages/Settings', () => () => React.createElement('div', null, 'Settings page'));
jest.mock('../../../src/renderer/features/repository-source/presentation/context/RepositorySourceContext', () => ({
  RepositorySourceProvider: ({ children }) => React.createElement(React.Fragment, null, children),
}));

const App = require('../../../src/renderer/app/App').default;

describe('App', () => {
  test('monta sidebar y dashboard por defecto', async () => {
    window.location.hash = '#/';

    render(React.createElement(App));

    expect(screen.getByText('Repo Command Center')).toBeInTheDocument();
    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });

  test('navega desde el sidebar a settings e historico', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/';

    render(React.createElement(App));

    await user.click(screen.getByRole('link', { name: /settings/i }));
    expect(await screen.findByText('Settings page')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /historico/i }));
    expect(await screen.findByText('History page')).toBeInTheDocument();
  });
});
