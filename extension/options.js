// Options page script

const anthropicOption = document.getElementById('anthropic-option');
const openaiOption = document.getElementById('openai-option');
const anthropicSection = document.getElementById('anthropic-section');
const openaiSection = document.getElementById('openai-section');
const anthropicKeyInput = document.getElementById('anthropic-key');
const openaiKeyInput = document.getElementById('openai-key');
const saveBtn = document.getElementById('save-btn');
const statusEl = document.getElementById('status');

let selectedProvider = null;

// Load saved settings
async function loadSettings() {
  const settings = await chrome.storage.sync.get(['provider', 'anthropicKey', 'openaiKey']);

  if (settings.provider) {
    selectProvider(settings.provider);
  }

  if (settings.anthropicKey) {
    anthropicKeyInput.value = settings.anthropicKey;
  }

  if (settings.openaiKey) {
    openaiKeyInput.value = settings.openaiKey;
  }
}

function selectProvider(provider) {
  selectedProvider = provider;

  // Update UI
  anthropicOption.classList.toggle('selected', provider === 'anthropic');
  openaiOption.classList.toggle('selected', provider === 'openai');

  anthropicSection.classList.toggle('hidden', provider !== 'anthropic');
  openaiSection.classList.toggle('hidden', provider !== 'openai');

  // Update radio buttons
  document.querySelector(`input[value="${provider}"]`).checked = true;
}

// Provider selection handlers
anthropicOption.addEventListener('click', () => selectProvider('anthropic'));
openaiOption.addEventListener('click', () => selectProvider('openai'));

// Save settings
saveBtn.addEventListener('click', async () => {
  if (!selectedProvider) {
    showStatus('error', 'Please select an AI provider.');
    return;
  }

  const anthropicKey = anthropicKeyInput.value.trim();
  const openaiKey = openaiKeyInput.value.trim();

  // Validate the selected provider has a key
  if (selectedProvider === 'anthropic' && !anthropicKey) {
    showStatus('error', 'Please enter your Anthropic API key.');
    return;
  }

  if (selectedProvider === 'openai' && !openaiKey) {
    showStatus('error', 'Please enter your OpenAI API key.');
    return;
  }

  // Save to storage
  await chrome.storage.sync.set({
    provider: selectedProvider,
    anthropicKey,
    openaiKey,
  });

  showStatus('success', 'Settings saved successfully!');
});

function showStatus(type, message) {
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;

  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 3000);
}

// Initialize
loadSettings();
