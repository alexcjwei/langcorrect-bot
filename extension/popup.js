// Popup script

const statusEl = document.getElementById('status');
const correctBtn = document.getElementById('correct-btn');
const optionsBtn = document.getElementById('options-btn');
const providerInfoEl = document.getElementById('provider-info');

let sentences = [];
let nativeText = null;
let settings = null;
let isJournalPage = false;
let isCorrectionPage = false;

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

  // Check if we're on a LangCorrect journal page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url || !tab.url.includes('langcorrect.com/journals/')) {
    setStatus('warning', 'Open a LangCorrect journal page to use this extension.');
    return;
  }

  isCorrectionPage = tab.url.includes('make_corrections');
  isJournalPage = !isCorrectionPage;

  try {
    if (isCorrectionPage) {
      // Extract sentences from the correction page
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractSentences' });
      sentences = response.sentences;

      if (sentences.length === 0) {
        setStatus('warning', 'No sentences found on this page.');
        return;
      }

      setStatus('info', `Found <span id="sentences-count">${sentences.length}</span> sentences to correct.`);
      correctBtn.disabled = false;
    } else if (isJournalPage) {
      // Extract native text from the journal page
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractNativeText' });
      nativeText = response.nativeText;

      setStatus('info', `Ready to start corrections${nativeText ? ' (with native language context)' : ''}.`);
      correctBtn.disabled = false;
      correctBtn.textContent = 'Start Corrections';
    }
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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (isJournalPage) {
    // Navigate to the correction page with native text context
    try {
      // Extract journal slug from URL
      const urlParts = tab.url.split('/');
      const journalSlug = urlParts[urlParts.length - 1];

      // Store native text for the correction page to pick up
      if (nativeText) {
        await chrome.storage.local.set({ journalNativeText: nativeText });
      }

      // Navigate to the correction page
      chrome.tabs.update(tab.id, {
        url: `https://langcorrect.com/journals/${journalSlug}/make_corrections`,
      });
    } catch (error) {
      setStatus('error', `Error: ${error.message}`);
    }
  } else if (isCorrectionPage) {
    // Existing correction flow
    correctBtn.disabled = true;
    correctBtn.innerHTML = '<span class="loading"></span>Correcting...';

    try {
      // Get any stored native text from the journal page
      const storage = await chrome.storage.local.get(['journalNativeText']);
      const storedNativeText = storage.journalNativeText;

      // Clear the stored native text after using it
      if (storedNativeText) {
        await chrome.storage.local.remove(['journalNativeText']);
      }

      // Build the prompt with native text context if available
      const prompt = buildPrompt(sentences, null, storedNativeText);

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
  }
});

// Handle options button click
optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Prompt builder (same as src/parser.js)
function buildPrompt(sentences, level = null, nativeText = null) {
  const numberedSentences = sentences
    .map((s, i) => `${i + 1}. ${s.original}`)
    .join('\n');

  const levelContext = level
    ? `You are an English language teacher helping a ${level}-level student improve their writing.`
    : `You are an English language teacher helping a student improve their writing. The student's level is unknown, so adjust your corrections and explanations to be clear and helpful.`;

  const nativeLanguageContext = nativeText
    ? `\nThe student's native language text for context:\n${nativeText}\n`
    : '';

  return `${levelContext} Review each sentence and provide corrections and explanations${level ? ` appropriate for ${level} level` : ''}.${nativeLanguageContext}
For each sentence:
- If it's correct, mark it as "perfect": true (omit revised and note)
- If it needs correction, provide the revised sentence and a brief note explaining the fix

Sentences to review:
${numberedSentences}

Respond ONLY with valid JSON in this exact format:
{
  "corrections": [
    {"perfect": true},
    {"perfect": false, "revised": "The corrected sentence here.", "note": "Brief explanation of the fix."}
  ],
  "feedback": "Overall feedback for the student (1-3 sentences). Follow the 'sandwich' pattern."
}

Important:
- Include an entry for EVERY sentence, in the same order as listed above
- For perfect sentences: only include "perfect": true (omit revised and note)
- For corrections: set perfect=false and include both revised text and note
- Keep notes concise and helpful
- Be encouraging in the overall feedback`;
}

// Response parser (same as src/parser.js)
function parseAIResponse(response, sentences) {
  let jsonStr = response.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  if (!parsed.corrections || !Array.isArray(parsed.corrections)) {
    throw new Error('AI response missing corrections array');
  }

  // Validate array length matches
  if (parsed.corrections.length !== sentences.length) {
    throw new Error(`Corrections array length (${parsed.corrections.length}) does not match sentences length (${sentences.length})`);
  }

  // Map array position to sentence IDs
  const corrections = parsed.corrections.map((c, index) => {
    const sentence = sentences[index];

    return {
      id: sentence.id,
      perfect: c.perfect,
      revised: c.revised || '',
      note: c.note || '',
    };
  });

  return {
    corrections,
    feedback: parsed.feedback || '',
  };
}

// Initialize on load
init();
