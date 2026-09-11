# LLD Practice Platform

A small end-to-end platform for practicing Low-Level Design problems and getting structured, rubric-based feedback.

**Practice loop:** Choose problem → Write design → Submit → Get feedback → Review → Try again.

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth
- **AI evaluation:** Groq API (`llama-3.1-8b-instant`), fixed-rubric prompt with structured JSON output
- **Frontend:** React (Vite), React Router
- **Tests:** Jest + Supertest + mongodb-memory-server

## Project structure

```
backend/
  src/
    models/          Problem, User, Attempt, Submission, Evaluation (Mongoose schemas)
    evaluators/       Evaluator interface + LLMEvaluator + RuleBasedEvaluator + registry
    services/         evaluationService.js - owns the async Submitted→Evaluating→Completed/Failed flow
    controllers/      route handlers
    routes/           Express routers
    middleware/       JWT auth
    seed/             seeds 5 LLD problems
  tests/              integration + unit tests
frontend/
  src/
    pages/            Login, ProblemList, ProblemDetail, AttemptWorkspace, History
    api/client.js     thin fetch wrapper
```

## Running it

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm run seed               # loads 5 problems (Parking Lot, Elevator, Vending Machine, Library, Ride-Hailing)
npm run dev                # http://localhost:5000
```

You need a running MongoDB instance (local `mongod`, Docker, or an Atlas connection string) and a free [Groq API key](https://console.groq.com).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173, proxies /api to :5000
```

Register a user in the UI, pick a problem, write a design, and submit.

### 3. Tests

```bash
cd backend
npm test
```

> **Note:** the integration tests use `mongodb-memory-server`, which downloads a MongoDB binary the first time it runs (needs normal internet access — it will **not** run inside a network-restricted sandbox, but works out of the box on a regular dev machine or CI). The evaluator unit tests (`tests/evaluator.test.js`) have no such dependency and always run.

## Design summary

See `DESIGN_NOTE.md` for the product-level write-up and `LLD.md` for the full low-level design — class diagram, every class/interface with fields and method signatures, the submit→evaluate sequence diagram, the `Submission` state machine, design patterns, and the SOLID mapping. In short:

- **Domain model:** `Problem` (catalog) → `Attempt` (one learner session) → `Submission` (the evidence) → `Evaluation` (the feedback). Retrying a problem creates a **new** `Attempt`, so every past submission + feedback pair stays immutable — that's what makes "History" meaningful rather than just overwritten state.
- **Evaluator interface:** all evaluation logic sits behind a single `Evaluator.evaluate()` contract. `LLMEvaluator` (Groq, rubric-based) and `RuleBasedEvaluator` (deterministic heuristic) both implement it. Swapping or adding an evaluator never touches routes, controllers, or the data model.
- **Async evaluation:** the submission is persisted and the HTTP request returns (`202`) *before* the LLM is called. Status moves `Submitted → Evaluating → Completed/Failed`. A failed evaluation is retryable without re-submitting content, and a duplicate submission on an already-submitted attempt is rejected (`409`).

## Limitations (MVP scope)

- Single submission format (free-text design write-up). Code/diagram formats are a natural extension — see "Change Test A" in `DESIGN_NOTE.md`.
- No background job queue — evaluation runs as an in-process async task. Fine at MVP scale; the design note discusses what would change under load.
- No admin UI for authoring problems (they're seeded via script).
- Evaluation confidence score is currently self-reported by the LLM, not independently validated.

## AI usage

See `AI_USAGE.md`.
