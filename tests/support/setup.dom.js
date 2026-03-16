require('@testing-library/jest-dom');

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

window.electronApi = {
  invoke: jest.fn().mockResolvedValue({ ok: true, data: '' }),
  onWindowStateChange: jest.fn(() => jest.fn()),
};

jest.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      const Component = ({ children, ...props }) => require('react').createElement(tag, props, children);
      return Component;
    },
  }),
}));
