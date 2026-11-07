# Postman Test Plan - WAMD TD-TP 3

This folder contains the Postman collection for the TechNest Store backend.

## Import and Setup

1. Start MongoDB and the API:
   ```powershell
   cd TP3
   npm run seed
   npm run dev
   ```
2. Open Postman and choose **Import**.
3. Select `TechNest-TD3.postman_collection.json`.
4. Confirm the collection variable `baseUrl` is `http://localhost:3000`.
5. Run the requests in the order below. The **Login** request saves the JWT to
   `{{token}}` automatically, and product requests save `{{productId}}`.

## Test Matrix and Screenshot Checklist

Take a screenshot of each response (status code, headers where relevant, and body).
Suggested file names are given for the submission.

### Authentication

| # | Request | Expected result | Suggested screenshot |
|---|---|---|---|
| 1 | Register user | `201 Created`, user JSON without `passwordHash` | `01-register.png` |
| 2 | Register duplicate email | `409 Conflict`, `EMAIL_ALREADY_REGISTERED` | `02-register-duplicate.png` |
| 3 | Login | `200 OK`, JWT returned and saved | `03-login-valid.png` |
| 4 | Login invalid credentials | `401 Unauthorized`, `INVALID_CREDENTIALS` | `04-login-invalid.png` |
| 5 | Token value in the `{{token}}` variable | JWT visible in collection variables | `05-jwt-token.png` |

### Product Management

| # | Request | Expected result | Suggested screenshot |
|---|---|---|---|
| 6 | Get all products | `200 OK`, `count` and `products` array | `06-products-list.png` |
| 7 | Get product by id | `200 OK`, the requested product | `07-product-single.png` |
| 8 | Create product with valid token | `201 Created`, new product id saved | `08-product-create.png` |
| 9 | Update product with valid token | `200 OK`, updated fields | `09-product-update.png` |
| 10 | Delete product with valid token | `200 OK`, deleted product returned | `10-product-delete.png` |

### Security and Error Handling

| # | Request | Expected result | Suggested screenshot |
|---|---|---|---|
| 11 | Create product without token | `401 Unauthorized`, `UNAUTHORIZED` | `11-no-token.png` |
| 12 | Create product with invalid token | `401 Unauthorized`, `INVALID_TOKEN` | `12-invalid-token.png` |
| 13 | Get product with invalid id | `400 Bad Request`, `INVALID_ID` | `13-invalid-id.png` |
| 14 | Create product with missing/invalid data | `400 Bad Request`, `VALIDATION_ERROR` with details | `14-invalid-product.png` |
| 15 | Request an unknown product id | `404 Not Found`, `PRODUCT_NOT_FOUND` | `15-product-not-found.png` |

### Rate Limiting

| # | Request | How to reproduce | Expected result | Suggested screenshot |
|---|---|---|---|---|
| 16 | Login rate limit | Send `Login rate limit - run 6 times` repeatedly (6th request) | `429 Too Many Requests` | `16-login-rate-limit.png` |
| 17 | General rate limit | Run `General rate limit - run 101 times` with the Collection Runner, 101 iterations | `429 Too Many Requests` | `17-general-rate-limit.png` |

**Important:** rate-limit counters are in memory. After testing, restart the API
(`Ctrl+C`, then `npm run dev`) to reset them. The general limit also applies to the login
endpoint, so run the rate-limit tests last.

### Optional OAuth 2.0 Demonstration

If your OAuth provider issues JWT access tokens:

1. Configure `OAUTH_ISSUER`, `OAUTH_AUDIENCE` and `OAUTH_JWKS_URI` in `.env`.
2. In Postman, open a protected request, go to **Authorization**.
3. Choose **OAuth 2.0** > **Authorization Code (With PKCE)**.
4. Fill in the authorization URL, token URL, client ID, client secret, scope and redirect
   URI from the provider.
5. Click **Get New Access Token**, authenticate, then **Use Token**.
6. Send the protected request and capture the `200 OK` response.
7. Send the same request with the token removed or corrupted and capture the `401`.

## Thunder Client

Thunder Client can import Postman collections. If the import is not supported in your
version, create the same requests manually using the method, URL, body and Authorization
header shown in the collection. The test scripts are Postman-specific; the expected
status codes and response bodies remain the same.

## Submission Screenshots

Save the screenshots in a folder such as `postman/screenshots/` (or wherever your course
requires) and submit them together with the GitHub repository link. The PDF requires
screenshots for:

- authentication: register, duplicate email, valid login, invalid login, JWT received;
- product management: list, single product, create, update, delete;
- security: no token, invalid token, invalid product id, missing/invalid product data;
- rate limiting: login `429` and general `429`.
