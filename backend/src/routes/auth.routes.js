const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const {
  login,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} = require('../controllers/auth.controller');
const { uploadAvatar: uploadAvatarMiddleware } = require('../config/upload');


const loginValidation = [
  body('email').optional().notEmpty().withMessage('Email requis'),
  body('username').optional().notEmpty().withMessage('Nom d\'utilisateur requis'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Email ou nom d\'utilisateur requis');
    }
    return true;
  }),
];

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
];

router.post('/login', loginValidation, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, passwordValidation, changePassword);
router.post('/upload-avatar', auth, uploadAvatarMiddleware.single('avatar'), uploadAvatar);

module.exports = router;