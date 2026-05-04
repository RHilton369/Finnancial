const { Router } = require('express');
const budgetController = require('../controllers/budgetController');
const validate = require('../middleware/validate');
const { createBudgetSchema, updateBudgetSchema } = require('../schemas/budgetSchemas');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', budgetController.list);
router.post('/', validate(createBudgetSchema), budgetController.create);
router.put('/:id', validate(updateBudgetSchema), budgetController.update);
router.delete('/:id', budgetController.remove);

module.exports = router;
