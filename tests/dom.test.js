import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { extractSentences, applyCorrections, extractLevel } from '../src/dom.js';

const fixtureHtml = readFileSync('./tests/fixtures/make_corrections.example.html', 'utf-8');

describe('DOM extraction', () => {
  let document;

  beforeEach(() => {
    const dom = new JSDOM(fixtureHtml);
    document = dom.window.document;
  });

  describe('extractSentences', () => {
    it('should extract all sentences from correction cards', () => {
      const sentences = extractSentences(document);

      expect(sentences).toHaveLength(8);
    });

    it('should extract sentence ID and original text', () => {
      const sentences = extractSentences(document);

      expect(sentences[0]).toEqual({
        id: '1',
        original: "Sample Title",
      });
    });

    it('should handle HTML entities in original sentences', () => {
      const sentences = extractSentences(document);

      // The second sentence has an apostrophe encoded as &#39;
      expect(sentences[1].original).toContain("isn't");
    });

    it('should extract all 8 sentences with correct IDs', () => {
      const sentences = extractSentences(document);

      const ids = sentences.map(s => s.id);
      expect(ids).toEqual([
        '1', '2', '3', '4',
        '5', '6', '7', '8'
      ]);
    });
  });

  describe('extractLevel', () => {
    it('should extract the language level from the page', () => {
      const level = extractLevel(document);

      expect(level).toBe('A1');
    });

    it('should return null when level element is not found', () => {
      const dom = new JSDOM('<html><body><div>No level here</div></body></html>');
      const docWithoutLevel = dom.window.document;

      const level = extractLevel(docWithoutLevel);

      expect(level).toBe(null);
    });

    it('should trim whitespace from the level text', () => {
      const dom = new JSDOM(`
        <html><body>
          <span data-bs-title="Language level">
            <i class="fa-solid fa-graduation-cap"></i>

            B2

          </span>
        </body></html>
      `);
      const docWithWhitespace = dom.window.document;

      const level = extractLevel(docWithWhitespace);

      expect(level).toBe('B2');
    });
  });
});

describe('DOM manipulation', () => {
  let document;

  beforeEach(() => {
    const dom = new JSDOM(fixtureHtml);
    document = dom.window.document;
  });

  describe('applyCorrections', () => {
    it('should fill in correction textarea for a corrected sentence', () => {
      const corrections = [
        {
          id: '2',
          perfect: false,
          revised: 'This is not a sample sentence.',
          note: 'More natural phrasing.',
        },
      ];

      applyCorrections(document, corrections);

      const textarea = document.getElementById('js-correction-row-2');
      expect(textarea.value).toBe('This is not a sample sentence.');
    });

    it('should fill in feedback note textarea', () => {
      const corrections = [
        {
          id: '2',
          perfect: false,
          revised: 'This is not a sample sentence.',
          note: 'More natural phrasing.',
        },
      ];

      applyCorrections(document, corrections);

      const noteTextarea = document.getElementById('js-correction-note-2');
      expect(noteTextarea.value).toBe('More natural phrasing.');
    });

    it('should click the edit button for corrected sentences', () => {
      const corrections = [
        {
          id: '2',
          perfect: false,
          revised: 'Changed text',
          note: 'Some note',
        },
      ];

      applyCorrections(document, corrections);

      // After clicking edit, the correction box should be visible (d-none removed)
      const correctionBox = document.querySelector('[data-correction-box="2"]');
      expect(correctionBox.classList.contains('d-none')).toBe(false);
    });

    it('should click the perfect button for perfect sentences', () => {
      const corrections = [
        {
          id: '4',
          perfect: true,
          revised: '',
          note: '',
        },
      ];

      applyCorrections(document, corrections);

      // The card should have data-action="perfect" after clicking
      const card = document.querySelector('[data-sentence-id="4"]');
      expect(card.getAttribute('data-action')).toBe('perfect');
    });

    it('should apply multiple corrections', () => {
      const corrections = [
        { id: '1', perfect: true, revised: '', note: '' },
        { id: '2', perfect: false, revised: 'Corrected text', note: 'Note 1' },
        { id: '3', perfect: true, revised: '', note: '' },
      ];

      applyCorrections(document, corrections);

      expect(document.querySelector('[data-sentence-id="1"]').getAttribute('data-action')).toBe('perfect');
      expect(document.getElementById('js-correction-row-2').value).toBe('Corrected text');
      expect(document.querySelector('[data-sentence-id="3"]').getAttribute('data-action')).toBe('perfect');
    });

    it('should set overall feedback', () => {
      const corrections = [];
      const overallFeedback = 'Great writing! Keep up the good work.';

      applyCorrections(document, corrections, overallFeedback);

      const feedbackTextarea = document.getElementById('overall-feedback');
      expect(feedbackTextarea.value).toBe('Great writing! Keep up the good work.');
    });
  });
});
