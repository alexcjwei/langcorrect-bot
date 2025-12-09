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

  it('should include level in prompt when provided', () => {
    const sentences = [{ id: '1', original: 'Test sentence.' }];

    const prompt = buildPrompt(sentences, 'A1');

    expect(prompt).toContain('A1');
  });

  it('should mention unknown level when level is null', () => {
    const sentences = [{ id: '1', original: 'Test sentence.' }];

    const prompt = buildPrompt(sentences, null);

    expect(prompt).toContain('level is unknown');
  });

  it('should work without level parameter (backward compatibility)', () => {
    const sentences = [{ id: '1', original: 'Test sentence.' }];

    const prompt = buildPrompt(sentences);

    expect(prompt).toContain('Test sentence.');
    expect(prompt).toContain('level is unknown');
  });

  it('should mark title sentences with [TITLE] prefix', () => {
    const sentences = [
      { id: '1', original: 'Post Title', isTitle: true },
      { id: '2', original: 'Regular sentence.' },
    ];

    const prompt = buildPrompt(sentences);

    expect(prompt).toContain('[TITLE] Post Title');
    expect(prompt).toContain('2. Regular sentence.');
  });

  it('should not mark non-title sentences with [TITLE] prefix', () => {
    const sentences = [
      { id: '1', original: 'Regular sentence.' },
      { id: '2', original: 'Another sentence.' },
    ];

    const prompt = buildPrompt(sentences);

    expect(prompt).toContain('1. Regular sentence.');
    expect(prompt).toContain('2. Another sentence.');
  });

  it('should include instructions for handling titles specially', () => {
    const sentences = [{ id: '1', original: 'Post Title', isTitle: true }];

    const prompt = buildPrompt(sentences);

    expect(prompt).toContain('title');
  });
});

describe('parseAIResponse', () => {
  it('should parse a valid JSON response without index field', () => {
    const response = JSON.stringify({
      corrections: [
        { perfect: false, revised: 'I went to school yesterday.', note: 'Past tense needed.' },
        { perfect: true },
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
    const response = '```json\n{"corrections": [{"perfect": true}], "feedback": "Nice!"}\n```';

    const sentences = [{ id: 'id1', original: 'Hello world.' }];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections).toHaveLength(1);
    expect(result.corrections[0].perfect).toBe(true);
  });

  it('should handle missing feedback field', () => {
    const response = JSON.stringify({
      corrections: [{ perfect: true }],
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

  it('should map array position to sentence IDs correctly', () => {
    const response = JSON.stringify({
      corrections: [
        { perfect: true },
        { perfect: false, revised: 'Corrected', note: 'Fix' },
        { perfect: true },
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

  it('should handle optional revised and note fields when perfect is true', () => {
    const response = JSON.stringify({
      corrections: [
        { perfect: true },
        { perfect: true },
      ],
      feedback: 'Great!',
    });

    const sentences = [
      { id: 'id1', original: 'Perfect sentence.' },
      { id: 'id2', original: 'Another perfect one.' },
    ];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections[0]).toEqual({
      id: 'id1',
      perfect: true,
      revised: '',
      note: '',
    });
    expect(result.corrections[1]).toEqual({
      id: 'id2',
      perfect: true,
      revised: '',
      note: '',
    });
  });

  it('should require revised and note when perfect is false', () => {
    const response = JSON.stringify({
      corrections: [
        { perfect: false, revised: 'Fixed sentence.', note: 'Grammar fix.' },
      ],
      feedback: 'Good work!',
    });

    const sentences = [{ id: 'id1', original: 'Broken sentence.' }];

    const result = parseAIResponse(response, sentences);

    expect(result.corrections[0]).toEqual({
      id: 'id1',
      perfect: false,
      revised: 'Fixed sentence.',
      note: 'Grammar fix.',
    });
  });

  it('should throw error when corrections array length does not match sentences', () => {
    const response = JSON.stringify({
      corrections: [
        { perfect: true },
      ],
      feedback: 'Feedback',
    });

    const sentences = [
      { id: 'id1', original: 'First.' },
      { id: 'id2', original: 'Second.' },
    ];

    expect(() => parseAIResponse(response, sentences)).toThrow();
  });
});
