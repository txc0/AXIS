import rateLimit from 'express-rate-limit';

const make = (limit, windowMinutes) => rateLimit({
  windowMs: windowMinutes * 60_000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes and try again.' },
});

export const formLimiter = make(30, 15);    // orders, sign-ups, messages
export const lookupLimiter = make(80, 15);  // order status checks
export const likeLimiter = make(120, 15);   // community likes