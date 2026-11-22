const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const supportController = require('../controllers/supportController');

router.use(auth);

router.post('/submissions', validate(schemas.createSupportSubmission), supportController.createSubmission);
router.get('/submissions', supportController.getMySubmissions);

module.exports = router;
