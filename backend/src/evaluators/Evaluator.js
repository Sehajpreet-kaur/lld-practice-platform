/**
 * Evaluator is the contract every evaluation strategy must satisfy.
 * This is THE extensibility seam of the whole product (Change Test B):
 * evaluationService never knows or cares whether it's talking to an LLM,
 * a rule engine, or a human reviewer's queue - it only calls evaluate().
 *
 * Adding a new evaluator later = implement this class + register it.
 * Nothing in routes/controllers/models has to change.
 */
export class Evaluator {
  /**
   * @param {{ problem: import("../models/Problem.js").default, submission: import("../models/Submission.js").default }} params
   * @returns {Promise<{ criteria: Array<{name:string, score:number, evidence:string, suggestion:string}>, overallSummary: string, confidence: number }>}
   */
  // eslint-disable-next-line no-unused-vars
  async evaluate({ problem, submission }) {
    throw new Error("Evaluator.evaluate() must be implemented by a subclass");
  }

  /** Machine-readable name stored on the Evaluation document. */
  get type() {
    throw new Error("Evaluator.type must be implemented by a subclass");
  }
}
