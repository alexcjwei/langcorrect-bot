// Popup script

import { buildPrompt, parseAIResponse } from './parser.js';

const statusEl = document.getElementById('status');
const correctBtn = document.getElementById('correct-btn');
const optionsBtn = document.getElementById('options-btn');
const providerInfoEl = document.getElementById('provider-info');

let sentences = [];
let settings = null;

// Initialize popup
async function init() {
  // Load settings
  settings = await chrome.storage.sync.get(['provider', 'anthropicKey', 'openaiKey']);

  // Check if we have valid settings
  const hasKey = (settings.provider === 'anthropic' && settings.anthropicKey) ||
                 (settings.provider === 'openai' && settings.openaiKey);

  if (!settings.provider || !hasKey) {
    setStatus('warning', 'Please configure your API key in Settings.');
    providerInfoEl.textContent = '';
    return;
  }

  providerInfoEl.textContent = `Using: ${settings.provider === 'anthropic' ? 'Anthropic Claude' : 'OpenAI GPT'}`;

  // Check if we're on a LangCorrect correction page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('langcorrect.com/journals/') || !tab.url.includes('make_corrections')) {
    setStatus('warning', 'Open a LangCorrect journal correction page to use this extension.');
    return;
  }

  // Extract sentences from the page
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractSentences' });
    sentences = response.sentences;

    if (sentences.length === 0) {
      setStatus('warning', 'No sentences found on this page.');
      return;
    }

    setStatus('info', `Found <span id="sentences-count">${sentences.length}</span> sentences to correct.`);
    correctBtn.disabled = false;
  } catch (error) {
    // Content script not loaded, try injecting it
    setStatus('warning', 'Please refresh the page and try again.');
  }
}

function setStatus(type, message) {
  statusEl.className = `status ${type}`;
  statusEl.innerHTML = message;
}

// Handle correct button click
correctBtn.addEventListener('click', async () => {
  correctBtn.disabled = true;
  correctBtn.innerHTML = '<span class="loading"></span>Correcting...';

  try {
    // Build the prompt
    const prompt = buildPrompt(sentences);

    // Get the API key based on provider
    const apiKey = settings.provider === 'anthropic' ? settings.anthropicKey : settings.openaiKey;

    // Call the API via background script
    const response = await chrome.runtime.sendMessage({
      action: 'callAPI',
      provider: settings.provider,
      apiKey,
      prompt,
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    // Parse the response
    const result = parseAIResponse(response.data, sentences);

    // Apply corrections to the page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, {
      action: 'applyCorrections',
      corrections: result.corrections,
      feedback: result.feedback,
    });

    setStatus('success', `Applied ${result.corrections.length} corrections! Review and submit.`);
    correctBtn.textContent = 'Done!';
  } catch (error) {
    setStatus('error', `Error: ${error.message}`);
    correctBtn.textContent = 'Correct';
    correctBtn.disabled = false;
  }
});

// Handle options button click
optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});


// Initialize on load
init();
