const { Router } = require('express');
const chatController = require('../controllers/chatController');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

// Todas as rotas de chat exigem autenticação do usuário
router.use(authenticate);

router.get('/', chatController.list);
router.post('/', chatController.sendMessage);
router.delete('/', chatController.clear);

module.exports = router;
