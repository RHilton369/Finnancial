const { Router } = require('express');
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { updateUserSchema } = require('../schemas/userSchemas');
const authenticate = require('../middleware/authenticate');

const router = Router();

// Todas as rotas de usuário exigem autenticação
router.use(authenticate);

/**
 * Rota para atualizar o perfil do próprio usuário autenticado.
 * PUT /api/users/me
 */
router.put('/me', validate(updateUserSchema), userController.updateProfile);

module.exports = router;
