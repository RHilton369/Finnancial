const { Router } = require('express');
const goalController = require('../controllers/goalController');
const validate = require('../middleware/validate');
const { createGoalSchema, updateGoalSchema, depositSchema } = require('../schemas/goalSchemas');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', goalController.list);
router.post('/', validate(createGoalSchema), goalController.create);
router.put('/:id', validate(updateGoalSchema), goalController.update);
router.delete('/:id', goalController.remove);
router.patch('/:id/deposit', validate(depositSchema), goalController.deposit);

module.exports = router;
