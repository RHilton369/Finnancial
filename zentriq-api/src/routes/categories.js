const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../schemas/categorySchemas');
const authenticate = require('../middleware/authenticate');

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', categoryController.list);
router.post('/', validate(createCategorySchema), categoryController.create);
router.put('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
