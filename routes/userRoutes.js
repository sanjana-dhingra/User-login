const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', userController.signup);
router.post('/login', userController.login);

router.patch('/updateMe', authController.protect, userController.updateMe);
router.get('/nearBy', authController.protect, userController.findNearestUsers);
router.patch('/updateMyPassword', authController.protect, userController.updatePassword);

module.exports = router;
