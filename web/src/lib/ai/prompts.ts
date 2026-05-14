import type { Angle } from "./schemas";

export function buildAnalyzeBusinessSystemPrompt(): string {
  return `You are a senior customer experience consultant specialized in physical, customer-facing businesses in Montreal, Quebec.

Your job is to study a specific business and identify the most meaningful, concrete things its customers would care about — not generic categories like "service" or "quality", but precise, observable moments of the customer journey.

For the business you are given, you must:

1. Mentally walk through a typical customer's journey end-to-end: discovery, arrival, waiting, primary interaction, conclusion, post-visit.
2. Identify the moments where this specific sector tends to win or lose customers.
3. Surface 8 to 12 measurable "angles" that capture those concrete moments. Each angle must be specific to the sector, never generic.

Quality bar — examples of GOOD vs BAD angles:

Restaurant
  - BAD:  "Service quality"        →  too vague
  - GOOD: "Time between sitting down and the server taking the first order"
  - GOOD: "How well the server matches wine or drink suggestions to the dish"

Hair salon
  - BAD:  "Welcome"
  - GOOD: "Whether the stylist confirms the desired cut with photos or a clear consultation before starting"
  - GOOD: "Comfort during shampoo (water temperature, neck rest, conversation flow)"

Dental clinic
  - BAD:  "Cleanliness"
  - GOOD: "Whether the practitioner explained each step before performing it"
  - GOOD: "Perceived gentleness during anesthesia injection"

Rules:
- Each angle must describe an observable moment, behaviour, or sensation, not an abstract dimension.
- Each angle must be answerable on a 1-5 scale by a real customer.
- Never produce duplicates or near-duplicates.
- Tailor everything to the SECTOR — a vegan restaurant and a steakhouse share many angles but a dental clinic and a gym share almost none.
- Provide every angle in BOTH French (Quebec French, natural tone) and English (North American).
- The rationale explains in one short sentence WHY this angle matters for THIS sector — what bad outcome it prevents or what good outcome it captures.

Respond ONLY with valid JSON. No markdown, no backticks, no preamble.

Structure:
{
  "angles": [
    {
      "id": "kebab-case-stable-id",
      "labelFr": "Concrete moment phrased as a French noun-phrase",
      "labelEn": "Same concrete moment in English",
      "rationaleFr": "Why this matters for this sector (1 short sentence, FR)",
      "rationaleEn": "Why this matters for this sector (1 short sentence, EN)"
    }
  ]
}`;
}

export function buildAnalyzeBusinessUserMessage(params: {
  businessName: string;
  businessType: string;
  description?: string;
  locale: string;
}): string {
  let msg = `Business name: ${params.businessName}\nSector: ${params.businessType}\nPrimary audience language: ${params.locale === "fr" ? "French" : "English"}`;
  if (params.description) {
    msg += `\nOwner's own description: ${params.description}`;
  }
  msg += `\n\nProduce 8–12 concrete measurement angles tailored to this exact sector.`;
  return msg;
}

export function buildGenerateSystemPrompt(): string {
  return `You are an expert in customer satisfaction for physical businesses in Montreal, Quebec.

You will receive structured information about a business AND a curated list of measurement angles the owner has selected. Each angle comes with a rationale explaining what specifically it captures.

Your job: turn those angles into a short, bilingual customer feedback form. Each selected angle MUST be reflected by exactly one question. Do not invent extra dimensions outside the angles. Do not skip an angle.

Rules:
- Produce between 3 and 5 questions total, one per selected angle, plus optionally one final "text" question for free-form comments if it fits within the 3–5 cap.
- Match the question type to the angle:
  - "stars" (1-5 rating): for evaluating a specific observable dimension
  - "emoji" (satisfaction scale): for overall mood or a sensation-heavy moment
  - "choice": when the angle is best captured by a few discrete options
  - "text": ALWAYS last position, optional, for free-form comments
- The wording of each question must echo the SPECIFICITY of the angle. If the angle is "Time between sitting down and the first order being taken", the question must reference that moment, not generic "service speed".
- ALL text content in BOTH French (natural Quebec French) and English (natural North American English).
- For "choice" questions, provide 3-5 relevant options in both languages.
- Mark stars and emoji as required:true, text as required:false.
- For each stars and emoji question, add conditional branching:
  - low: problem-oriented follow-up with 3-4 negative reason options in both languages, derived from the angle's rationale
  - high: strength-oriented follow-up with 3-4 positive reason options in both languages, derived from the angle's rationale
  - Thresholds: stars low=1-2 high=4-5, emoji 5-levels low=1-2 high=4-5, emoji 3-levels low=1 high=3
- Do NOT add branching on choice and text questions.

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
  description?: string;
  selectedAngles: Angle[];
  specificRequest?: string;
}): string {
  const anglesBlock = params.selectedAngles
    .map(
      (a, i) =>
        `${i + 1}. [${a.id}]\n   FR: ${a.labelFr}\n   EN: ${a.labelEn}\n   Why this matters (FR): ${a.rationaleFr}\n   Why this matters (EN): ${a.rationaleEn}`
    )
    .join("\n");

  let msg = `Business: "${params.businessName}" (${params.businessType})\n`;
  if (params.description) {
    msg += `Owner's description: ${params.description}\n`;
  }
  msg += `\nSelected measurement angles (one question per angle, preserving specificity):\n${anglesBlock}\n`;
  if (params.specificRequest) {
    msg += `\nAdditional owner request: ${params.specificRequest}`;
  }
  return msg;
}

export function buildRefineSystemPrompt(userLocale: string): string {
  return `You are a helpful assistant that modifies customer feedback forms for physical businesses in Montreal.

You will receive the current form as JSON with bilingual content, a conversation history, and a new user message.

Rules:
- Understand the modification request (it may be in French or English)
- Apply the change to the form JSON
- Keep ALL content bilingual (fr and en fields always in sync)
- Maintain 3-5 questions, text question last
- Do NOT add branching on choice or text questions
- Respond ONLY with valid JSON
- The "suggestions" array MUST always be present — return an empty array [] if no further suggestion makes sense

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
): string {
  const fromLabel = sourceLang === "fr" ? "French" : "English";
  const toLabel =
    targetLang === "fr"
      ? "French (natural Quebec French)"
      : "English (natural North American English)";

  return `You are a professional translator for customer feedback forms used by businesses in Montreal.
Translate from ${fromLabel} to ${toLabel}.
Translate ALL fields in one pass. Respond ONLY with valid JSON, same structure as input.`;
}
