import { describe, it, expect } from 'vitest';
import { parseAIResponse, buildPrompt } from '../src/parser.js';

describe('buildPrompt', () => {
  it('should build a prompt from sentences', () => {
    const sentences = [
      { id: '1', original: 'I go to school yesterday.' },
      { id: '2', original: 'She have a cat.' },
    ];

    const prompt = buildPrompt(sentences);

    expect(prompt).toContain('I go to school yesterday.');
    expect(prompt).toContain('She have a cat.');
  });

  it('should include instructions for JSON output', () => {
    const sentences = [{ id: '1', original: 'Test sentence.' }];

    const prompt = buildPrompt(sentences);

    expect(prompt).toContain('JSON');
  });

  it('should number sentences starting from 1', () => {
    const sentences = [
      { id: 'abc', original: 'First sentence.' },
      { id: 'def', original: 'Second sentence.' },
    ];

    const prompt = buildPrompt(sentences);

    expect(prompt).toContain('1. First sentence.');
    expect(prompt).toContain('2. Second sentence.');
  });
});

describe('parseAIResponse', () => {
  it('should parse a valid JSON response', () => {
    const response = JSON.stringify({
      corrections: [
        { index: 1, perfect: false, revised: 'I went to school yesterday.', note: 'Past tense needed.' },
        { index: 2, perfect: true, revised: '', note: '' },
      ],
      feedback: 'Good effort!',
    });

    const sentences = [
      { id: 'id1', original: 'I go to school yesterday.' },
      { id: 'id2', original: 'She has a cat.' },
    ];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections).toHaveLength(2);
    expect(result.corrections[0]).toEqual({
      id: 'id1',
      perfect: false,
      revised: 'I went to school yesterday.',
      note: 'Past tense needed.',
    });
    expect(result.corrections[1]).toEqual({
      id: 'id2',
      perfect: true,
      revised: '',
      note: '',
    });
    expect(result.feedback).toBe('Good effort!');
  });

  it('should handle JSON wrapped in markdown code blocks', () => {
    const response = '```json\n{"corrections": [{"index": 1, "perfect": true, "revised": "", "note": ""}], "feedback": "Nice!"}\n```';

    const sentences = [{ id: 'id1', original: 'Hello world.' }];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections).toHaveLength(1);
    expect(result.corrections[0].perfect).toBe(true);
  });

  it('should handle missing feedback field', () => {
    const response = JSON.stringify({
      corrections: [{ index: 1, perfect: true, revised: '', note: '' }],
    });

    const sentences = [{ id: 'id1', original: 'Test.' }];

    const result = parseAIResponse(response, sentences);

    expect(result.feedback).toBe('');
  });

  it('should throw on invalid JSON', () => {
    const response = 'This is not JSON';
    const sentences = [{ id: 'id1', original: 'Test.' }];

    expect(() => parseAIResponse(response, sentences)).toThrow();
  });

  it('should map index numbers to sentence IDs correctly', () => {
    const response = JSON.stringify({
      corrections: [
        { index: 1, perfect: true, revised: '', note: '' },
        { index: 2, perfect: false, revised: 'Corrected', note: 'Fix' },
        { index: 3, perfect: true, revised: '', note: '' },
      ],
      feedback: '',
    });

    const sentences = [
      { id: 'aaa', original: 'First.' },
      { id: 'bbb', original: 'Second.' },
      { id: 'ccc', original: 'Third.' },
    ];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections[0].id).toBe('aaa');
    expect(result.corrections[1].id).toBe('bbb');
    expect(result.corrections[2].id).toBe('ccc');
  });
});
