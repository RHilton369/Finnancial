const { Router } = require('express');
const investmentController = require('../controllers/investmentController');
const validate = require('../middleware/validate');
const {
  createInvestmentSchema,
  updateInvestmentSchema,
  addValuationSchema
} = require('../schemas/investmentSchemas');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

// Todas as rotas de investimento exigem autenticação do usuário
router.use(authenticate);

router.get('/', investmentController.list);
router.get('/history', investmentController.getHistory);
router.post('/', validate(createInvestmentSchema), investmentController.create);
router.put('/:id', validate(updateInvestmentSchema), investmentController.update);
router.delete('/:id', investmentController.remove);
router.post('/:id/valuation', validate(addValuationSchema), investmentController.addValuation);
router.post('/sync', investmentController.syncQuotes);

module.exports = router;
