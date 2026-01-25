import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Muitas tentativas de registro. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const pixLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: "Aguarde um momento antes de criar outra cobrança PIX." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId || req.ip || "unknown";
  },
  validate: false,
});

export const withdrawalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: { error: "Aguarde um momento antes de solicitar outro saque." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId || req.ip || "unknown";
  },
  validate: false,
});

export const webhookLimiter = rateLimit({
  windowMs: 1000,
  max: 50,
  message: { error: "Too many webhook requests" },
  standardHeaders: true,
  legacyHeaders: false,
});
