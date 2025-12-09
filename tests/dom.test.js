import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { extractSentences, applyCorrections } from '../src/dom.js';

const fixtureHtml = readFileSync('./docs/make_corrections-example.html', 'utf-8');

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
        id: '1218881',
        original: "What My Son's Results Reminded Me Of",
      });
    });

    it('should handle HTML entities in original sentences', () => {
      const sentences = extractSentences(document);

      // The second sentence has an apostrophe encoded as &#39;
      expect(sentences[1].original).toContain("didn't");
    });

    it('should extract all 8 sentences with correct IDs', () => {
      const sentences = extractSentences(document);

      const ids = sentences.map(s => s.id);
      expect(ids).toEqual([
        '1218881', '1218882', '1218883', '1218884',
        '1218885', '1218886', '1218887', '1218888'
      ]);
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
          id: '1218882',
          perfect: false,
          revised: 'My son recently found out that he failed the October entrance exam.',
          note: 'More natural phrasing.',
        },
      ];

      applyCorrections(document, corrections);

      const textarea = document.getElementById('js-correction-row-1218882');
      expect(textarea.value).toBe('My son recently found out that he failed the October entrance exam.');
    });

    it('should fill in feedback note textarea', () => {
      const corrections = [
        {
          id: '1218882',
          perfect: false,
          revised: 'My son recently found out that he failed the October entrance exam.',
          note: 'More natural phrasing.',
        },
      ];

      applyCorrections(document, corrections);

      const noteTextarea = document.getElementById('js-correction-note-1218882');
      expect(noteTextarea.value).toBe('More natural phrasing.');
    });

    it('should click the edit button for corrected sentences', () => {
      const corrections = [
        {
          id: '1218882',
          perfect: false,
          revised: 'Changed text',
          note: 'Some note',
        },
      ];

      applyCorrections(document, corrections);

      // After clicking edit, the correction box should be visible (d-none removed)
      const correctionBox = document.querySelector('[data-correction-box="1218882"]');
      expect(correctionBox.classList.contains('d-none')).toBe(false);
    });

    it('should click the perfect button for perfect sentences', () => {
      const corrections = [
        {
          id: '1218884',
          perfect: true,
          revised: '',
          note: '',
        },
      ];

      applyCorrections(document, corrections);

      // The card should have data-action="perfect" after clicking
      const card = document.querySelector('[data-sentence-id="1218884"]');
      expect(card.getAttribute('data-action')).toBe('perfect');
    });

    it('should apply multiple corrections', () => {
      const corrections = [
        { id: '1218881', perfect: true, revised: '', note: '' },
        { id: '1218882', perfect: false, revised: 'Corrected text', note: 'Note 1' },
        { id: '1218883', perfect: true, revised: '', note: '' },
      ];

      applyCorrections(document, corrections);

      expect(document.querySelector('[data-sentence-id="1218881"]').getAttribute('data-action')).toBe('perfect');
      expect(document.getElementById('js-correction-row-1218882').value).toBe('Corrected text');
      expect(document.querySelector('[data-sentence-id="1218883"]').getAttribute('data-action')).toBe('perfect');
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
