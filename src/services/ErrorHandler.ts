import { environment } from "../config/environment";

type ErrorLevel = 'error' | 'warning' | 'info';

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: Error, level: ErrorLevel = 'error') {
    if (environment.enableDebugLogs) {
      console.error(`[${level.toUpperCase()}]`, error);
    }

    // En producción, podríamos enviar a un servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      // Aquí iría la integración con Sentry, LogRocket, etc.
    }
  }
}

export default ErrorHandler.getInstance();