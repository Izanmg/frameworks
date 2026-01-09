# 📝 Gestor de Tasques API - v2.0 (Autenticació i Rols)

Aquesta és una ampliació de l'API de Gestió de Tasques que inclou un sistema complet d'autenticació mitjançant **JWT**, gestió de perfils d'usuari i un panell d'administració.

## 🚀 Tecnologies Utilitzades
- **Node.js & Express**: Framework del servidor.
- **MongoDB & Mongoose**: Base de dades i modelatge.
- **JWT (JSON Web Token)**: Autenticació segura.
- **Bcryptjs**: Xifrat de contrasenyes.
- **Multer & Cloudinary**: Gestió d'imatges.

---

## 🔐 Autenticació (Públic)
Rutes per gestionar l'accés al sistema.

| Mètode | Ruta | Descripció |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registra un nou usuari (name, email, password, role). |
| `POST` | `/api/auth/login` | Inicia sessió i retorna el Token JWT. |

---

## 👤 Perfil d'Usuari (Protegit)
Requereix Header: `Authorization: Bearer <token>`

| Mètode | Ruta | Descripció |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Obté les dades del perfil de l'usuari loguejat. |
| `PUT` | `/api/auth/profile` | Actualitza el nom i l'email de l'usuari. |
| `PUT` | `/api/auth/change-password` | Canvia la contrasenya (requereix la contrasenya actual). |

---

## 👑 Administració (Només Admin)
Requereix Header: `Authorization: Bearer <token_admin>`

| Mètode | Ruta | Descripció |
| :--- | :--- | :--- |
| `GET` | `/api/auth/admin/users` | Llista tots els usuaris del sistema. |
| `DELETE` | `/api/auth/admin/users/:id` | Elimina un usuari per ID. |
| `PUT` | `/api/auth/admin/users/:id/role` | Canvia el rol d'un usuari (user/admin). |

---

## 📋 Gestió de Tasques (Protegit)
Totes les rutes de tasques estan protegides. Els usuaris només veuen les seves tasques, mentre que els **admins** tenen accés total.

| Mètode | Ruta | Descripció |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | Llista tasques (filtrat per usuari o totes si és admin). |
| `POST` | `/api/tasks` | Crea una nova tasca associada a l'usuari. |
| `GET` | `/api/tasks/:id` | Obté el detall d'una tasca. |
| `PUT` | `/api/tasks/:id` | Actualitza una tasca. |
| `DELETE` | `/api/tasks/:id` | Elimina una tasca. |
| `GET` | `/api/tasks/stats` | Estadístiques de tasques. |

---

## 🖼 Gestió d'Imatges
- `POST /api/upload/local`: Puja imatge al servidor local.
- `POST /api/upload/cloud`: Puja imatge a Cloudinary.
- `PUT /api/tasks/:id/image`: Assigna una URL d'imatge a una tasca.

---

## 🛠 Instal·lació i Ús

1. Instal·lar dependències:
   ```bash
   npm install
   ```

2. Configurar el fitxer `.env`:
   ```env
   PORT=3000
   MONGO_URI=la_teva_url_de_mongodb
   JWT_SECRET=la_teva_clau_secreta
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

3. Executar el servidor:
   ```bash
   npm start
   # o en mode desenvolupament
   npm run dev
   ```

---
*Projecte realitzat per Izan Mendoza - Node.js Curs 2025-2026*
