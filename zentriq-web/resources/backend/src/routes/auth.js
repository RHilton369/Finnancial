const { Router } = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../schemas/authSchemas');
const rateLimit = require('express-rate-limit');

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: true, code: 'RATE_LIMITED', message: 'Muitas tentativas. Tente novamente em 1 minuto.' }
});

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
