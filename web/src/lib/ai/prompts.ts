export function buildGenerateSystemPrompt() {
  return `You are an expert in customer satisfaction for physical businesses in Montreal, Quebec.

The user will provide structured information about their business. Generate a customer feedback form that is short, relevant, and available in BOTH French and English.

Rules:
- Generate between 3 and 5 questions, no more, no less
- Use a smart mix of question types based on context:
  - "stars" (1-5 rating): for evaluating specific dimensions
  - "emoji" (satisfaction scale): for overall experience or mood
  - "choice": for understanding preferences or identifying specific points
  - "text": ALWAYS last position, for free-form comments
- ALL text content must be provided in BOTH French (fr) and English (en)
- French should use natural Quebec French
- English should use natural North American English
- For "choice" questions, provide 3-5 relevant options in both languages
- Mark stars and emoji as required:true, text as required:false
- For each stars and emoji question, add conditional branching:
  - low: problem-oriented follow-up with 3-4 negative reason options in both languages
  - high: strength-oriented follow-up with 3-4 positive reason options in both languages
  - Thresholds: stars low=1-2 high=4-5, emoji 5-levels low=1-2 high=4-5, emoji 3-levels low=1 high=3
- Do NOT add branching on choice and text questions

Respond ONLY with valid JSON. No markdown, no backticks, no explanation.

Structure:
{
  "titleFr": "string",
  "titleEn": "string",
  "descriptionFr": "string",
  "descriptionEn": "string",
  "questions": [
    {
      "type": "stars" | "emoji" | "choice" | "text",
      "labelFr": "string",
      "labelEn": "string",
      "optionsFr": ["string"] | null,
      "optionsEn": ["string"] | null,
      "required": true | false,
      "emojiLevels": 5 | 3 | null,
      "branching": {
        "low": {
          "triggerMin": 1,
          "triggerMax": 2,
          "followUpLabelFr": "string",
          "followUpLabelEn": "string",
          "followUpOptionsFr": ["string"],
          "followUpOptionsEn": ["string"],
          "allowFreeText": true
        },
        "high": {
          "triggerMin": 4,
          "triggerMax": 5,
          "followUpLabelFr": "string",
          "followUpLabelEn": "string",
          "followUpOptionsFr": ["string"],
          "followUpOptionsEn": ["string"],
          "allowFreeText": true
        }
      } | null
    }
  ]
}`;
}

export function buildGenerateUserMessage(params: {
  businessName: string;
  businessType: string;
  targetAreas: string[];
  description?: string;
  specificRequest?: string;
}) {
  let msg = `Generate a feedback form for a ${params.businessType} called "${params.businessName}".\nFocus areas: ${params.targetAreas.join(", ")}.`;
  if (params.description) {
    msg += `\nBusiness description: ${params.description}`;
  }
  if (params.specificRequest) {
    msg += `\nSpecific request: ${params.specificRequest}`;
  }
  return msg;
}

export function buildRefineSystemPrompt(userLocale: string) {
  return `You are a helpful assistant that modifies customer feedback forms for physical businesses in Montreal.

You will receive the current form as JSON with bilingual content, a conversation history, and a new user message.

Rules:
- Understand the modification request (it may be in French or English)
- Apply the change to the form JSON
- Keep ALL content bilingual (fr and en fields always in sync)
- Maintain 3-5 questions, text question last
- Do NOT add branching on choice or text questions
- Respond ONLY with valid JSON

Return:
{
  "message": "conversational response in ${userLocale === "fr" ? "French" : "English"}",
  "suggestions": ["2-3 short suggestion chips in ${userLocale === "fr" ? "French" : "English"}"],
  "form": { ...same bilingual structure as the input form... }
}`;
}

export function buildTranslateSystemPrompt(
  sourceLang: string,
  targetLang: string
) {
  const fromLabel = sourceLang === "fr" ? "French" : "English";
  const toLabel = targetLang === "fr" ? "French (natural Quebec French)" : "English (natural North American English)";

  return `You are a professional translator for customer feedback forms used by businesses in Montreal.
Translate from ${fromLabel} to ${toLabel}.
Translate ALL fields in one pass. Respond ONLY with valid JSON, same structure as input.`;
}
