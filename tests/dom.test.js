import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { extractSentences, applyCorrections, extractLevel, extractNativeText } from '../src/dom.js';

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

  describe('extractNativeText', () => {
    it('should extract native text from journal page', () => {
      const journalFixture = readFileSync('./docs/journal-example.html', 'utf-8');
      const dom = new JSDOM(journalFixture);
      const journalDoc = dom.window.document;

      const nativeText = extractNativeText(journalDoc);

      expect(nativeText).toContain('最近、いろいろな国の人たちと日本の熊出没について話す機会がありました');
    });

    it('should return null when native text is not found on journal page', () => {
      const dom = new JSDOM('<html><body><div>Only English text here</div></body></html>');
      const docWithoutNative = dom.window.document;

      const nativeText = extractNativeText(docWithoutNative);

      expect(nativeText).toBe(null);
    });

    it('should extract text from element with lang attribute that differs from English', () => {
      const dom = new JSDOM(`
        <html><body>
          <div class="card-body">
            <p lang="en">English text here</p>
            <p lang="ja">日本語のテキスト</p>
          </div>
        </body></html>
      `);
      const doc = dom.window.document;

      const nativeText = extractNativeText(doc);

      expect(nativeText).toBe('日本語のテキスト');
    });

    it('should clean up HTML line breaks in native text', () => {
      const dom = new JSDOM(`
        <html><body>
          <div class="card-body">
            <p lang="en">English text here</p>
            <p lang="ja">First part<br><br>Second part</p>
          </div>
        </body></html>
      `);
      const doc = dom.window.document;

      const nativeText = extractNativeText(doc);

      expect(nativeText).toContain('First part');
      expect(nativeText).toContain('Second part');
    });

    it('should return null when there is no non-English lang attribute', () => {
      const dom = new JSDOM(`
        <html><body>
          <div class="card-body">
            <p lang="en">English text</p>
            <p lang="en">More English text</p>
          </div>
        </body></html>
      `);
      const doc = dom.window.document;

      const nativeText = extractNativeText(doc);

      expect(nativeText).toBe(null);
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
