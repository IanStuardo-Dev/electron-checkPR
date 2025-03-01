export const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    azureDevOpsUrl: 'https://dev.azure.com/your-org',
    enableDebugLogs: true,
  },
  production: {
    apiUrl: process.env.API_URL || 'https://api.yourapp.com',
    azureDevOpsUrl: process.env.AZURE_DEVOPS_URL,
    enableDebugLogs: false,
  }
};

export const environment = process.env.NODE_ENV === 'production' ? config.production : config.development;