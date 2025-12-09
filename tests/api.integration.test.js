import { describe, it, expect, beforeAll } from 'vitest';
import { config } from 'dotenv';
import { callAnthropicAPI, callOpenAIAPI } from '../src/api.js';
import { buildPrompt, parseAIResponse } from '../src/parser.js';

// Load environment variables
config();

const testSentences = [
  { id: '1', original: 'I go to school yesterday.' },
  { id: '2', original: 'She have a beautiful cat.' },
  { id: '3', original: 'The weather is very nice today.' },
];

describe('Anthropic API Integration', () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in .env');
    }
  });

  it('should return corrections for sentences with errors', async () => {
    const prompt = buildPrompt(testSentences);
    const response = await callAnthropicAPI(apiKey, prompt);

    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');

    const result = parseAIResponse(response, testSentences);

    expect(result.corrections).toHaveLength(3);

    // First sentence has a tense error - should be corrected
    const firstCorrection = result.corrections[0];
    expect(firstCorrection.id).toBe('1');
    expect(firstCorrection.perfect).toBe(false);
    expect(firstCorrection.revised.toLowerCase()).toContain('went');

    // Second sentence has a verb agreement error - should be corrected
    const secondCorrection = result.corrections[1];
    expect(secondCorrection.id).toBe('2');
    expect(secondCorrection.perfect).toBe(false);
    expect(secondCorrection.revised.toLowerCase()).toContain('has');

    // Third sentence is correct - should be marked as perfect
    const thirdCorrection = result.corrections[2];
    expect(thirdCorrection.id).toBe('3');
    expect(thirdCorrection.perfect).toBe(true);
  });

  it('should return overall feedback', async () => {
    const prompt = buildPrompt(testSentences);
    const response = await callAnthropicAPI(apiKey, prompt);
    const result = parseAIResponse(response, testSentences);

    expect(typeof result.feedback).toBe('string');
  });
});

describe('OpenAI API Integration', () => {
  const apiKey = process.env.OPENAI_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set in .env');
    }
  });

  it('should return corrections for sentences with errors', async () => {
    const prompt = buildPrompt(testSentences);
    const response = await callOpenAIAPI(apiKey, prompt);

    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');

    const result = parseAIResponse(response, testSentences);

    expect(result.corrections).toHaveLength(3);

    // First sentence has a tense error - should be corrected
    const firstCorrection = result.corrections[0];
    expect(firstCorrection.id).toBe('1');
    expect(firstCorrection.perfect).toBe(false);
    expect(firstCorrection.revised.toLowerCase()).toContain('went');

    // Second sentence has a verb agreement error - should be corrected
    const secondCorrection = result.corrections[1];
    expect(secondCorrection.id).toBe('2');
    expect(secondCorrection.perfect).toBe(false);
    expect(secondCorrection.revised.toLowerCase()).toContain('has');

    // Third sentence is correct - should be marked as perfect
    const thirdCorrection = result.corrections[2];
    expect(thirdCorrection.id).toBe('3');
    expect(thirdCorrection.perfect).toBe(true);
  });

  it('should return overall feedback', async () => {
    const prompt = buildPrompt(testSentences);
    const response = await callOpenAIAPI(apiKey, prompt);
    const result = parseAIResponse(response, testSentences);

    expect(typeof result.feedback).toBe('string');
  });
});
