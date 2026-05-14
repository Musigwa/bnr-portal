import * as fs from 'fs';

const LOG_FILE =
  '/Users/musigwa/.gemini/antigravity/brain/811abaac-5fe7-4482-aa41-c4be75b0fde3/backend_debug.log';

export function logForensic(message: string, error?: unknown) {
  const timestamp = new Date().toISOString();
  let errorDetails = '';

  if (error) {
    const err = error as Error;
    const msg = err.message || String(err);
    const stack = err.stack || 'No stack trace available';
    errorDetails = `\nError: ${msg}\nStack: ${stack}`;
  }

  const logEntry = `[${timestamp}] ${message}${errorDetails}\n---\n`;

  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error('Failed to write to forensic log:', err);
  }
}
