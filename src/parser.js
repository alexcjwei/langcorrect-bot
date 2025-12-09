/**
 * Build the prompt to send to the AI for corrections
 * @param {Array<{id: string, original: string}>} sentences - Array of sentences to correct
 * @returns {string} The prompt string
 */
export function buildPrompt(sentences) {
  const numberedSentences = sentences
    .map((s, i) => `${i + 1}. ${s.original}`)
    .join('\n');

  return `You are an English language teacher helping a student improve their writing. Review each sentence and provide corrections.

For each sentence:
- If it's correct, mark it as "perfect": true
- If it needs correction, provide the revised sentence and a brief note explaining the fix

Sentences to review:
${numberedSentences}

Respond ONLY with valid JSON in this exact format:
{
  "corrections": [
    {"index": 1, "perfect": true, "revised": "", "note": ""},
    {"index": 2, "perfect": false, "revised": "The corrected sentence here.", "note": "Brief explanation of the fix."}
  ],
  "feedback": "Overall feedback for the student (1-3 sentences). Follow the 'sandwich' pattern."
}

Important:
- Include an entry for EVERY sentence, in order
- For perfect sentences: set perfect=true, revised="", note=""
- For corrections: set perfect=false, provide revised text and explanation
- Keep notes concise and helpful
- Be encouraging in the overall feedback`;
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

  // Map index numbers to sentence IDs
  const corrections = parsed.corrections.map(c => {
    const sentenceIndex = c.index - 1; // Convert 1-based to 0-based
    const sentence = sentences[sentenceIndex];

    if (!sentence) {
      throw new Error(`Invalid correction index: ${c.index}`);
    }

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
