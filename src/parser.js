/**
 * Build the prompt to send to the AI for corrections
 * @param {Array<{id: string, original: string}>} sentences - Array of sentences to correct
 * @param {string|null} level - The language learner's level (e.g., "A1", "B2") or null if unknown
 * @returns {string} The prompt string
 */
export function buildPrompt(sentences, level = null) {
  const numberedSentences = sentences
    .map((s, i) => `${i + 1}. ${s.original}`)
    .join('\n');

  const levelContext = level
    ? `You are an English language teacher helping a ${level}-level student improve their writing.`
    : `You are an English language teacher helping a student improve their writing. The student's level is unknown, so adjust your corrections and explanations to be clear and helpful.`;

  return `${levelContext} Review each sentence and provide corrections and explanations${level ? ` appropriate for ${level} level` : ''}.

For each sentence:
- If it's correct, mark it as "perfect": true (omit revised and note)
- If it needs correction, provide the revised sentence and a brief note explaining the fix

Sentences to review:
${numberedSentences}

Respond ONLY with valid JSON in this exact format:
{
  "corrections": [
    {"perfect": true},
    {"perfect": false, "revised": "The corrected sentence here.", "note": "Brief explanation of the fix."}
  ],
  "feedback": "Overall feedback for the student (1-3 sentences)."
}

Important:
- Include an entry for EVERY sentence, in the same order as listed above
- For perfect sentences: only include "perfect": true (omit revised and note)
- For corrections: set perfect=false and include both revised text and note 

Tips:
- Focus on meaning first. If the sentence doesn’t make sense, clear that up before worrying about small grammar or spelling issues.
- Correcting every little mistake is like throwing 20 balls at someone at the same time — they catch none. Pick 1–2 patterns to highlight per piece (e.g., articles, verb tense, sentence clarity).
- Ask short questions that guide them: “Do you need *the* here?”; “Is this past or present?”; This builds awareness, not dependency.
- Rules leak, patterns stick: A simple set of example sentences in the explanation often teaches faster than a grammar explanation.
- Real communication matters more than hitting every grammar point.
- Use 'sandwich' pattern for feedback
- Keep notes concise and helpful
- Be encouraging in the overall feedback
`;
}

/**
 * Parse the AI response and map corrections to sentence IDs
 * @param {string} response - The raw AI response string
 * @param {Array<{id: string, original: string}>} sentences - Original sentences for ID mapping
 * @returns {{corrections: Array<{id: string, perfect: boolean, revised: string, note: string}>, feedback: string}}
 */
export function parseAIResponse(response, sentences) {
  // Extract JSON from markdown code blocks if present
  let jsonStr = response.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
  }

  if (!parsed.corrections || !Array.isArray(parsed.corrections)) {
    throw new Error('AI response missing corrections array');
  }

  // Validate array length matches
  if (parsed.corrections.length !== sentences.length) {
    throw new Error(`Corrections array length (${parsed.corrections.length}) does not match sentences length (${sentences.length})`);
  }

  // Map array position to sentence IDs
  const corrections = parsed.corrections.map((c, index) => {
    const sentence = sentences[index];

    return {
      id: sentence.id,
      perfect: c.perfect,
      revised: c.revised || '',
      note: c.note || '',
    };
  });

  return {
    corrections,
    feedback: parsed.feedback || '',
  };
}
