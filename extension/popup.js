// Popup script

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

// Prompt builder (same as src/parser.js)
function buildPrompt(sentences) {
  const numberedSentences = sentences
    .map((s, i) => `${i + 1}. ${s.original}`)
    .join('\n');

  return `You are an English language teacher helping a student improve their writing. Review each sentence and provide corrections.

For each sentence:
- If it's correct, mark it as "perfect": true
- If it needs correction, provide the revised sentence and a brief note explaining the fix

Sentences to review:
${numberedSentences}

Respond ONLY with valid JSON in this exact format:
{
  "corrections": [
    {"index": 1, "perfect": true, "revised": "", "note": ""},
    {"index": 2, "perfect": false, "revised": "The corrected sentence here.", "note": "Brief explanation of the fix."}
  ],
  "feedback": "Overall encouraging feedback for the student (1-2 sentences)."
}

Important:
- Include an entry for EVERY sentence, in order
- For perfect sentences: set perfect=true, revised="", note=""
- For corrections: set perfect=false, provide revised text and explanation
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

  const corrections = parsed.corrections.map(c => {
    const sentenceIndex = c.index - 1;
    const sentence = sentences[sentenceIndex];

    if (!sentence) {
      throw new Error(`Invalid correction index: ${c.index}`);
    }

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
