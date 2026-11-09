/**
 * @file routes/authRoutes.js
 * @description Definición de endpoints REST para autenticación y gestión de perfil.
 * ChocoTi-Digital | Capa 1: Controladores y Transporte HTTP
 */

'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

/**
 * Validaciones para el endpoint de login.
 */
const validarLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido.')
    .isEmail().withMessage('El formato de correo electrónico no es válido.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida.'),
];

/**
 * Rutas de autenticación
 */
router.post('/login', validarLogin, authController.login);
router.get('/me', verificarToken, authController.getMe);
router.put('/perfil', verificarToken, authController.updatePerfil);
router.put('/password', verificarToken, authController.cambiarPassword);

module.exports = router;
