# Friendbook

An interactive, full-stack social networking app with authentication, posts, comments, messaging, and real-time notifications. 🚀

## 🔗 Live Demo

[Click For Live Demo](#) <!-- Add your deployed URL here -->

## 📦 Monorepo Structure

```
friendbook/
├─ client/        # React + TypeScript (Vite)
└─ server/        # Node.js + Express + TypeScript + Prisma
```

## 💻 Run Locally

### 1) Clone the project

```bash
git clone https://github.com/your-username/friendbook.git
cd friendbook
```

---

### 2) Backend (Server)

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"

# JWT / Auth
ACCESS_TOKEN_SECRET="your_access_token_secret"
REFRESH_TOKEN_SECRET="your_refresh_token_secret"
JWT_SECRET="your_legacy_or_unused_secret"

# Server
PORT=5001

# Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Generate Prisma client and run migrations (if using Prisma schema):

```bash
npx prisma generate
# npx prisma migrate dev --name init   # uncomment if you are managing migrations locally
```

Start the server (dev):

```bash
npm run server   # if present
# or
npm run dev      # if present
# or, as defined in package.json:
npm run server || npm run dev || npm run start || npm run build && npm start
```

> In this project, common scripts are:
>
> * `npm run server` → `nodemon src/server.ts`
> * `npm run build` → `tsc`
> * `npm start` → `node dist/server.js`

The API will default to: `http://localhost:5001/api`

WebSocket server runs on the same host/port and expects a `token` query param for auth (Native WS + Socket events).

---

### 3) Frontend (Client)

```bash
cd ../client
npm install
```

(Optional) Configure API URL if you change the server port:

* `client/src/api/axiosInstance.ts` uses:

```ts
const API_BASE_URL = 'http://localhost:5001/api';
```

Start the client (dev):

```bash
npm run dev
```

Vite will boot at something like `http://localhost:5173`

---

## 🔖 Features

* **Auth & Security**

  * Register, Login with **JWT** (access & refresh).
  * Protected routes via custom **auth middleware**.
  * Secure password hashing with **bcrypt/bcryptjs**.
* **Social**

  * Create, like, delete **posts**.
  * **Comments** on posts.
  * **Friend requests** (send/accept/decline) & friend lists.
  * **Notifications** (friendship, likes, comments, messages).
* **Messaging**

  * **Direct messages** & conversations.
  * **Real-time** updates via **WebSockets**.
* **Media**

  * Image/video uploads via **Cloudinary**.
* **API & Validation**

  * RESTful endpoints with **Express**.
  * **Zod** input validation in controllers.
* **Frontend**

  * **React + TypeScript** (Vite).
  * Routing with **react-router-dom**.
  * Server state with **@tanstack/react-query**.
  * **Tailwind CSS** styling.
  * Font Awesome icons.
* **DX**

  * Strong typing across client & server.
  * Clean module separation: `controllers/`, `routes/`, `middleware/`.

---

## 🗂️ Server Endpoints (High Level)

Base URL: `http://localhost:5001/api`

### Auth (`/auth`)

* `POST /register` – create a new user
* `POST /login` – login, returns tokens
* `POST /refresh` – refresh access token
* `POST /logout` – invalidate session/refresh token

### Users (`/users`)

* `GET /me` – get current user profile
* `GET /:id` – get user by id
* `PUT /me` – update profile (name, bio, avatar, etc.)
* `GET /search?query=` – search users

### Posts (`/posts`)

* `GET /` – feed (paginated)
* `GET /:id` – single post
* `GET /user/:userId` – posts by user
* `POST /` – create post (supports media)
* `PATCH /like/:id` – like/unlike post
* `DELETE /:id` – delete post

### Comments (`/comments`)

* `GET /:postId` – list comments for a post
* `POST /:postId` – add comment
* `DELETE /:commentId` – delete comment

### Friends (`/friends`)

* `POST /request/:userId` – send request
* `PATCH /accept/:requestId` – accept request
* `PATCH /decline/:requestId` – decline request
* `GET /requests` – incoming/outgoing requests
* `GET /list/:userId` – user friend list

### Notifications (`/notifications`)

* `GET /` – list notifications (paginated)
* `PATCH /read/:id` – mark as read
* `PATCH /read-all` – mark all as read

### Messages (`/messages`)

* `POST /` – send message `{ receiverId, content, postId? }`
* `GET /conversations` – list conversations
* `GET /conversations/:friendId` – messages with a friend

> All protected endpoints require `Authorization: Bearer <access_token>`

---

## 🌐 Real-Time (WebSockets)

* Server: Native **ws** (`WebSocketServer`) + custom event helpers.
* Auth: connect with `?token=<access_token>` in the WS URL.
* Events: new messages, likes/comments notifications, friend request updates.

---

## 📸 Screenshots

> Place your screenshots in `client/public/screenshots/` or `client/src/assets/` and update the paths below.

**Home / Feed**

![Feed](client/public/screenshots/feed.png)

**Login**

![Login](client/public/screenshots/login.png)

**Messages**

![Messages](client/public/screenshots/messages.png)

---

## 📌 Tasks Performed

**Planning & Setup**

* Chose React + Vite + TypeScript for client, Express + TypeScript + Prisma for server.
* Structured monorepo with clear separation of concerns.

**Design**

* Component-driven UI using Tailwind.
* Router-based navigation, protected routes for auth-only pages.

**Development**

* JWT auth (access/refresh), cookie handling, interceptors on client.
* CRUD for posts & comments, likes, friend requests.
* Messaging & notifications with WebSockets.
* File uploads via Cloudinary (express-fileupload).

**Testing**

* Manual tests for auth flows, protected routes, and API error states.
* API verified with Postman/Thunder Client.

**Deployment**

* Client: Vercel/Netlify.
* Server: Render/Railway/Heroku/Fly.io.
* Environment variables managed per-environment.

---

## ⚙️ Tech Stack

**Frontend:** React, TypeScript, Vite, React Router, @tanstack/react-query, Tailwind CSS
**Backend:** Node.js, Express, TypeScript, Zod
**Database/ORM:** Prisma Client (`@prisma/client`) with a relational DB (e.g., PostgreSQL)
**Auth:** JWT (access & refresh), bcrypt/bcryptjs
**Real-time:** ws (WebSocketServer) + client WS, socket helpers
**Media:** Cloudinary
**Utilities:** Axios, express-fileupload, cors, dotenv

Badges:

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge\&logo=react\&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge\&logo=typescript\&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge\&logo=vite\&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge\&logo=node.js\&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge\&logo=express\&logoColor=%2361DAFB)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge\&logo=prisma\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%23316192.svg?style=for-the-badge\&logo=postgresql\&logoColor=white)
![Tailwind](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge\&logo=tailwind-css\&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge\&logo=JSON%20web%20tokens)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge\&logo=cloudinary\&logoColor=white)
![WS](https://img.shields.io/badge/WebSockets-000000?style=for-the-badge)

---

## 🧩 Environment Variables Summary

**Server (`server/.env`):**

* `DATABASE_URL` – Prisma connection string (PostgreSQL recommended)
* `ACCESS_TOKEN_SECRET` – JWT access secret
* `REFRESH_TOKEN_SECRET` – JWT refresh secret
* `JWT_SECRET` – (legacy/compat)
* `PORT` – server port (default `5001`)
* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Client:**

* Uses hardcoded `http://localhost:5001/api` in `src/api/axiosInstance.ts`

  * Update this if deploying or if your server runs on a different port.

---

## 🧪 Useful Scripts

**Server**

* `npm run server` – dev with Nodemon (`nodemon src/server.ts`)
* `npm run build` – TypeScript build
* `npm start` – run compiled server (`dist/server.js`)
* `npx prisma studio` – Prisma data browser (optional)
* `npx prisma generate` – regenerate Prisma client

**Client**

* `npm run dev` – Vite dev server
* `npm run build` – build for production
* `npm run preview` – preview production build

---

## 👨🏽‍💻 Author

* [@kovidbehl](https://github.com/kovidbehl)

---

**Note:** Replace placeholder paths and the live demo URL as needed. If you switch databases, update `DATABASE_URL` and regenerate Prisma client.
