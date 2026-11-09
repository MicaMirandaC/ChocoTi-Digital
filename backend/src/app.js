/**
 * @file app.js
 * @description Servidor Express principal para ChocoTi-Digital Backend (Fase 1).
 * Implementa arquitectura en 3 capas, middleware de seguridad, rate limiting y CORS.
 */

'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Rutas modulares
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const almacenesRoutes = require('./routes/almacenesRoutes');

const app = express();

// Seguridad HTTP con Helmet
app.use(helmet());

// Configuración de CORS
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin origin (como apps móviles, Postman o curl)
      if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // En desarrollo permitir origen
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Rate Limiting general y para autenticación
const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: 'Demasiadas solicitudes desde esta dirección IP. Intente más tarde.',
  },
});

const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: 'Demasiados intentos de autenticación. Por seguridad, intente en 15 minutos.',
  },
});

app.use('/api', limiterGlobal);
app.use('/api/auth/login', limiterAuth);

// Registro de Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/almacenes', almacenesRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    servicio: 'ChocoTi-Digital API REST',
    version: '1.0.0',
    entorno: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Manejo de recursos no encontrados (404)
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware global de manejo de excepciones no controladas (500)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok: false,
    mensaje: err.message || 'Error interno del servidor.',
    ...(process.env.NODE_ENV === 'development' && { detalle: err.stack }),
  });
});

// Inicialización del servidor si se ejecuta directamente
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║       🍫 ChocoTi-Digital - API REST Express 🍫        ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Puerto Activo : http://localhost:${String(PORT).padEnd(20)}║`);
    console.log(`║ Entorno       : ${String(process.env.NODE_ENV || 'development').padEnd(31)}║`);
    console.log(`║ Base de Datos : SQLite ('chocoti_security.db')         ║`);
    console.log('╚════════════════════════════════════════════════════════╝');
  });
}

module.exports = app;
