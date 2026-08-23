/**
 * Logger seguro que mascara credenciais, senhas e dados sensíveis.
 */
class SafeLogger {
  private sanitizeData(data: any): any {
    if (!data) return data;
    if (typeof data === 'string') {
      // Mascarar tokens JWT ou senhas em strings
      return data
        .replace(/(password|senha|token|secret)[\s:=]+([^\s,;&]+)/gi, '$1: [REDACTED]')
        .replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match) => {
          const [u, d] = match.split('@');
          return `${u[0]}***@${d}`;
        });
    }

    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map((item) => this.sanitizeData(item));
      }
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('senha') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret')
        ) {
          sanitized[key] = '[REDACTED]';
        } else if (lowerKey.includes('notes') || lowerKey.includes('observacao')) {
          sanitized[key] = '[PROTECTED_HEALTH_NOTE]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  info(message: string, ...args: any[]): void {
    const sanitizedArgs = args.map((arg) => this.sanitizeData(arg));
    console.log(`[Respira INFO] ${message}`, ...sanitizedArgs);
  }

  warn(message: string, ...args: any[]): void {
    const sanitizedArgs = args.map((arg) => this.sanitizeData(arg));
    console.warn(`[Respira WARN] ${message}`, ...sanitizedArgs);
  }

  error(message: string, ...args: any[]): void {
    const sanitizedArgs = args.map((arg) => this.sanitizeData(arg));
    console.error(`[Respira ERROR] ${message}`, ...sanitizedArgs);
  }
}

export const logger = new SafeLogger();
