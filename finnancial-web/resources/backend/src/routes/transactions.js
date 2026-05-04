const { Router } = require('express');
const transactionController = require('../controllers/transactionController');
const validate = require('../middleware/validate');
const { createTransactionSchema, updateTransactionSchema } = require('../schemas/transactionSchemas');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', transactionController.list);
router.post('/', validate(createTransactionSchema), transactionController.create);
router.put('/:id', validate(updateTransactionSchema), transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
