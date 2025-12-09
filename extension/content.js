// Content script - runs on LangCorrect correction pages

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractSentences') {
    const sentences = extractSentences();
    sendResponse({ sentences });
  } else if (request.action === 'applyCorrections') {
    applyCorrections(request.corrections, request.feedback);
    sendResponse({ success: true });
  }
  return true;
});

function extractSentences() {
  const cards = document.querySelectorAll('.js-correction-card');
  const sentences = [];

  cards.forEach(card => {
    const id = card.getAttribute('data-sentence-id');
    const original = card.getAttribute('data-original-sentence');

    if (id && original) {
      // Decode HTML entities using a temporary element
      const temp = document.createElement('textarea');
      temp.innerHTML = original;
      sentences.push({ id, original: temp.value });
    }
  });

  return sentences;
}

function applyCorrections(corrections, overallFeedback) {
  corrections.forEach(correction => {
    const { id, perfect, revised, note } = correction;
    const card = document.querySelector(`[data-sentence-id="${id}"]`);

    if (!card) return;

    if (perfect) {
      // Click the perfect button
      const perfectBtn = card.querySelector('.js-mark-as-perfect');
      if (perfectBtn) {
        perfectBtn.click();
      }
    } else {
      // Click the edit button to show the correction box
      const editBtn = card.querySelector('.js-edit-btn');
      if (editBtn) {
        editBtn.click();
      }

      // Small delay to let the UI update, then fill in the fields
      setTimeout(() => {
        const correctionTextarea = document.getElementById(`js-correction-row-${id}`);
        if (correctionTextarea) {
          correctionTextarea.value = revised;
          // Trigger input event for any listeners
          correctionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const noteTextarea = document.getElementById(`js-correction-note-${id}`);
        if (noteTextarea) {
          noteTextarea.value = note;
          noteTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 50);
    }
  });

  // Set overall feedback
  if (overallFeedback) {
    const feedbackTextarea = document.getElementById('overall-feedback');
    if (feedbackTextarea) {
      feedbackTextarea.value = overallFeedback;
      feedbackTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
