# 🍫 ChocoTi-Digital — Sistema E-Commerce y Gestión Omnicanal
### Chocolates Para Ti · Sucre, Bolivia
> Plataforma de comercio electrónico, gestión logística multisucursal y administración basada en roles (RBAC) con arquitectura en 3 capas.

---

## 🏛️ 1. Arquitectura del Sistema (3 Capas)

El proyecto respeta una separación estricta de responsabilidades:

```
┌────────────────────────────────────────────────────────────────────────┐
│  CAPA 1: PRESENTACIÓN (Frontend)                                       │
│  • Landing Page Pública (index.html, styles.css, script.js)            │
│  • Modales Interactivos: Login con selección rápida y Mi Perfil/Clave  │
│  • Dashboards Especializados por Rol: Admin, Almacén, Minorista, B2B   │
│  • Paleta de marca institucional: Tonos Café (#2C1A1D) y Dorado        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / JSON (fetch + JWT Bearer)
┌───────────────────────────────────▼────────────────────────────────────┐
│  CAPA 2: LÓGICA DE NEGOCIO Y CONTROL (Backend REST API)                │
│  • Express Server con Helmet, CORS y Rate Limiting                     │
│  • Controladores (Controllers): Validación HTTP y respuestas estándar  │
│  • Servicios (Services):                                               │
│      - AuthService: Hashing bcrypt, emisión JWT y logs de acceso       │
│      - UsuariosService: CRUD, filtros de rol/almacén, métricas y logs │
│      - AlmacenesService: Catálogo de Planta Central y Agencias         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ better-sqlite3 (síncrono, WAL mode)
┌───────────────────────────────────▼────────────────────────────────────┐
│  CAPA 3: PERSISTENCIA Y DATOS (SQLite)                                 │
│  • Base de datos: database/chocoti_security.db                         │
│  • Tablas: roles, almacenes, usuarios, logs_acceso                     │
│  • Trigger: actualizar_ultima_conexion automático                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 2. Credenciales de Prueba (Mock Data de los 4 Roles)

El sistema incluye cuentas semilla listas para usar en cada rol:

| Icono | Rol del Sistema | Correo Electrónico | Contraseña | Almacén / Tipo de Cuenta |
| :---: | :--- | :--- | :--- | :--- |
| 👑 | **ADMINISTRADOR** | `admin@chocolatesti.bo` | `Admin2024!` | Planta Central Sucre (`INTERNO`) |
| 🏭 | **OPERADOR_ALMACEN** | `operador.sucre@chocolatesti.bo` | `Operador2024!` | Planta Central Sucre (`INTERNO`) |
| 🏢 | **OPERADOR_ALMACEN** | `operador.lapaz@chocolatesti.bo` | `Operador2024!` | Agencia La Paz (`INTERNO`) |
| 🛍️ | **CLIENTE_MINORISTA** | `cliente@gmail.com` | `Cliente2024!` | Consumidor Final (`MINORISTA`) |
| 🏛️ | **CLIENTE_CORPORATIVO** | `empresa@acme.bo` | `Empresa2024!` | ACME Distribuidora S.R.L. (`CORPORATIVO`) |

> 💡 **Tip:** Tanto en el modal de login de `index.html` como en `frontend/auth/login.html`, existen botones de auto-rellenado para probar cada cuenta con un solo clic.

---

## 🚀 3. Instrucciones de Instalación y Ejecución

### Prerrequisitos
* **Node.js** v18 o superior (`node -v`)
* **npm** v9 o superior (`npm -v`)

---

### Paso 1: Configurar e Iniciar el Backend

1. Abre una terminal y navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicializa la base de datos SQLite con el esquema y datos semilla:
   ```bash
   npm run init-db
   ```
   *(Crea `database/chocoti_security.db` con tablas, roles, almacenes y usuarios de prueba).*

4. Inicia el servidor backend:
   ```bash
   npm start
   # o en modo desarrollo con nodemon:
   npm run dev
   ```
   El servidor responderá en: **`https://chocoti-digital.onrender.com/api`**  
   Verificación de salud: `GET https://chocoti-digital.onrender.com/api/api/health`

---

### Paso 2: Ejecutar el Frontend

Puedes servir el frontend mediante cualquiera de estas opciones:

* **Opción A — Con VS Code (Recomendado):**
  1. Instala la extensión **Live Server** en VS Code.
  2. Haz clic derecho sobre `index.html` → **"Open with Live Server"**.
  3. Navegará a `http://127.0.0.1:5500/index.html`.

* **Opción B — Con Node.js (`npx serve`):**
  ```bash
  # Desde la raíz del proyecto
  npx serve . -p 5500
  ```

* **Opción C — Con Python:**
  ```bash
  # Desde la raíz del proyecto
  python -m http.server 5500
  ```

---

## 📡 4. Catálogo de Endpoints de la API REST

**Base URL:** `https://chocoti-digital.onrender.com/api/api`

### 4.1 Autenticación y Perfil (`/api/auth`)
* `POST /api/auth/login`: Autentica con `{ email, password }`. Genera JWT y registra intento obligatorio en `logs_acceso`.
* `GET /api/auth/me`: Retorna los datos del perfil del usuario autenticado (requiere `Authorization: Bearer <token>`).
* `PUT /api/auth/perfil`: Actualiza nombre completo, teléfono, CI/NIT y razón social del usuario autenticado.
* `PUT /api/auth/password`: Modifica la contraseña tras validar la actual y las reglas de complejidad.

### 4.2 Gestión de Usuarios (`/api/usuarios` — Exclusivo Admin)
* `GET /api/usuarios`: Lista usuarios con filtros opcionales (`?rol_id=2&almacen_id=1&estado=ACTIVO`).
* `POST /api/usuarios`: Registra un nuevo usuario con validación de unicidad de correo y hash bcrypt.
* `GET /api/usuarios/:id`: Obtiene el detalle de un usuario específico.
* `PUT /api/usuarios/:id`: Actualiza datos y rol de un usuario.
* `DELETE /api/usuarios/:id`: **Baja lógica** del usuario (`estado = 'INACTIVO'`).
* `GET /api/usuarios/stats`: Métricas de usuarios activos, inactivos y logins del día.
* `GET /api/usuarios/logs`: Bitácora de accesos con filtros por usuario y estado.

### 4.3 Almacenes (`/api/almacenes`)
* `GET /api/almacenes`: Lista los almacenes activos de ChocoTi (Planta Central Sucre, Agencias La Paz, Cochabamba, Santa Cruz).
* `GET /api/almacenes/:id`: Detalle de un almacén.

---

## 🔒 5. Políticas de Seguridad Implementadas

1. **Hashing Criptográfico:** Contraseñas protegidas mediante algoritmos de salting con `bcryptjs` (10 rondas).
2. **Tokens JWT:** Firma criptográfica con expiración configurable (8 horas por defecto).
3. **Auditoría Obligatoria (`logs_acceso`):** Todo intento de inicio de sesión queda registrado con IP de origen, fecha/hora, estado (`EXITOSO` o `FALLIDO`) y detalle del motivo.
4. **Protección HTTP:** Cabeceras HTTP seguras con `helmet` y limitador de tasa de peticiones con `express-rate-limit`.
5. **Control de Acceso Basado en Roles (RBAC):** Middleware para permisos estrictos de administrador y protección de rutas en el cliente (`auth-guard.js`).
6. **Reglas de Contraseña:** Mínimo 8 caracteres, al menos 1 letra mayúscula, 1 letra minúscula y 1 número.

---

## 📂 6. Estructura de Directorios

```text
ChocoTi-Digital/
├── index.html                   # Landing page pública con modal de login y perfil
├── styles.css                   # Estilos institucionales (tonos café y dorado)
├── script.js                    # Lógica frontend interactiva y consumo de API
├── README.md                    # Guía del proyecto
│
├── database/
│   ├── schema.sql               # DDL de tablas SQLite y datos semilla (mock data)
│   └── chocoti_security.db      # Base de datos SQLite generada
│
├── backend/                     # API REST Node.js + Express en 3 capas
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── app.js               # Entrada del servidor y middlewares globales
│       ├── config/              # Conexión Singleton SQLite y script initDb
│       ├── controllers/         # Capa 1: Controladores HTTP
│       ├── services/            # Capa 2: Lógica de negocio y servicios
│       ├── models/              # Capa 3: DAOs y acceso a persistencia
│       ├── middleware/          # JWT, soloAdmin y log helpers
│       └── routes/              # Routers REST
│
└── frontend/                    # Dashboards y vistas especializadas
    ├── auth/
    │   └── login.html           # Página dedicada de inicio de sesión
    ├── shared/                  # Estilos y JS compartidos (api.js, auth-guard.js)
    └── dashboard/
        ├── admin/index.html     # Panel Administrador (CRUD Usuarios, Stats, Logs)
        ├── almacen/index.html   # Panel Operador de Almacén (Sucre, La Paz, etc.)
        ├── cliente-minorista/   # Panel de Cliente Minorista
        └── cliente-corporativo/ # Panel B2B Corporativo (Cotizaciones y Pedidos)
```
