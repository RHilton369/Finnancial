const { Router } = require('express');
const accountController = require('../controllers/accountController');
const validate = require('../middleware/validate');
const { createAccountSchema, updateAccountSchema } = require('../schemas/accountSchemas');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', accountController.list);
router.get('/:id/invoice', accountController.getInvoice);
router.post('/', validate(createAccountSchema), accountController.create);
router.put('/:id', validate(updateAccountSchema), accountController.update);
router.delete('/:id', accountController.remove);

module.exports = router;
