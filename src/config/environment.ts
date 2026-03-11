type EnvironmentConfig = {
  apiUrl: string;
  azureDevOpsUrl: string;
  enableDebugLogs: boolean;
  enableDemoRoutes: boolean;
  isProduction: boolean;
};

function isProductionRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.protocol === 'file:' && window.location.hostname !== 'localhost';
}

const production = isProductionRuntime();

export const environment: EnvironmentConfig = production
  ? {
    apiUrl: 'https://api.yourapp.com',
    azureDevOpsUrl: 'https://dev.azure.com',
    enableDebugLogs: false,
    enableDemoRoutes: false,
    isProduction: true,
  }
  : {
    apiUrl: 'http://localhost:3000',
    azureDevOpsUrl: 'https://dev.azure.com/your-org',
    enableDebugLogs: true,
    enableDemoRoutes: true,
    isProduction: false,
  };
