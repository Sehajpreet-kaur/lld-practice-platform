import Groq from "groq-sdk";
import { Evaluator } from "./Evaluator.js";

// The fixed rubric. Deliberately NOT "is this a good design?" -
// each dimension forces the model to anchor its judgment to something
// checkable, and the evidence field forces it to point at the submission
// rather than produce a generic verdict.
const RUBRIC_DIMENSIONS = [
  "Requirement Understanding",
  "Class Responsibilities",
  "Coupling & Cohesion",
  "Encapsulation & Interfaces",
  "Appropriate Abstraction / Patterns",
  "Extensibility to Changing Requirements",
];

function buildPrompt(problem, submission) {
  return `You are evaluating a Low-Level Design (LLD) solution against a fixed rubric.
There is no single correct design - judge whether THIS solution is internally
consistent, well-reasoned, and satisfies the stated requirements.

PROBLEM: ${problem.title}
DESCRIPTION: ${problem.description}
REQUIREMENTS:
${problem.requirements.map((r) => `- ${r}`).join("\n")}

LEARNER SUBMISSION:
"""
${submission.content}
"""

Score each of the following dimensions from 0-5. For every dimension you MUST:
- cite specific evidence from the submission (quote or paraphrase a concrete part of it)
- give one concrete, actionable suggestion for improvement

Dimensions: ${RUBRIC_DIMENSIONS.join(", ")}

Respond with ONLY valid JSON, no markdown fences, no preamble, in this exact shape:
{
  "criteria": [
    { "name": "string", "score": 0-5, "evidence": "string", "suggestion": "string" }
  ],
  "overallSummary": "2-3 sentence summary of the design's main strengths and weaknesses",
  "confidence": 0.0-1.0
}`;
}

export class LLMEvaluator extends Evaluator {
  constructor({ apiKey, model } = {}) {
    super();
    this.client = new Groq({ apiKey: apiKey || process.env.GROQ_API_KEY });
    this.model = model || process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  }

  get type() {
    return "llm";
  }

  async evaluate({ problem, submission }) {
    const prompt = buildPrompt(problem, submission);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("LLM returned an empty response");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("LLM response was not valid JSON");
    }

    if (!Array.isArray(parsed.criteria) || parsed.criteria.length === 0) {
      throw new Error("LLM response missing criteria array");
    }

    // Defensive normalization - never trust the model to perfectly respect bounds.
    parsed.criteria = parsed.criteria.map((c) => ({
      name: String(c.name),
      score: Math.max(0, Math.min(5, Number(c.score) || 0)),
      evidence: String(c.evidence || "").slice(0, 1000),
      suggestion: String(c.suggestion || "").slice(0, 500),
    }));
    parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7));
    parsed.overallSummary = String(parsed.overallSummary || "").slice(0, 1000);

    return parsed;
  }
}
