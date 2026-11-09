/**
 * @file routes/almacenesRoutes.js
 * @description Definición de endpoints REST para consulta de almacenes físicos.
 * ChocoTi-Digital | Capa 1: Controladores y Transporte HTTP
 */

'use strict';

const express = require('express');
const router = express.Router();

const almacenesController = require('../controllers/almacenesController');

router.get('/', almacenesController.listar);
router.get('/:id', almacenesController.obtener);

module.exports = router;
