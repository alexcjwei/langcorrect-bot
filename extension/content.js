// Content script - runs on LangCorrect correction pages

import { extractSentences as extractSentencesFromDom, applyCorrections } from './dom.js';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractSentences') {
    // Pass the current page's document to the extraction function
    const sentences = extractSentencesFromDom(document);
    sendResponse({ sentences });
  } else if (request.action === 'applyCorrections') {
    applyCorrections(document, request.corrections, request.feedback);
    sendResponse({ success: true });
  }
  return true;
});

