const { Router } = require('express');
const recurringController = require('../controllers/recurringController');
const validate = require('../middleware/validate');
const { createRecurringSchema, updateRecurringSchema } = require('../schemas/recurringSchemas');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', recurringController.list);
router.post('/', validate(createRecurringSchema), recurringController.create);
router.put('/:id', validate(updateRecurringSchema), recurringController.update);
router.delete('/:id', recurringController.remove);
router.post('/process', recurringController.processRecurring);

module.exports = router;
