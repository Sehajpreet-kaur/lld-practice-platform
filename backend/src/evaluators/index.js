import { LLMEvaluator } from "./LLMEvaluator.js";
import { RuleBasedEvaluator } from "./RuleBasedEvaluator.js";

// Single place that decides which Evaluator implementation is "live".
// Swapping the default evaluator, or running multiple, means editing
// only this file.
const registry = {
  llm: () => new LLMEvaluator(),
  "rule-based": () => new RuleBasedEvaluator(),
};

export function getEvaluator(type = "llm") {
  const factory = registry[type];
  if (!factory) throw new Error(`Unknown evaluator type: ${type}`);
  return factory();
}
