/**
 * @file routes/usuariosRoutes.js
 * @description Definición de endpoints REST para CRUD de usuarios y auditoría.
 * ChocoTi-Digital | Capa 1: Controladores y Transporte HTTP
 */

'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const usuariosController = require('../controllers/usuariosController');
const {
  verificarToken,
  soloAdmin,
  adminOPropioUsuario,
} = require('../middleware/authMiddleware');

/**
 * Validaciones para la creación de usuarios.
 */
const validarCreacion = [
  body('nombre_completo')
    .trim()
    .notEmpty().withMessage('El nombre completo es requerido.')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres.'),
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es requerido.')
    .isEmail().withMessage('El correo electrónico debe ser válido.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres.'),
  body('rol_id')
    .notEmpty().withMessage('El rol es requerido.')
    .isInt({ min: 1, max: 4 }).withMessage('El rol_id debe ser un número entero entre 1 y 4.'),
];

/**
 * Rutas de estadísticas y bitácora (deben definirse antes de /:id)
 */
router.get('/stats', verificarToken, soloAdmin, usuariosController.getStats);
router.get('/logs', verificarToken, soloAdmin, usuariosController.getLogs);

/**
 * Endpoints CRUD de usuarios
 */
router.get('/', verificarToken, soloAdmin, usuariosController.listar);
router.post('/', verificarToken, soloAdmin, validarCreacion, usuariosController.crear);
router.get('/:id', verificarToken, adminOPropioUsuario, usuariosController.obtener);
router.put('/:id', verificarToken, soloAdmin, usuariosController.actualizar);
router.delete('/:id', verificarToken, soloAdmin, usuariosController.inactivar);

module.exports = router;
