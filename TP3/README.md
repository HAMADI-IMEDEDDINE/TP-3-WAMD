## Student Information

- **Student Name:** Hamadi ImedEddine
- **Module:** WAMD - TD-TP 3

### Architecture

```text
React frontend (TD-TP 2)  ---HTTP/JSON--->  Express REST API  ---Mongoose--->  MongoDB
                                                |
                                    JWT / OAuth 2.0 authentication
                                    Rate limiting
```

## Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime environment |
| Express.js | Web framework for the REST API |
| MongoDB | NoSQL database |
| Mongoose | MongoDB object modelling from Node.js |
| JSON Web Token (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| jose | Optional OAuth 2.0 / OpenID Connect JWT verification |
| express-rate-limit | API and login rate limiting |
| CORS | Allow requests from the React development origin |
| dotenv | Environment variable configuration |
| Postman / Thunder Client | API testing |

## Project Structure

```text
TP3/
├── .env.example                  # Environment variable template (safe to commit)
├── .gitignore                    # Ignores .env, node_modules, logs, etc.
├── package.json
├── server.js                     # Entry point: config + database + HTTP server
├── src/
│   ├── app.js                    # Express application, CORS, rate limiting, routes
│   ├── config/
│   │   ├── db.js                 # Mongoose connection
│   │   └── env.js                # Environment configuration and validation
│   ├── controllers/
│   │   ├── authController.js     # Register and login
│   │   └── productController.js  # Product CRUD
│   ├── middleware/
│   │   ├── auth.js               # JWT / OAuth2 Bearer token verification
│   │   ├── errorHandler.js       # Consistent error and 404 responses
│   │   ├── rateLimiters.js       # General and login rate limits
│   │   └── validateObjectId.js   # MongoDB ObjectId validation
│   ├── models/
│   │   ├── Product.js            # Product schema
│   │   └── User.js               # User schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── productRoutes.js
│   └── seed/
│       ├── sampleProducts.js     # Catalogue from the TD-TP 2 frontend
│       └── seedProducts.js       # `npm run seed`
└── postman/
    ├── TechNest-TD3.postman_collection.json
    └── README.md                 # Test plan and screenshot checklist
```

## Database Models

### Product

| Field | Type | Constraints |
|---|---|---|
| `name` | String | Required, trimmed, max 120 characters |
| `description` | String | Required, trimmed, max 2000 characters |
| `price` | Number | Required, `>= 0` |
| `category` | String | Required, trimmed, max 60 characters |
| `imageUrl` | String | Required, valid `http(s)` URL, max 2048 characters |
| `stock` | Number | Required, integer, `>= 0` |
| `createdAt` / `updatedAt` | Date | Added automatically by Mongoose timestamps |

### User

| Field | Type | Constraints |
|---|---|---|
| `name` | String | Required, trimmed, max 80 characters |
| `email` | String | Required, unique, lowercase, valid email address |
| `passwordHash` | String | Required, bcrypt hash, excluded from queries and JSON by default |
| `createdAt` / `updatedAt` | Date | Added automatically by Mongoose timestamps |

Passwords are hashed with **bcrypt (12 salt rounds)** before storage. Plain-text passwords
are never stored, logged or returned. API responses expose `id` (a string) instead of
MongoDB's `_id`, and never expose `passwordHash` or `__v`.

## API Endpoints

**Base URL:** `http://localhost:3000`

### Authentication

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate a user and return a JWT | Public |

### Products

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/api/products` | Retrieve all products | Public |
| `GET` | `/api/products/:id` | Retrieve one product | Public |
| `POST` | `/api/products` | Create a product | JWT or OAuth2 Bearer token |
| `PUT` | `/api/products/:id` | Update a product (partial updates allowed) | JWT or OAuth2 Bearer token |
| `DELETE` | `/api/products/:id` | Delete a product | JWT or OAuth2 Bearer token |

### Utility

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/` | API information | Public |
| `GET` | `/api/health` | Health check | Public (rate limited) |

### Response Formats

`GET /api/products`:

```json
{
  "count": 2,
  "products": [
    {
      "id": "67b7f9a2f1a2b3c4d5e6f7a8",
      "name": "MacBook Pro 14\"",
      "description": "Apple M3 Pro chip, 18GB RAM, 512GB SSD.",
      "price": 1999.99,
      "category": "Laptops",
      "imageUrl": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
      "stock": 25,
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

`GET /api/products/:id` returns `{ "product": { ... } }`.

Successful create, update and delete responses include `message` and the affected
`product`.

Errors always use the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data.",
    "details": ["price must be greater than or equal to 0."]
  }
}
```

### HTTP Status Codes

| Status | Meaning | Typical use |
|---|---|---|
| `200 OK` | Success | Retrieval, update, delete |
| `201 Created` | Resource created | Register, create product |
| `400 Bad Request` | Invalid input | Missing fields, invalid id, malformed JSON |
| `401 Unauthorized` | Missing or invalid token | Protected endpoints |
| `403 Forbidden` | Origin not allowed | CORS rejection |
| `404 Not Found` | Resource or route not found | Unknown product or endpoint |
| `409 Conflict` | Duplicate value | Email already registered |
| `429 Too Many Requests` | Rate limit exceeded | General or login limiter |
| `500 Internal Server Error` | Unexpected failure | Unhandled server/database error |

## JWT Authentication Mechanism

1. A user registers with `POST /api/auth/register`. The password is validated, hashed with
   bcrypt and stored in MongoDB. Duplicate emails are rejected with `409 Conflict`.
2. The user logs in with `POST /api/auth/login`.
3. The API verifies the email/password pair with bcrypt.
4. On success, the API signs a JWT containing the user id (`sub`), name and email. The
   token expires according to `JWT_EXPIRES_IN` (default `1h`).
5. The client stores the token and sends it on every protected request:

   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```

6. The `protect` middleware extracts the token, verifies its signature with
   `JWT_SECRET`, checks expiry and attaches the user to `req.user`.
7. A missing token returns `401 UNAUTHORIZED`; an invalid or expired token returns
   `401 INVALID_TOKEN`. Product reads stay public.

The JWT secret is **never hardcoded**: it is read from the `JWT_SECRET` environment
variable.

## OAuth 2.0 / OpenID Connect Support

The protected product endpoints also support OAuth 2.0 / OpenID Connect **JWT access
tokens**. This is optional and is enabled only when the following variables are set:

```env
OAUTH_ISSUER=https://your-oauth-provider.example.com/
OAUTH_AUDIENCE=your-api-audience
OAUTH_JWKS_URI=https://your-oauth-provider.example.com/.well-known/jwks.json
```

The middleware tries the local JWT first. If that fails and OAuth2 is configured, it
verifies the token against the provider's JWKS endpoint, issuer and (when supplied)
audience. A valid provider token continues the request; an invalid or missing token
returns `401 Unauthorized`.

### Testing OAuth 2.0 with Postman

1. Register an application/client with an OAuth 2.0 / OIDC provider (Auth0, Keycloak,
   Google, etc.) and obtain the client ID, client secret, authorization URL, token URL,
   scopes and the exact redirect URI.
2. In Postman, open the protected request and go to the **Authorization** tab.
3. Select **OAuth 2.0**.
4. Use **Authorization Code (With PKCE)** for a user sign-in scenario.
5. Enter the authorization URL, token URL, client ID, client secret, scope and redirect
   URI exactly as registered with the provider.
6. Click **Get New Access Token**, authenticate, then **Use Token**.
7. Send the request. Postman adds `Authorization: Bearer <ACCESS_TOKEN>` automatically.
8. Verify that a valid token succeeds and that an invalid/missing token returns `401`.

> **Note:** the API verifies self-contained JWT access tokens through the provider's
> JWKS endpoint. Providers that issue opaque access tokens require token introspection,
> which is outside the scope of this lab. The local JWT flow always works without any
> OAuth provider configuration.

## Rate Limiting

Implemented with `express-rate-limit`:

| Scope | Limit | Response when exceeded |
|---|---|---|
| General API (`/api/*`) | 100 requests / 15 minutes / IP | `429` with `TOO_MANY_REQUESTS` |
| Login (`POST /api/auth/login`) | 5 requests / 15 minutes / IP | `429` with `TOO_MANY_REQUESTS` |

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many login attempts from this IP address. Please try again after 15 minutes."
  }
}
```

The login endpoint has both limiters; the stricter login limit triggers first. Counters are
stored in memory, so **restarting the server resets them**. For a multi-instance
production deployment, use a shared store such as Redis.

## Installation and Running

### Prerequisites

- Node.js **20.19+**
- npm
- MongoDB Community Server **or** a MongoDB Atlas account
- Postman / Thunder Client (for API testing)

### Steps

From the repository root:

```powershell
cd TP3
npm install
Copy-Item .env.example .env
# Edit .env with your MongoDB URI and a strong JWT secret
npm run seed
npm run dev
```

On macOS/Linux the copy command is:

```bash
cp .env.example .env
```

The API starts at **http://localhost:3000**. Test it with:

```text
GET http://localhost:3000/api/health
```

### npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with Node's watch mode (auto-restart) |
| `npm start` | Start the API without watch mode |
| `npm run seed` | Insert/update the sample product catalogue |

## MongoDB Configuration

### Option A - Local MongoDB Community Server

1. Install MongoDB Community Server and start the service.
2. Use this connection string in `.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/technest_store
   ```

3. Run `npm run seed` to populate the catalogue.

### Option B - MongoDB Atlas

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow your IP address in **Network Access**.
3. Copy the connection string and add a database name, for example:

   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/technest_store?retryWrites=true&w=majority
   ```

4. Replace `<username>` and `<password>`; URL-encode special characters in the password.
5. Run `npm run seed` to populate the catalogue.

The seed script is **idempotent**: it upserts the 12 sample products by name and does not
delete products you created through the API.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port |
| `NODE_ENV` | No | `development` | Environment name |
| `MONGODB_URI` | **Yes** | - | Local or Atlas MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | Secret used to sign/verify JWTs (32+ characters) |
| `JWT_EXPIRES_IN` | No | `1h` | Token lifetime (`1h`, `7d`, `3600`, ...) |
| `CLIENT_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed CORS origins |
| `OAUTH_ISSUER` | No | - | OAuth2/OIDC issuer (enables OAuth verification) |
| `OAUTH_AUDIENCE` | No | - | Expected access-token audience |
| `OAUTH_JWKS_URI` | No | - | Provider JWKS URL (required for OAuth verification) |

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Security Requirement

- `.env` is listed in `.gitignore` and **must never be committed**.
- Only `.env.example` with placeholder values is committed.
- Never commit real MongoDB credentials, passwords or JWT secrets to GitHub.
- If a secret is accidentally exposed, rotate it immediately.

## API Testing with Postman

1. Start the API and run `npm run seed`.
2. Import `postman/TechNest-TD3.postman_collection.json` into Postman.
3. Run the folders in order:
   - **00 - Health**
   - **01 - Authentication** (Register, duplicate email, login, invalid login)
   - **02 - Products (public)** (list, single, invalid id, unknown id)
   - **03 - Products (JWT protected)** (create, update, delete, missing/invalid token,
     invalid data)
   - **04 - Rate limiting**
4. The **Login** request automatically stores the JWT in the `{{token}}` collection
   variable, and the product requests store a product id in `{{productId}}`.

See [`postman/README.md`](postman/README.md) for the full test checklist and the
screenshots required by the assignment.

### Quick manual test with curl

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"Password123!\"}"

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Password123!\"}"

# Public product list
curl http://localhost:3000/api/products

# Create a product with the returned token
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d "{\"name\":\"Test Product\",\"description\":\"Demo\",\"price\":99.99,\"category\":\"Accessories\",\"imageUrl\":\"https://example.com/p.png\",\"stock\":5}"
```

## Preparation for React Integration

The API is ready for the TD-TP 2 frontend:

- all product endpoints return JSON;
- product fields are consistent (`id`, `name`, `description`, `price`, `category`,
  `imageUrl`, `stock`);
- `GET /api/products` is public and returns `{ count, products }`;
- `POST` and `PUT` accept JSON request bodies;
- CORS allows the React development origin `http://localhost:5173` (configurable);
- errors use one consistent shape.

Example frontend request:

```js
const response = await fetch('http://localhost:3000/api/products');
const { products } = await response.json();
```

The shopping cart can remain in Redux. Persisting carts and implementing orders are
outside the scope of TD-TP 3.

## TD-TP 3 Requirements Checklist

- ✅ Node.js backend application
- ✅ REST API endpoints with Express.js
- ✅ MongoDB connection through Mongoose
- ✅ Product and User models
- ✅ Product CRUD operations
- ✅ Passwords hashed with bcrypt
- ✅ Duplicate email prevention (`409`)
- ✅ JWT generated after successful login
- ✅ JWT-protected create/update/delete endpoints
- ✅ Optional OAuth 2.0 / OIDC access-token verification
- ✅ General and login rate limits with `429` responses
- ✅ Appropriate HTTP status codes and consistent errors
- ✅ CORS configured for the React development origin
- ✅ Sample products seed script
- ✅ `.env.example`, `.gitignore` protection and documentation
- ✅ Postman collection for API testing

