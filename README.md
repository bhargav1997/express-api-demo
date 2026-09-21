# Express API — Controller / Service / Repository Architecture

A clean Express REST API built with **TypeScript**, **PostgreSQL**, and a layered architecture.

The goal of this project is to keep HTTP handling, business logic, and database access separated.

---

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Docker
- `pg`
- Zod
- Vitest
- Supertest

---

# Architecture

The application follows:

```text
Client
  │
  ▼
Routes
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Repository
  │
  ▼
PostgreSQL
```

Errors follow a centralized path:

```text
Any Layer
   │
   ▼
asyncHandler
   │
   ▼
Express Error Pipeline
   │
   ▼
Central Error Middleware
   │
   ▼
JSON Error Response
```

---

# Project Structure

```text
express-api/
│
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   └── user.controller.ts
│   │
│   ├── errors/
│   │   └── app-error.ts
│   │
│   ├── middlewares/
│   │   ├── async-handler.ts
│   │   ├── error.middleware.ts
│   │   └── not-found.middleware.ts
│   │
│   ├── repositories/
│   │   └── user.repository.ts
│   │
│   ├── routes/
│   │   └── user.routes.ts
│   │
│   ├── services/
│   │   └── user.service.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── users/
│   │   ├── user.controller.test.ts
│   │   └── user.service.test.ts
│   │
│   └── setup.ts
│
├── db/
│   └── init.sql
│
├── .env
├── .gitignore
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

# Layer Responsibilities

## Route

Routes define the API endpoints.

Example:

```text
GET /api/users
GET /api/users/:id
POST /api/users
```

Routes should not contain business logic or SQL.

---

## Controller

The controller handles HTTP.

Responsibilities:

- Read `req`
- Validate/extract request data
- Call the service
- Return HTTP response

Example:

```text
HTTP Request
     ↓
Controller
     ↓
Service
     ↓
HTTP Response
```

A controller should **not** contain SQL.

Bad:

```ts
const result = await db.query("SELECT * FROM users");
```

Good:

```ts
const users = await this.userService.getUsers();
```

---

## Service

The service contains business logic.

For example:

```ts
const existingUser = await repository.findByEmail(email);

if (existingUser) {
   throw new AppError("A user with this email already exists", 409, "USER_EMAIL_EXISTS");
}
```

The service decides **what the application should do**.

It should not know about Express:

```ts
// ❌ Don't do this in a service
res.status(404).json(...);
```

---

## Repository

The repository handles database access.

Responsibilities:

- SQL queries
- Insert
- Update
- Delete
- Select
- Database-specific logic

Example:

```ts
async findById(id: number) {
  const result = await db.query(
    "SELECT * FROM users WHERE id = $1",
    [id],
  );

  return result.rows[0] ?? null;
}
```

The repository should not know about HTTP.

---

## Error Middleware

All unexpected/application errors eventually reach:

```text
error.middleware.ts
```

Example:

```ts
throw new AppError("User not found", 404, "USER_NOT_FOUND");
```

The error middleware converts this into:

```json
{
   "success": false,
   "error": {
      "code": "USER_NOT_FOUND",
      "message": "User not found"
   }
}
```

This keeps error responses consistent throughout the API.

---

# 1. Install Dependencies

```bash
npm install
```

If setting up the project from scratch:

```bash
npm install express pg zod dotenv

npm install -D \
  typescript \
  tsx \
  @types/node \
  @types/express \
  @types/pg \
  vitest \
  supertest \
  @types/supertest
```

---

# 2. Environment Variables

Create:

```text
.env
```

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/express_api
NODE_ENV=development
```

Do not commit `.env`.

Add it to `.gitignore`:

```gitignore
node_modules/
dist/
.env
coverage/
```

---

# 3. PostgreSQL With Docker

You do not need PostgreSQL installed directly on your machine if you use Docker.

## Start PostgreSQL

```bash
docker run --name express-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=express_api \
  -p 5432:5432 \
  -d postgres:17
```

Check that it is running:

```bash
docker ps
```

You should see:

```text
express-postgres
```

---

# 4. Connect to PostgreSQL

Open the PostgreSQL CLI inside the container:

```bash
docker exec -it express-postgres psql \
  -U postgres \
  -d express_api
```

You should see:

```text
express_api=#
```

You are now inside PostgreSQL.

---

# 5. Create the Users Table

Inside `psql`:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Check the table:

```sql
\dt
```

Check its structure:

```sql
\d users
```

---

# 6. Insert Test Data

```sql
INSERT INTO users (name, email)
VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Doe', 'jane@example.com');
```

Check the data:

```sql
SELECT * FROM users;
```

Exit PostgreSQL:

```sql
\q
```

---

# 7. Database Initialization File

Instead of manually entering SQL, create:

```text
db/init.sql
```

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO users (name, email)
VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Doe', 'jane@example.com')
ON CONFLICT (email) DO NOTHING;
```

Run it:

```bash
docker exec -i express-postgres \
  psql -U postgres -d express_api < db/init.sql
```

---

# 8. Docker Compose

Instead of remembering the long Docker command, use Docker Compose.

Create:

```text
docker-compose.yml
```

```yaml
services:
   postgres:
      image: postgres:17
      container_name: express-postgres
      restart: unless-stopped
      environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: express_api
      ports:
         - "5432:5432"
      volumes:
         - postgres_data:/var/lib/postgresql/data

volumes:
   postgres_data:
```

Start PostgreSQL:

```bash
docker compose up -d
```

Check:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

Stop and remove the database volume:

```bash
docker compose down -v
```

**Warning:** `docker compose down -v` deletes the PostgreSQL data volume.

---

# 9. Run the API

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production:

```bash
npm start
```

The API runs at:

```text
http://localhost:3000
```

---

# 10. API Endpoints

## Health Check

```http
GET /health
```

Example:

```bash
curl http://localhost:3000/health
```

Response:

```json
{
   "success": true,
   "message": "API is healthy"
}
```

---

## Get All Users

```http
GET /api/users
```

```bash
curl http://localhost:3000/api/users
```

---

## Get User

```http
GET /api/users/:id
```

Example:

```bash
curl http://localhost:3000/api/users/1
```

---

## Create User

```http
POST /api/users
```

Example:

```bash
curl \
  -X POST \
  http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob@example.com"
  }'
```

---

# 11. Testing Errors

## User Not Found

```bash
curl http://localhost:3000/api/users/999
```

Expected:

```json
{
   "success": false,
   "error": {
      "code": "USER_NOT_FOUND",
      "message": "User not found"
   }
}
```

---

## Duplicate Email

```bash
curl \
  -X POST \
  http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another John",
    "email": "john@example.com"
  }'
```

Expected:

```json
{
   "success": false,
   "error": {
      "code": "USER_EMAIL_EXISTS",
      "message": "A user with this email already exists"
   }
}
```

---

## Invalid Request

```bash
curl \
  -X POST \
  http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "invalid-email"
  }'
```

Expected:

```json
{
   "success": false,
   "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request body"
   }
}
```

---

# 12. Automated Testing

The project uses:

- **Vitest** for the test runner
- **Supertest** for HTTP API testing

Add these scripts to `package.json`:

```json
{
   "scripts": {
      "dev": "tsx watch src/server.ts",
      "build": "tsc",
      "start": "node dist/server.js",
      "test": "vitest run",
      "test:watch": "vitest",
      "test:coverage": "vitest run --coverage"
   }
}
```

---

# 13. Testing the Service

Create:

```text
tests/users/user.service.test.ts
```

```ts
import { describe, expect, it, vi } from "vitest";

import { UserService } from "../../src/services/user.service.js";
import { UserRepository } from "../../src/repositories/user.repository.js";

describe("UserService", () => {
   it("should return all users", async () => {
      const repository = {
         findAll: vi.fn().mockResolvedValue([
            {
               id: 1,
               name: "John Doe",
               email: "john@example.com",
               created_at: new Date(),
            },
         ]),
      } as unknown as UserRepository;

      const service = new UserService(repository);

      const users = await service.getUsers();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe("john@example.com");

      expect(repository.findAll).toHaveBeenCalledOnce();
   });

   it("should throw when user does not exist", async () => {
      const repository = {
         findById: vi.fn().mockResolvedValue(null),
      } as unknown as UserRepository;

      const service = new UserService(repository);

      await expect(service.getUserById(999)).rejects.toMatchObject({
         statusCode: 404,
         code: "USER_NOT_FOUND",
      });
   });

   it("should reject duplicate email", async () => {
      const repository = {
         findByEmail: vi.fn().mockResolvedValue({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            created_at: new Date(),
         }),
      } as unknown as UserRepository;

      const service = new UserService(repository);

      await expect(
         service.createUser({
            name: "Another John",
            email: "john@example.com",
         }),
      ).rejects.toMatchObject({
         statusCode: 409,
         code: "USER_EMAIL_EXISTS",
      });
   });
});
```

Notice that this test **doesn't require PostgreSQL**.

We're testing the business logic independently by mocking the repository.

That's one of the major benefits of the layered architecture.

---

# 14. API Integration Tests

Install:

```bash
npm install -D supertest @types/supertest
```

Create:

```text
tests/users/user.controller.test.ts
```

```ts
import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app.js";

describe("Users API", () => {
   it("GET /health should return 200", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
         success: true,
         message: "API is healthy",
      });
   });

   it("GET /api/users should return users", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
   });

   it("GET /api/users/:id should return 404 for missing user", async () => {
      const response = await request(app).get("/api/users/999999");

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);

      expect(response.body.error.code).toBe("USER_NOT_FOUND");
   });

   it("POST /api/users should validate request body", async () => {
      const response = await request(app).post("/api/users").send({
         name: "A",
         email: "invalid-email",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
   });
});
```

---

# 15. Run Tests

Run all tests once:

```bash
npm test
```

Watch tests while developing:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

---

# 16. Unit vs Integration Tests

The project has two different types of tests.

## Unit Test

Example:

```text
UserService
    ↓
Mock UserRepository
```

We test business logic without needing PostgreSQL.

Advantages:

- Fast
- Isolated
- Easy to debug
- No database required

---

## Integration Test

Example:

```text
HTTP
 ↓
Express
 ↓
Route
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
PostgreSQL
```

Integration tests verify that multiple parts of the application work together.

---

# 17. Request Lifecycle

For:

```http
POST /api/users
```

the request travels through:

```text
Client
  │
  ▼
POST /api/users
  │
  ▼
Route
  │
  ▼
Validation
  │
  ▼
Controller
  │
  ▼
UserService
  │
  ├── Check existing email
  │
  ▼
UserRepository
  │
  ▼
PostgreSQL
  │
  ▼
UserRepository
  │
  ▼
UserService
  │
  ▼
Controller
  │
  ▼
HTTP Response
```

If something throws:

```text
Repository
    │
    ▼
Service
    │
    ▼
Controller
    │
    ▼
asyncHandler
    │
    ▼
error.middleware.ts
    │
    ▼
JSON Error
```

---

# 18. Important Architecture Rules

## Controller

Do:

```ts
const user = await service.getUserById(id);

res.json({
   success: true,
   data: user,
});
```

Don't:

```ts
// ❌ SQL in controller
await db.query(...);
```

---

### Service

Do:

```ts
if (existingUser) {
   throw new AppError("Email already exists", 409, "USER_EMAIL_EXISTS");
}
```

Don't:

```ts
// ❌ Express inside service
res.status(409).json(...);
```

---

### Repository

Do:

```ts
return db.query("SELECT * FROM users WHERE id = $1", [id]);
```

Don't:

```ts
// ❌ HTTP logic in repository
res.status(404).json(...);
```

---

### Error Handling

Don't repeat this everywhere:

```ts
try {
  // ...
} catch (error) {
  res.status(500).json(...);
}
```

Use:

```text
asyncHandler
     ↓
errorMiddleware
```

instead.

---

# 19. Development Workflow

Start PostgreSQL:

```bash
docker compose up -d
```

Start the API:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Check the API:

```bash
curl http://localhost:3000/health
```

Stop PostgreSQL:

```bash
docker compose down
```

---

# 20. Final Architecture

The important separation is:

```text
                 EXPRESS
                    │
              ┌─────┴─────┐
              │   Routes  │
              └─────┬─────┘
                    │
              ┌─────▼─────┐
              │ Controller│
              │   HTTP    │
              └─────┬─────┘
                    │
              ┌─────▼─────┐
              │  Service  │
              │  Business │
              │   Logic   │
              └─────┬─────┘
                    │
              ┌─────▼─────┐
              │Repository │
              │    DB     │
              └─────┬─────┘
                    │
              ┌─────▼─────┐
              │PostgreSQL │
              └───────────┘
```

And errors:

```text
Controller
    │
Service
    │
Repository
    │
    └──────────┐
               ▼
        asyncHandler
               │
               ▼
       Error Middleware
               │
               ▼
        Consistent JSON
```

This separation makes the application easier to test, maintain, and extend as it grows.
