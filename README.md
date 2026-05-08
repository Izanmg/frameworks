# 🔐 Gestor de Tasques — T9 (JWT Avançat + Jerarquia de Rols)

API REST professional construïda amb **Node.js**, **Express** i **MongoDB** que amplia el sistema RBAC de la T8 amb:

- **JWT avançat**: Access Token (15 min) + Refresh Token (7 dies)
- **Jerarquia de rols** amb herència de permisos (5 nivells: SUPER_ADMIN → VIEWER)
- **Delegació temporal** de permisos entre usuaris
- **Rate limiting per rol** amb headers `X-RateLimit-*`
- **Auditoria avançada** (qui, què, quan, on, durada, canvis detallats)
- **Recuperació de contrasenya** per email (forgot/reset)
- **Logout segur** amb blacklist de tokens
- **Seguretat HTTP**: CORS, Helmet, validacions exhaustives, contrasenyes amb bcrypt (12 rounds)

> **Autor:** Izan Mendoza · **Mòdul:** OP1-B1-NODE-09

---

## 📁 Estructura del projecte

```
.
├── app.js                        # Configuració d'Express (CORS, Helmet, rutes, errors)
├── server.js                     # Punt d'entrada (connecta a MongoDB i arrenca)
├── config/
│   ├── db.js                     # Connexió a MongoDB
│   ├── jwt.js                    # Configuració JWT centralitzada
│   ├── constants.js              # Constants (nivells, límits, codis d'error)
│   ├── swagger.js                # Documentació OpenAPI
│   └── cloudinary.js             # Config Cloudinary (T6)
├── models/
│   ├── User.js                   # Usuari (firstName, lastName, role, permissions, isActive)
│   ├── Role.js                   # Rol jeràrquic (level, parentRole, permissions)
│   ├── Permission.js             # Permís granular (name, category)
│   ├── Task.js                   # Tasca (T6)
│   ├── TokenBlacklist.js         # Tokens revocats (TTL automàtic)
│   ├── DelegatedPermission.js    # Delegacions temporals
│   ├── PasswordReset.js          # Tokens de recuperació
│   └── AuditLog.js               # Logs d'auditoria avançada
├── middleware/
│   ├── authMiddleware.js         # Verifica access token + blacklist
│   ├── checkPermission.js        # Comprova permís efectiu (rol jeràrquic + delegacions)
│   ├── rateLimiter.js            # Rate limiting per rol
│   ├── auditMiddleware.js        # Registra automàticament cada acció
│   ├── errorHandler.js           # Gestió centralitzada d'errors
│   └── validators/               # express-validator (auth, role, permission)
├── routes/
│   ├── authRoutes.js             # /api/auth (register, login, refresh, logout, forgot/reset)
│   ├── userRoutes.js             # /api/users (CRUD)
│   ├── roleRoutes.js             # /api/roles (CRUD + jerarquia)
│   ├── permissionRoutes.js       # /api/permissions (CRUD)
│   ├── delegationRoutes.js       # /api/delegations (CRUD)
│   ├── auditRoutes.js            # /api/audit (logs, stats, export)
│   ├── taskRoutes.js             # /api/tasks (CRUD T6)
│   └── uploadRoutes.js           # /api/upload (T6)
├── controllers/                  # Lògica HTTP
├── services/
│   ├── jwtService.js             # Genera/verifica access + refresh tokens
│   ├── authService.js            # register, login, refresh, logout, password reset
│   ├── permissionService.js      # Permisos efectius (jerarquia + delegacions)
│   ├── delegationService.js      # CRUD delegacions
│   ├── auditService.js           # Registra accions
│   └── emailService.js           # Enviament d'emails (mock per defecte)
├── utils/
│   ├── seedPermissions.js        # Sembra els permisos del sistema
│   ├── seedRoles.js              # Sembra els rols jeràrquics
│   ├── seedAdmin.js              # Crea l'admin per defecte
│   └── seedAll.js                # Executa tots els seeds
├── postman/
│   └── T9-Gestor-Tasques.postman_collection.json   # Col·lecció Postman (51 proves)
├── .env.example                  # Plantilla de variables d'entorn
└── package.json
```

---

## ⚙️ Instal·lació

```bash
# 1. Clonar el repositori
git clone <repo-url>
cd projecte-t9

# 2. Instal·lar dependències
npm install

# 3. Configurar les variables d'entorn
cp .env.example .env
# Edita .env amb les teves claus (almenys MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)

# 4. Sembrar la base de dades (permisos + rols + admin per defecte)
npm run seed

# 5. Arrencar el servidor
npm run dev      # mode desenvolupament (nodemon)
# o bé
npm start        # producció
```

El servidor escolta a `http://localhost:3000` (o el port indicat a `PORT`).

**Usuari admin per defecte (creat automàticament):**

| Email | Contrasenya | Rol |
|---|---|---|
| `admin@example.com` | `Admin123!` | `super_admin` |

---

## 🏛️ Jerarquia de rols

```
SUPER_ADMIN (Level 5)
└── ADMIN (Level 4)
    └── MANAGER (Level 3)
        └── USER (Level 2)
            └── VIEWER (Level 1)
```

Cada rol **hereta** els permisos del seu pare. Per tant, un *manager* té tot el que té un *user* més els seus propis permisos.

| Rol | Level | Permisos propis | Rate limit |
|---|---|---|---|
| `super_admin` | 5 | `system:configure`, `system:backup` | 1000/min |
| `admin` | 4 | `users:manage`, `roles:manage`, `audit:*`, `reports:*` | 500/min |
| `manager` | 3 | `tasks:assign`, `tasks:review`, `users:view`, `permission:delegate` | 200/min |
| `user` | 2 | `tasks:create`, `tasks:update_own` | 100/min |
| `viewer` | 1 | `tasks:read`, `tasks:read_own` | 50/min |

---

## 🔌 Endpoints

### Autenticació (`/api/auth`)

| Mètode | Ruta | Descripció |
|---|---|---|
| POST | `/register` | Registre d'usuari (assigna rol `user`) |
| POST | `/login` | Login (retorna `accessToken` + `refreshToken`) |
| POST | `/refresh` | Renova l'access token |
| POST | `/logout` | Revoca tokens (els afegeix a la blacklist) |
| POST | `/forgot-password` | Demana token de recuperació per email |
| POST | `/reset-password/:token` | Reset de contrasenya |
| GET  | `/me` | Perfil de l'usuari autenticat |

### Usuaris (`/api/users`) — requereix `users:read` / `users:manage`

| Mètode | Ruta |
|---|---|
| GET | `/` |
| GET | `/:id` |
| PUT | `/:id` |
| DELETE | `/:id` |
| GET | `/:id/permissions` |

### Rols (`/api/roles`)

| Mètode | Ruta |
|---|---|
| GET | `/` |
| GET | `/:id` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |
| GET | `/:id/hierarchy` |
| GET | `/:id/permissions` |

### Permisos (`/api/permissions`)

| Mètode | Ruta |
|---|---|
| GET | `/` (suporta `?category=tasks` i `?grouped=true`) |
| GET | `/:id` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Delegacions (`/api/delegations`)

| Mètode | Ruta |
|---|---|
| GET | `/` |
| GET | `/:id` |
| GET | `/user/:userId` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` (revoca) |

### Auditoria (`/api/audit`) — requereix `audit:read`

| Mètode | Ruta |
|---|---|
| GET | `/logs` (filtrable per `?action=`, `?userId=`, `?status=`, `?startDate=`, `?endDate=`) |
| GET | `/logs/:id` |
| GET | `/stats` |
| GET | `/stats/user/:userId` |
| GET | `/export?format=csv\|json` |

### Tasques (`/api/tasks`) — del T6

| Mètode | Ruta |
|---|---|
| GET | `/?page=1&limit=10` |
| GET | `/stats` |
| GET | `/:id` |
| POST | `/` |
| PUT | `/:id` |
| DELETE | `/:id` |

---

## 📨 Exemples ràpids

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 900,
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "role": "super_admin",
      "permissions": ["system:configure", "users:manage", "..."]
    }
  }
}
```

### 2. Renovar access token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

### 3. Crear delegació de permís

```bash
curl -X POST http://localhost:3000/api/delegations \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "<USER_ID>",
    "permission": "tasks:assign",
    "reason": "Cobertura de vacances",
    "daysValid": 5
  }'
```

### 4. Logout segur

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

A partir d'aquest moment, els dos tokens estan a la blacklist i qualsevol petició retornarà `401 TOKEN_REVOKED`.

---

## 🛡️ Seguretat

- **Contrasenyes**: bcrypt amb 12 rounds + validador (mínim 8 caràcters, majúscula, minúscula, dígit)
- **Tokens**: signats amb claus diferents per access i refresh; access dura només 15 min
- **Blacklist**: en logout els tokens es revoquen i s'eliminen automàticament en expirar (TTL de MongoDB)
- **CORS**: configurable per `CORS_ORIGIN` (per defecte `*` en dev)
- **Helmet**: capçaleres de seguretat (XSS, frame-options, content-type, etc.)
- **Rate limiting**: per rol (anonim 30/min, viewer 50/min, ..., super_admin 1000/min)
- **Validació**: `express-validator` a totes les entrades; sanititzacions automàtiques
- **Auditoria**: cada acció es registra (qui, què, on, IP, user-agent, durada, canvis old/new)

### Codis d'error

| Codi | HTTP | Descripció |
|---|---|---|
| `TOKEN_MISSING` | 401 | No s'ha enviat token |
| `TOKEN_INVALID` | 401 | Token mal format |
| `TOKEN_EXPIRED` | 401 | Token expirat (renoveu amb `/refresh`) |
| `TOKEN_REVOKED` | 401 | Token a la blacklist (logout) |
| `PERMISSION_DENIED` | 403 | No tens permisos suficients |
| `RATE_LIMIT_EXCEEDED` | 429 | Massa peticions |
| `VALIDATION_ERROR` | 400 | Dades d'entrada incorrectes |
| `DUPLICATE` | 400 | Recurs duplicat (email, nom de rol...) |
| `HIERARCHY_INVALID` | 400 | Cicle / level incorrecte a la jerarquia de rols |
| `INVALID_DAYS` | 400 | `daysValid` invàlid |
| `NOT_FOUND` | 404 | Recurs no trobat |

---

## 🧪 Proves (Postman)

S'inclou una col·lecció Postman amb les **51 proves** definides al PDF de la pràctica.

1. Importa `postman/T9-Gestor-Tasques.postman_collection.json` a Postman
2. Configura les variables d'entorn (a la mateixa col·lecció ja venen):
   - `baseUrl` = `http://localhost:3000`
   - `email` = `admin@example.com`
   - `password` = `Admin123!`
3. Executa la primera petició de **Login**: la col·lecció guarda automàticament `accessToken`, `refreshToken` i altres IDs com a variables.
4. Executa la resta amb el botó *Run collection*.

Les proves cobreixen:

| Categoria | Nombre |
|---|---|
| 🔐 Autenticació | 7 |
| 👥 Usuaris | 5 |
| 🧩 Rols | 8 |
| 🔑 Permisos | 6 |
| 🤝 Delegació | 6 |
| 📊 Auditoria | 5 |
| 📋 Tasques | 5 |
| 🛡️ Seguretat | 5 |
| ⚠️ Errors | 4 |
| **TOTAL** | **51** |

---

## 📚 Documentació Swagger

Mentre el servidor està en marxa, visita: <http://localhost:3000/api/docs>

---

## 📝 Notes d'evolució (T7 → T8 → T9)

| | T7 | T8 | T9 |
|---|---|---|---|
| Tokens | JWT 24h | JWT 24h | Access 15m + Refresh 7d |
| Rols | Fixos (USER, ADMIN) | Personalitzables | Jeràrquics amb herència |
| Permisos | — | Granulars | Granulars + delegats |
| Logout | El token segueix vàlid | Igual | Blacklist (revocat de veritat) |
| Auditoria | — | Bàsica | Avançada (canvis, durada, IP, UA) |
| Rate limiting | — | — | Per rol |
| Recuperació pwd | — | — | Email amb token |
| Seguretat HTTP | — | — | CORS + Helmet |

---

## 📦 Lliurament

- ✅ Codi al GitHub (públic)
- ✅ Tots els endpoints implementats
- ✅ Codi comentat (JSDoc + comentaris)
- ✅ `.env.example` complet
- ✅ README amb instruccions
- ✅ Col·lecció Postman exportada (`postman/T9-Gestor-Tasques.postman_collection.json`)
- ✅ Documentació Swagger a `/api/docs`

© 2026 Izan Mendoza — OP1-B1-NODE-09
