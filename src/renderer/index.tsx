import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import ElectronOnlyApp from './app/ElectronOnlyApp';
import { hasElectronApi } from './shared/electron/electronBridge';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    {hasElectronApi() ? <App /> : <ElectronOnlyApp />}
  </React.StrictMode>
);
