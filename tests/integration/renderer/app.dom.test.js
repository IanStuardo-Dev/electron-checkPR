const React = require('react');
const { render, screen } = require('@testing-library/react');

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
});
