
addEventListener("message", ({ data }) => {
  const { type, payload } = data;

  try {
    let result: any;

    switch (type) {
      case "COMPUTE":
        result = evaluateExpression(payload.expr, payload.context);
        postMessage({ type: "COMPUTE_RESULT", result });
        break;

      case "EVALUATE_RULE":
        result = evaluateRule(payload.condition, payload.context);
        postMessage({ type: "EVALUATE_RULE_RESULT", result });
        break;

      default:
        postMessage({
          type: "ERROR",
          result: null,
          error: "Unknown message type",
        });
    }
  } catch (error: any) {
    postMessage({ type: "ERROR", result: null, error: error.message });
  }
});

function evaluateExpression(expr: string, context: any): any {
  let expression = expr;

  for (const [key, value] of Object.entries(context)) {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    expression = expression.replace(regex, String(value || 0));
  }
  try {
    return Function(`"use strict"; return (${expression})`)();
  } catch {
    return null;
  }
}

function evaluateRule(condition: string, context: any): boolean {
  let expression = condition;

  for (const [key, value] of Object.entries(context)) {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    const val = typeof value === "string" ? `'${value}'` : String(value);
    expression = expression.replace(regex, val);
  }

  try {
    return Boolean(Function(`"use strict"; return (${expression})`)());
  } catch {
    return false;
  }
}
