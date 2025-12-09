import { describe, it, expect } from 'vitest';

// Test helper functions from popup.js
function buildPrompt(sentences, level = null, nativeText = null) {
  const numberedSentences = sentences
    .map((s, i) => `${i + 1}. ${s.original}`)
    .join('\n');

  const levelContext = level
    ? `You are an English language teacher helping a ${level}-level student improve their writing.`
    : `You are an English language teacher helping a student improve their writing. The student's level is unknown, so adjust your corrections and explanations to be clear and helpful.`;

  const nativeLanguageContext = nativeText
    ? `\nThe student's native language text for context:\n${nativeText}\n`
    : '';

  return `${levelContext} Review each sentence and provide corrections and explanations${level ? ` appropriate for ${level} level` : ''}.${nativeLanguageContext}
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
  "feedback": "Overall feedback for the student (1-3 sentences). Follow the 'sandwich' pattern."
}

Important:
- Include an entry for EVERY sentence, in the same order as listed above
- For perfect sentences: only include "perfect": true (omit revised and note)
- For corrections: set perfect=false and include both revised text and note
- Keep notes concise and helpful
- Be encouraging in the overall feedback`;
}

function parseAIResponse(response, sentences) {
  let jsonStr = response.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

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

describe('Popup buildPrompt', () => {
  it('should build a prompt with native text context', () => {
    const sentences = [{ id: '1', original: 'Test sentence.' }];
    const nativeText = 'これはテストです。';

    const prompt = buildPrompt(sentences, null, nativeText);

    expect(prompt).toContain('Test sentence.');
    expect(prompt).toContain('これはテストです。');
    expect(prompt).toContain('native language text for context');
  });

  it('should work without native text parameter', () => {
    const sentences = [{ id: '1', original: 'Test sentence.' }];

    const prompt = buildPrompt(sentences, 'B1');

    expect(prompt).toContain('Test sentence.');
    expect(prompt).toContain('B1');
    expect(prompt).not.toContain('native language text for context');
  });

  it('should include level and native text together', () => {
    const sentences = [{ id: '1', original: 'Test.' }];
    const nativeText = '日本語';

    const prompt = buildPrompt(sentences, 'A2', nativeText);

    expect(prompt).toContain('A2');
    expect(prompt).toContain('日本語');
  });

  it('should handle empty native text as null', () => {
    const sentences = [{ id: '1', original: 'Test sentence.' }];

    const prompt = buildPrompt(sentences, null, null);

    expect(prompt).toContain('Test sentence.');
    expect(prompt).not.toContain('native language text for context');
  });
});

describe('Popup parseAIResponse', () => {
  it('should parse JSON response and map to sentence IDs', () => {
    const response = JSON.stringify({
      corrections: [
        { perfect: false, revised: 'Corrected.', note: 'Grammar.' },
      ],
      feedback: 'Good!',
    });

    const sentences = [{ id: 'id-123', original: 'Test.' }];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections[0]).toEqual({
      id: 'id-123',
      perfect: false,
      revised: 'Corrected.',
      note: 'Grammar.',
    });
    expect(result.feedback).toBe('Good!');
  });

  it('should work with markdown code blocks', () => {
    const response = '```json\n{"corrections": [{"perfect": true}], "feedback": "Nice!"}\n```';

    const sentences = [{ id: 'id-456', original: 'Perfect sentence.' }];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections[0].id).toBe('id-456');
    expect(result.corrections[0].perfect).toBe(true);
    expect(result.feedback).toBe('Nice!');
  });

  it('should validate corrections array length matches sentences', () => {
    const response = JSON.stringify({
      corrections: [{ perfect: true }],
      feedback: 'Feedback',
    });

    const sentences = [
      { id: '1', original: 'First.' },
      { id: '2', original: 'Second.' },
    ];

    expect(() => parseAIResponse(response, sentences)).toThrow('does not match sentences length');
  });

  it('should handle missing feedback field', () => {
    const response = JSON.stringify({
      corrections: [{ perfect: true }],
    });

    const sentences = [{ id: 'id-1', original: 'Test.' }];

    const result = parseAIResponse(response, sentences);

    expect(result.feedback).toBe('');
  });
});
