// Validates req.body against a zod schema and puts the clean data on req.data.
// Forms include a hidden "website" field. Real people never fill it in; bots do.
export const validate = (schema, { honeypot = true } = {}) => (req, res, next) => {
  if (honeypot && req.body?.website) return res.status(201).json({ ok: true });
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message || 'Please check your details.',
      fields: result.error.flatten().fieldErrors,
    });
  }
  req.data = result.data;
  next();
};