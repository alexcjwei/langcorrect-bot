# langcorrect-bot

This is a chrome extension to auto-correct journals on the [LangCorrect](https://langcorrect.com) platform.

## Motivation

LangCorrect is a platform that lets users write journals in their target learning language, and receive feedback from native speakers.

The platform enforces a "Correction ratio", such that a user may only post their own journal if they maintain a correction ratio above 1.0 (number of corrections given / number of sentences written).

## Usage

To use, the user can simply
1. Get an Anthropic / OpenAI API key and set it in the extension settings
2. Open the journal they'd like to correct
3. Click the extension icon, then the "Correct" button. The extension will auto-fill the journal with page with corrections
4. Make custom changes, then click the "Submit" to submit the form.

## LangCorrect Interface Walkthrough

See the detailed walkthrough of the correction form that the extension fills in in docs/correction-form-walkthrough.md


## Future work

When writing, develop with these future extensions in mind so it's easier to port over in the future.

Modify this as a daily workflow to run corrections on new English entries:
1. Cron job to login, get new token, and check for new entries
2. Queue that runs jobs to makes corrections
3. Profit

Support for correcting multiple languages.

Support starting the tool from the main journal page, so that we can use the native language as additional context when correcting.

Add validation to prevent prompt hacking.
