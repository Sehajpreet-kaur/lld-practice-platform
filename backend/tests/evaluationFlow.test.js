import request from "supertest";
import { createApp } from "../src/app.js";
import Problem from "../src/models/Problem.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";

process.env.JWT_SECRET = "test-secret";

const app = createApp();

async function registerUser() {
  const res = await request(app).post("/api/auth/register").send({
    name: "Test Learner",
    email: `learner_${Date.now()}_${Math.random()}@test.com`,
    password: "password123",
  });
  return res.body.token;
}

async function seedProblem() {
  return Problem.create({
    title: "Design a Parking Lot",
    slug: `parking-lot-${Date.now()}-${Math.random()}`,
    description: "Design a multi-floor parking lot.",
    requirements: ["Support multiple vehicle types", "Assign nearest available spot"],
  });
}

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

// Polls until the submission leaves the "Evaluating" state or times out.
async function waitForCompletion(token, submissionId, maxTries = 20) {
  for (let i = 0; i < maxTries; i++) {
    const res = await request(app)
      .get(`/api/submissions/${submissionId}`)
      .set("Authorization", `Bearer ${token}`);
    if (res.body.status !== "Evaluating" && res.body.status !== "Submitted") return res.body;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Submission never left the pending state");
}

describe("Full practice loop: choose -> attempt -> submit -> feedback -> history", () => {
  it("takes a learner from starting an attempt to receiving structured feedback", async () => {
    const token = await registerUser();
    const problem = await seedProblem();

    // 1. Start an attempt
    const attemptRes = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ problemId: problem._id });
    expect(attemptRes.status).toBe(201);
    expect(attemptRes.body.status).toBe("InProgress");

    // 2. Submit a solution, using the rule-based evaluator so the test needs no network access
    const submitRes = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        attemptId: attemptRes.body._id,
        content: "ParkingLot has Floors, each Floor has Spots typed by VehicleType. ".repeat(10),
        evaluatorType: "rule-based",
      });
    expect(submitRes.status).toBe(202);
    expect(submitRes.body.submission.status).toBe("Submitted");

    // 3. Feedback becomes available (poll, since evaluation is async)
    const finalSubmission = await waitForCompletion(token, submitRes.body.submission._id);
    expect(finalSubmission.status).toBe("Completed");
    expect(finalSubmission.evaluation).toBeTruthy();
    expect(finalSubmission.evaluation.criteria.length).toBeGreaterThan(0);
    expect(finalSubmission.evaluation.overallSummary).toBeTruthy();

    // 4. History shows the completed attempt with its feedback attached
    const historyRes = await request(app)
      .get(`/api/attempts/problem/${problem._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.length).toBe(1);
    expect(historyRes.body[0].status).toBe("Submitted");
    expect(historyRes.body[0].submission.status).toBe("Completed");
  });

  it("supports retrying a problem as a second, independent attempt", async () => {
    const token = await registerUser();
    const problem = await seedProblem();

    for (let i = 0; i < 2; i++) {
      const attemptRes = await request(app)
        .post("/api/attempts")
        .set("Authorization", `Bearer ${token}`)
        .send({ problemId: problem._id });

      await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          attemptId: attemptRes.body._id,
          content: `Attempt number ${i}, describing the design in reasonable depth. `.repeat(8),
          evaluatorType: "rule-based",
        });
    }

    const historyRes = await request(app)
      .get(`/api/attempts/problem/${problem._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(historyRes.body.length).toBe(2);
  });
});

describe("Edge cases and failure handling", () => {
  it("rejects an empty submission", async () => {
    const token = await registerUser();
    const problem = await seedProblem();
    const attemptRes = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ problemId: problem._id });

    const res = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({ attemptId: attemptRes.body._id, content: "   " });

    expect(res.status).toBe(400);
  });

  it("rejects a second submission on an already-submitted attempt", async () => {
    const token = await registerUser();
    const problem = await seedProblem();
    const attemptRes = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ problemId: problem._id });

    await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({ attemptId: attemptRes.body._id, content: "First submission text here.", evaluatorType: "rule-based" });

    const secondRes = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({ attemptId: attemptRes.body._id, content: "Second submission text.", evaluatorType: "rule-based" });

    expect(secondRes.status).toBe(409);
  });

  it("marks a submission Failed when the evaluator throws, without losing the submission", async () => {
    const token = await registerUser();
    const problem = await seedProblem();
    const attemptRes = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ problemId: problem._id });

    // "llm" type with no GROQ_API_KEY set in test env will fail the network call -
    // this proves failure is captured on the Submission, not thrown to the client.
    const submitRes = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({ attemptId: attemptRes.body._id, content: "Some design content.", evaluatorType: "llm" });

    expect(submitRes.status).toBe(202); // request succeeds even though evaluation will fail

    const finalSubmission = await waitForCompletion(token, submitRes.body.submission._id);
    expect(finalSubmission.status).toBe("Failed");
    expect(finalSubmission.failureReason).toBeTruthy();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/attempts");
    expect(res.status).toBe(401);
  });
});
