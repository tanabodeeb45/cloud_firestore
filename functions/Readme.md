# BLHS Google Classroom Integration

Microservice for Google Classroom integration on the BLHS platform. Built as **Firebase Functions (v2)** with **Express** and **Cloud Firestore**.

Designed with a **functional programming** approach (Linus Torvalds style): simple plain functions, early returns, no over-engineered classes, and clear logic.

---

## 🛠 Tech Stack

- **Framework:** Firebase Functions v2 + Express
- **Database:** Cloud Firestore
- **Auth:** Google OAuth2 (for Classroom API v1)
- **Validation:** `express-validator` (Standard Express validation)
- **Error Handling:** Global Error Middleware with `asyncHandler` wrapper
- **Security:** AES-256-CBC token encryption at rest

---

## 🔑 Environment Variables

Create a `.env` file in the `functions/` directory with the following variables:

| Variable               | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth 2.0 Client ID                                                            |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret                                                        |
| `GOOGLE_REDIRECT_URI`  | `https://<your-region>-<your-project>.cloudfunctions.net/api/v1/auth/google/callback` |
| `TOKEN_ENCRYPTION_KEY` | 32-byte (64 hex characters) key for AES-256 encryption                                |
| `INTERNAL_API_KEY`     | Secret key for service-to-service communication                                       |
| `FRONTEND_URL`         | BLHS Frontend URL (for CORS and OAuth redirect)                                       |

---

## 📂 Firestore Structure

### `oauth_tokens/{blhsUserId}`

Stores encrypted Google OAuth tokens for each user.

- `access_token`: Encrypted AES-256
- `refresh_token`: Encrypted AES-256
- `token_expiry`: Timestamp
- `email`, `role`, `google_user_id`

### `publish_records/{recordId}`

Tracks teacher's published items to Google Classroom.

- `blhs_user_id`, `blhs_document_id`, `classroom_course_id`, `classroom_item_id`
- `status`: `PENDING`, `PUBLISHED`, `FAILED`, `DELETED`

### `users/{userId}/student_cache/{itemId}`

Cached content for students to feed the RAG pipeline.

- `classroom_item_id`, `item_type`, `title`, `description`, `materials_json`, `due_date`, `synced_at`

---

## 🚀 API Endpoints

### 🔐 Authentication (`/api/v1/auth`)

| Method   | Path               | Description                                                             |
| -------- | ------------------ | ----------------------------------------------------------------------- |
| `GET`    | `/google`          | **OAuth Entry:** Query `role=teacher\|student`, `blhs_user_id=ID`       |
| `GET`    | `/google/callback` | **OAuth Callback:** Handles code exchange and token storage             |
| `GET`    | `/status`          | **Check Status:** Header `X-BLHS-User-Id` required                      |
| `DELETE` | `/revoke`          | **Disconnect:** Header `X-BLHS-User-Id` required (revokes Google token) |

### 🍎 Teacher (`/api/v1/teacher`)

_All require `X-BLHS-User-Id` header._

| Method   | Path                        | Description                                                                                                   |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/courses`                  | List active courses where user is a teacher                                                                   |
| `GET`    | `/courses/:courseId/topics` | List topics within a specific course                                                                          |
| `POST`   | `/publish`                  | **Publish Content:** Body: `blhsDocumentId`, `courseId`, `itemType`, `title`, `description`, `url`, `topicId` |
| `GET`    | `/publish-history`          | Get teacher's publication history                                                                             |
| `PATCH`  | `/publish/:recordId`        | Update published content (Title, Description, Topic)                                                          |
| `DELETE` | `/publish/:recordId`        | Delete content from Classroom and Firestore                                                                   |

### 🎓 Student (`/api/v1/student`)

_All require `X-BLHS-User-Id` header._

| Method | Path                            | Description                                                      |
| ------ | ------------------------------- | ---------------------------------------------------------------- |
| `GET`  | `/courses`                      | List courses where user is a student                             |
| `GET`  | `/courses/:courseId/materials`  | Get cached Materials for a course                                |
| `GET`  | `/courses/:courseId/coursework` | Get cached Assignments for a course                              |
| `POST` | `/sync`                         | **Sync Now:** Body: `courseId`. Pulls latest content from Google |
| `GET`  | `/content`                      | Get all cached content for RAG pipeline                          |

### ⚙️ Internal & Health

| Method | Path                                | Description                                 |
| ------ | ----------------------------------- | ------------------------------------------- |
| `GET`  | `/health/ready`                     | Readiness check                             |
| `GET`  | `/internal/student-content/:userId` | **RAG Access:** Header `X-API-Key` required |

---

## 🛠 Development & Deployment

### Local Development

```bash
cd functions
npm install
# Setup .env
npm run build
firebase emulators:start --only functions
```

### Deployment

```bash
firebase deploy --only functions
```

---

## 📝 Coding Style Guidelines

1. **Keep it Flat:** Avoid deep nesting using guard clauses.
2. **Plain Functions over Classes:** Use exported functions for services and controllers.
3. **Enum Driven:** Use `UserRole`, `PublishStatus`, etc. for all state/status variables.
4. **DTOs for Types:** Define request/response structures in `types/dtos.ts`.
5. **Fail Early:** Validate requests immediately using `express-validator`.
6. **Centralized Error Handling:** Throw `AppError` and let the global middleware handle it.
