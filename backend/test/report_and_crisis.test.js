import test from 'node:test';
import assert from 'node:assert/strict';
import { getPdfFilename } from '../../frontend/src/utils/pdfReportGenerator.js';

test('Report & Crisis Validation Suite', async (t) => {
  await t.test('getPdfFilename generates format MindVision_CheckIn_YYYY-MM-DD.pdf from timestamp', () => {
    const record = {
      timestamp: '9/23/2026, 10:25:09 PM'
    };
    const filename = getPdfFilename(record);
    assert.match(filename, /^MindVision_CheckIn_\d{4}-\d{2}-\d{2}\.pdf$/);
    assert.ok(filename.startsWith('MindVision_CheckIn_2026-09-'));
  });

  await t.test('getPdfFilename generates format from dateIso', () => {
    const record = {
      dateIso: '2026-10-21T12:00:00.000Z'
    };
    const filename = getPdfFilename(record);
    assert.equal(filename, 'MindVision_CheckIn_2026-10-21.pdf');
  });

  await t.test('getPdfFilename gracefully falls back to today if record timestamp is missing or malformed', () => {
    const filenameEmpty = getPdfFilename({});
    assert.match(filenameEmpty, /^MindVision_CheckIn_\d{4}-\d{2}-\d{2}\.pdf$/);

    const filenameMalformed = getPdfFilename({ timestamp: 'invalid-date' });
    assert.match(filenameMalformed, /^MindVision_CheckIn_\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
