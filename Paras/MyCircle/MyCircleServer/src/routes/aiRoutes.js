const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.post('/moderate', auth, aiController.moderateContent);
router.post('/suggest', auth, aiController.getSuggestions);
router.post('/analyze-post', auth, aiController.analyzePost);

module.exports = router;
