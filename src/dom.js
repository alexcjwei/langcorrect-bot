/**
 * Extract the language learner's level from the page
 * @param {Document} document - The DOM document
 * @returns {string|null} The language level (e.g., "A1", "B2") or null if not found
 */
export function extractLevel(document) {
  const levelSpan = document.querySelector('[data-bs-title="Language level"]');

  if (!levelSpan) {
    return null;
  }

  // Clone the span, remove the icon, and get the text
  const clone = levelSpan.cloneNode(true);
  const icon = clone.querySelector('i');
  if (icon) {
    icon.remove();
  }

  return clone.textContent.trim();
}

/**
 * Check if a sentence card is for a post title
 * @param {Element} card - The correction card element
 * @returns {boolean} True if the card contains a "Post title" badge
 */
function isTitleSentence(card) {
  const badge = card.querySelector('.js-sentence .badge');
  if (!badge) {
    return false;
  }
  return badge.textContent.trim() === 'Post title';
}

/**
 * Extract sentences from LangCorrect correction cards
 * @param {Document} document - The DOM document
 * @returns {Array<{id: string, original: string, isTitle: boolean}>} Array of sentence objects
 */
export function extractSentences(document) {
  const cards = document.querySelectorAll('.js-correction-card');
  const sentences = [];

  cards.forEach(card => {
    const id = card.getAttribute('data-sentence-id');
    const original = card.getAttribute('data-original-sentence');

    if (id && original) {
      // Decode HTML entities
      const decoded = decodeHTMLEntities(original);
      sentences.push({
        id,
        original: decoded,
        isTitle: isTitleSentence(card),
      });
    }
  });

  return sentences;
}

/**
 * Decode HTML entities in a string
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHTMLEntities(text) {
  const textarea = typeof document !== 'undefined'
    ? document.createElement('textarea')
    : null;

  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Fallback for Node.js environment
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Apply corrections to the LangCorrect form
 * @param {Document} document - The DOM document
 * @param {Array<{id: string, perfect: boolean, revised: string, note: string}>} corrections
 * @param {string} [overallFeedback] - Optional overall feedback text
 */
export function applyCorrections(document, corrections, overallFeedback) {
  corrections.forEach(correction => {
    const { id, perfect, revised, note } = correction;
    const card = document.querySelector(`[data-sentence-id="${id}"]`);

    if (!card) return;

    if (perfect) {
      // Click the perfect button
      const perfectBtn = card.querySelector('.js-mark-as-perfect');
      if (perfectBtn) {
        // Simulate what clicking the perfect button does
        card.setAttribute('data-action', 'perfect');
      }
    } else {
      // Click the edit button to show the correction box
      const correctionBox = document.querySelector(`[data-correction-box="${id}"]`);
      if (correctionBox) {
        correctionBox.classList.remove('d-none');
      }

      // Fill in the correction textarea
      const correctionTextarea = document.getElementById(`js-correction-row-${id}`);
      if (correctionTextarea) {
        correctionTextarea.value = revised;
      }

      // Fill in the note textarea
      const noteTextarea = document.getElementById(`js-correction-note-${id}`);
      if (noteTextarea) {
        noteTextarea.value = note;
      }

      // Update card action
      card.setAttribute('data-action', 'corrected');
    }
  });

  // Set overall feedback if provided
  if (overallFeedback) {
    const feedbackTextarea = document.getElementById('overall-feedback');
    if (feedbackTextarea) {
      feedbackTextarea.value = overallFeedback;
    }
  }
}
