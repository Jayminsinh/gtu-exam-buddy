# 🚀 Project Context Blueprint: GTU Exam Buddy

## 📌 Project Overview & Operational Flow

GTU Exam Buddy is a MERN-style academic archive and AI blueprint generator for Gujarat Technological University exam preparation. The application lets students and administrators move through a structured curriculum map: Branch -> Semester -> Subject -> Syllabus + Past Papers -> AI-generated IMP question blueprint PDF.

Operationally, the frontend is a Vite React app under `client/`, and the backend is an Express 5 API under `server/`. The frontend uses a protected dashboard layout with CRUD panels for branch, semester, subject, papers, and an indexed student classroom view. All frontend network calls are centralized through `client/src/utils/api.js`, which now resolves its base URL from `import.meta.env.VITE_API_URL` or falls back to the production-safe same-origin `/api/v1` prefix.

The student flow starts in `client/src/pages/StudentSearch.jsx`. On mount, the page fetches active branches. Once the student selects a branch and semester, the UI dynamically resolves the semester document and then fetches subjects for that branch-semester pair. Selecting a subject stores the current subject context in `localStorage`, fetches the latest syllabus, fetches archival papers, filters those papers by selected subject code/name, and exposes a syllabus upload area if no official syllabus is indexed.

The AI blueprint flow is intentionally strict. A student stages a local syllabus PDF, the UI validates that it is a `.pdf` with `application/pdf` MIME type and under 5MB, then posts multipart form data to `/ai/generate-blueprint-pdf`. The API authenticates the request, temporarily stores the uploaded file in `uploads/`, extracts text from the syllabus and matching stored past papers, asks Gemini for schema-constrained chapter/question analysis, and streams a generated PDF back to the browser as a blob download.

Administrators can maintain academic metadata and archival papers through dashboard panels. Paper and syllabus uploads use server-side Multer validation, storage upload services, Mongoose models, and controller/service boundaries. Bulk paper ingestion can also run offline through `server/src/scripts/bulkUploadPapers.js`, which scans `server/bulk_papers/`, infers metadata from filenames, uploads documents to Supabase Storage, and creates MongoDB `Paper` records.

Primary directory map:

```text
client/
  src/
    pages/              React dashboard and auth pages
    layouts/            Protected dashboard shell
    context/            Auth provider and session state
    utils/api.js        Axios instance, auth headers, token refresh
    index.css           Tailwind v4 theme tokens
server/
  src/
    app.js              Express middleware and route mounting
    config/             Environment, DB, Gemini, Cloudinary config
    controllers/        HTTP request/response mapping
    routes/             Versioned route registries
    services/           Business logic and external integrations
    models/             Mongoose schemas and indexes
    validators/         Zod request schemas
    middlewares/        Auth, uploads, errors
    scripts/            Bulk ingestion utilities
```

## 🎨 Visual Identity, Grid Typography & Luxury Theme Choices

The UI uses a quiet luxury design system defined in `client/src/index.css` through Tailwind CSS v4 theme tokens. The palette is deliberately restrained: ivory backgrounds (`#F7F4EF`), cream surfaces (`#FAF8F5`), espresso/charcoal typography (`#1C1917`, `#2E2A25`), taupe secondary labels (`#A89F91`), and muted gold accents (`#C9A96E`).

Typography is split between editorial serif display text and functional sans-serif UI text. `Playfair Display`, `Didot`, and `Georgia` are used for headings and institutional tone, while `Inter` and system sans fonts handle labels, controls, tables, and compact metadata. The visual rhythm relies on uppercase micro-labels, fine borders, restrained shadows, and dense dashboard grids instead of marketing-style hero panels.

Dashboard components follow a predictable academic registry pattern: high-contrast section headers, three-column cascading selectors, bordered data panels, compact tables, and subtle animation through Framer Motion. Sonner toast styling is centralized in `client/src/App.jsx`, matching the cream/espresso/gold visual language for success, error, and warning feedback.

## 🛠️ Complete Full-Stack Technology Layer Grid (Frontend, Backend, AI Infrastructure, Cloud Storage Engines)

| Layer | Technology | Workspace Location | Role |
| --- | --- | --- | --- |
| Frontend runtime | React 19 + Vite 8 | `client/` | Single-page app, protected dashboard, file staging, blob PDF download |
| Routing | React Router 7 | `client/src/App.jsx` | Public auth routes and protected `/dashboard/*` workspace |
| Styling | Tailwind CSS 4 | `client/src/index.css` | Theme tokens, layout utilities, high-contrast academic UI |
| Animation | Framer Motion | `client/src/pages/StudentSearch.jsx` | Resource panel transitions and empty/loading states |
| Notifications | Sonner | `client/src/App.jsx`, page handlers | User feedback for validation, CRUD, auth, and AI pipeline states |
| HTTP client | Axios | `client/src/utils/api.js` | Base URL injection, Bearer token injection, refresh-token queue |
| Backend runtime | Node.js + Express 5 | `server/src/app.js`, `server/server.js` | API lifecycle, middleware stack, route mounting |
| Database | MongoDB + Mongoose 9 | `server/src/models/` | Users, branches, semesters, subjects, papers, syllabi |
| Validation | Zod + Mongoose validators | `server/src/validators/`, models | Request payload validation and schema-level integrity |
| Auth | JWT + bcryptjs + cookies | `server/src/services/auth.service.js`, `middlewares/auth.middleware.js` | Access token auth and refresh-token workflows |
| File upload | Multer | `server/src/middlewares/upload.middleware.js`, `routes/ai.routes.js` | Temporary disk staging and MIME/size validation |
| Cloud storage | Supabase Storage | `server/src/services/supabase.service.js`, `scripts/bulkUploadPapers.js` | Public PDF storage and deletion for papers/syllabi |
| Legacy storage helper | Cloudinary SDK | `server/src/services/cloudinary.service.js` | Alternate/legacy PDF upload and deletion helper |
| AI model | Google Gemini | `server/src/config/gemini.js`, `services/ai.service.js` | Structured chapter-wise blueprint analysis |
| PDF parsing | pdf-parse v2 | `server/src/services/ai.service.js` | Text extraction from uploaded syllabus and stored paper PDFs |
| PDF generation | pdfkit | `server/src/controllers/ai.controller.js`, `services/ai.service.js` | Streamed vector PDF layout compilation |
| Security/performance | Helmet, CORS, compression, rate-limit, morgan | `server/src/app.js` | Headers, origin control, gzip, rate limits, logging |

## 🗺️ Technical Architecture Breakdown:

### Detailed analysis of `server/src/services/ai.service.js` (including its text token extraction via pdf-parse, high-speed JSON schema mapping restrictions, and vector pdfkit streams layout generation flow).

`server/src/services/ai.service.js` is the central AI orchestration module. It exports `generateBlueprintData()` for data extraction and Gemini analysis, plus `compileBlueprintPdf()` for PDF rendering.

The text extraction helper, `extractTextFromBuffer(pdfBuffer, label)`, uses the pdf-parse v2 `PDFParse` class. It constructs a parser with `{ data: pdfBuffer }`, loads the document, calls `getText()`, trims the returned text, rejects empty extraction output, and always destroys parser resources in a `finally` block. That explicit cleanup is important because the AI endpoint may parse one uploaded syllabus plus many archived papers in the same request.

The first AI pipeline stage validates the uploaded syllabus path, reads it from local disk, and extracts real text. If pdf-parse returns no text, the service throws a 422-style `ApiError.unprocessable` asking for a valid non-scanned PDF. This is a text-based syllabus requirement, not a best-effort OCR workflow.

The second stage queries `Paper` documents by subject code or subject name using case-insensitive regular expressions. Every matching paper must expose `fileUrl`. The service downloads paper PDFs with native Node `fetch`, converts each response into a `Buffer`, then runs pdf-parse extraction in parallel with `Promise.allSettled`. Successful parses feed the AI context; failed papers are logged and tolerated only if at least one paper is readable.

The token payload is compacted before model submission. `compactText()` collapses repeated spaces, removes trailing whitespace, and reduces blank-line blocks. Both syllabus and paper contexts are capped at `MAX_CTX = 60000` characters to bound prompt size, reduce latency, and avoid runaway model payloads.

The Gemini prompt is schema-restrictive by design. It asks the model to return only JSON, with one root `chapters` array. Each chapter is expected to contain a title and a list of questions with `id`, `text`, `marks`, and `frequency`. The generation call also sets `generationConfig.responseMimeType = 'application/json'`, making the model response faster to parse and less likely to include prose wrappers. The service still strips accidental code fences defensively, parses JSON, and rejects empty or malformed chapter arrays.

`compileBlueprintPdf(doc, data, subjectInfo)` receives a `PDFDocument` instance from the controller, so the controller owns the HTTP stream while the service owns layout. The pdfkit output is vector-driven: rectangles, lines, text blocks, accent bars, metadata bands, and footer rules are drawn directly into the PDF stream. The layout starts with a dark "Ultimate GTU Exam Master Prompt" overlay box, then adds the GTU document title, subject metadata, and chapter-wise question sections. `ensureSpace()` adds pages when content approaches the bottom boundary, and `drawFooter()` stamps the final page with a gold rule and classification copy.

### Detailed mapping of our routing layer engines, schema document templates, and backend environment configuration variables.

The backend route tree is mounted in `server/src/app.js` under `API.PREFIX`, which is `/api/v1` from `server/src/utils/constants.js`. `server/src/routes/index.js` registers the route modules:

| API Segment | Route Module | Core Purpose |
| --- | --- | --- |
| `/api/v1/health` | `routes/index.js` | Liveness/readiness status with uptime and timestamp |
| `/api/v1/auth` | `auth.routes.js` | Register, login, logout, refresh-token, current user |
| `/api/v1/papers` | `paper.routes.js` | Paper search, upload, update, delete |
| `/api/v1/subjects` | `subject.routes.js` | Subject registry CRUD and branch/semester filtering |
| `/api/v1/syllabus` | `syllabus.routes.js` | Syllabus upload, version history, latest lookup |
| `/api/v1/branch` | `branch.routes.js` | Academic branch CRUD |
| `/api/v1/semester` | `semester.routes.js` | Semester CRUD and branch linkage |
| `/api/v1/ai` | `ai.routes.js` | Authenticated AI blueprint PDF generation |

Request processing follows a layered pattern: route module -> authentication/upload/validation middleware -> controller -> service -> Mongoose model or external provider -> `ApiResponse`/`ApiError`. This keeps HTTP concerns in controllers, business rules in services, and persistence rules in models.

Important schema templates:

| Model | File | Key Fields and Constraints |
| --- | --- | --- |
| `User` | `server/src/models/user.model.js` | Name, email, password hash, role, refresh token support |
| `Branch` | `server/src/models/branch.model.js` | Branch name/code, active state |
| `Semester` | `server/src/models/semester.model.js` | Semester number, branch relation |
| `Subject` | `server/src/models/subject.model.js` | Name, unique GTU code, branch ObjectId, semester ObjectId, credits, active state; compound branch-semester index; text index |
| `Paper` | `server/src/models/paper.model.js` | Title, subject string, semester number, branch code, year, exam type, file URL, storage publicId, uploader; branch-semester-year index; weighted text search |
| `Syllabus` | `server/src/models/syllabus.model.js` | Subject ObjectId, academic year, file URL, storage publicId, uploader, version, `isLatest`; partial unique index allowing only one latest syllabus per subject |

Backend environment variables are centralized in `server/src/config/index.js`. Required variables are validated at startup:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | Signs short-lived access tokens |
| `JWT_REFRESH_SECRET` | Yes | Signs refresh tokens |
| `PORT` | No | Server port, defaults to `5000` |
| `NODE_ENV` | No | `development`, `production`, or `test`; controls logging mode helpers |
| `JWT_ACCESS_EXPIRY` | No | Access token lifetime, defaults to `15m` |
| `JWT_REFRESH_EXPIRY` | No | Refresh token lifetime, defaults to `7d` |
| `CLIENT_URL` | No | CORS origin, defaults to Vite dev origin |
| `GEMINI_API_KEY` | AI required | Google Gemini API access for blueprint generation |
| `SUPABASE_URL` | Storage required | Supabase project URL |
| `SUPABASE_ANON_KEY` | Storage required | Supabase public client key used by upload services/scripts |
| `CLOUDINARY_*` | Legacy storage helper | Used by Cloudinary configuration/helper if that path is enabled |

Frontend deployment configuration is intentionally minimal. `client/src/utils/api.js` reads `VITE_API_URL`; if absent, it uses `/api/v1`. For split-origin environments, set `VITE_API_URL` to the deployed backend API origin plus `/api/v1`. For same-origin production behind a proxy, omit it and route `/api/v1` to the Express server.

### Complete operational breakdown of our reusable database bulk ingestion utility script (`server/src/scripts/bulkUploadPapers.js`).

`server/src/scripts/bulkUploadPapers.js` is a CLI utility for batch loading past GTU exam paper PDFs. It is designed to run from the server workspace with:

```bash
node src/scripts/bulkUploadPapers.js
```

The script loads `.env`, initializes DNS resolver preferences, imports the shared server config, creates a Supabase client from `SUPABASE_URL` and `SUPABASE_ANON_KEY`, and targets the public `papers` bucket. It then connects to MongoDB through `config.database.uri`.

Before ingesting documents, the script resolves an uploader identity. It first looks for any admin user, then any user, and finally creates a default "System Admin" user if the database is empty. This guarantees every inserted `Paper` document has an `uploadedBy` reference.

The ingestion source is `server/bulk_papers/`. The script requires that directory to exist, reads its contents, and filters to `.pdf` files. It expects filenames in this pattern:

```text
Subject Name - S2024 [3110014] [Source].pdf
```

The tokenizer regex extracts subject name, season character, year, and subject code. `S` maps to `summer`, `W` maps to `winter`, and `R` maps to `remedial`. Files that do not match the pattern are skipped with a warning.

Duplicate prevention happens before upload. The script checks whether a `Paper` already exists for the same subject code, year, and exam type. If found, the file is skipped to avoid duplicate archive records and duplicate storage objects.

Metadata enrichment uses the `Subject` collection. When a subject code is found, the script populates its branch and semester relations to derive branch code, semester number, and canonical subject title. If the subject code is missing from the database, it falls back to the first available branch code and semester `1`, while preserving the parsed subject name/code in the title.

For storage, `makeStorageKeySafe()` sanitizes filenames by replacing non-alphanumeric path characters with underscores. The script reads the local PDF into a buffer and uploads it to Supabase Storage with `contentType: 'application/pdf'`, cache control, and `upsert: false`. After upload, it obtains the public URL from Supabase and creates a MongoDB `Paper` document with title, subject, semester, branch, year, exam type, file URL, storage path publicId, and uploader reference.

The loop tracks `successCount`, `skipCount`, and `errorCount`. Each file is isolated in its own `try/catch`, so one bad PDF or metadata mismatch does not stop the entire batch. At the end, the utility prints a summary, closes the MongoDB connection, and exits with a success or failure status.

## Current Production Readiness Notes

The final edge-case hardening implemented in this pass includes:

- Student syllabus staging now blocks non-PDF files using MIME and `.pdf` extension checks before state mutation.
- Student syllabus staging now blocks files larger than 5MB before the multipart AI request can start.
- The client API base URL no longer hardcodes an absolute development server address; it uses `VITE_API_URL` or `/api/v1`.

Recommended production deployment shape:

```text
Browser
  -> Vite static frontend
  -> /api/v1 reverse proxy
  -> Express API
  -> MongoDB Atlas
  -> Supabase Storage
  -> Gemini API
```

This keeps cookies, CORS, API paths, and storage URLs predictable while still allowing split-origin local development through environment injection.
