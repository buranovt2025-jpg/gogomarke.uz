import rateLimit from 'express-rate-limit';

// Строгий rate limiter для auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 5, // максимум 5 попыток в минуту
  message: {
    error: 'Слишком много попыток входа. Попробуйте снова через минуту.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Возвращать rate limit info в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключить заголовки `X-RateLimit-*`
  // Применять rate limit на основе IP адреса
  keyGenerator: (req) => req.ip || 'unknown',
  // Пропускать успешные запросы (не считать их в лимите)
  skipSuccessfulRequests: true,
  // Пропускать неудачные запросы (считать только неуспешные попытки аутентификации)
  skipFailedRequests: false,
});

// Общий rate limiter для API (более мягкий)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за 15 минут
  message: {
    error: 'Слишком много запросов с этого IP. Попробуйте позже.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Экспорт для совместимости с существующим кодом
export const apiRateLimiter = generalRateLimit;