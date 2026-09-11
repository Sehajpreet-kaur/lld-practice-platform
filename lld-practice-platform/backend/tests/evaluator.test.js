import { RuleBasedEvaluator } from "../src/evaluators/RuleBasedEvaluator.js";
import { getEvaluator } from "../src/evaluators/index.js";

describe("RuleBasedEvaluator", () => {
  const evaluator = new RuleBasedEvaluator();
  const problem = {
    requirements: ["Support multiple vehicle types", "Compute parking fee based on duration"],
  };

  it("scores a short submission lower than a thorough one", async () => {
    const short = await evaluator.evaluate({ problem, submission: { content: "Just a ParkingLot class." } });
    const long = await evaluator.evaluate({
      problem,
      submission: { content: "Vehicle types are modeled as an enum. ".repeat(30) },
    });

    const shortScore = short.criteria.find((c) => c.name === "Submission Completeness").score;
    const longScore = long.criteria.find((c) => c.name === "Submission Completeness").score;

    expect(longScore).toBeGreaterThan(shortScore);
  });

  it("always returns evidence and a suggestion per criterion", async () => {
    const result = await evaluator.evaluate({ problem, submission: { content: "Vehicle handling design." } });
    for (const c of result.criteria) {
      expect(c.evidence).toBeTruthy();
      expect(c.suggestion).toBeTruthy();
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(5);
    }
  });

  it("reports its type", () => {
    expect(evaluator.type).toBe("rule-based");
  });
});

describe("getEvaluator registry", () => {
  it("returns a working evaluator for a known type", () => {
    const evaluator = getEvaluator("rule-based");
    expect(evaluator.type).toBe("rule-based");
  });

  it("throws for an unknown evaluator type", () => {
    expect(() => getEvaluator("nonexistent")).toThrow(/Unknown evaluator type/);
  });
});
