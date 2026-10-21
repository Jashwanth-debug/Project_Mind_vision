import { jsPDF } from 'jspdf';

/**
 * Sanitizes input text for standard PDF Type-1 fonts (Helvetica, Times, Courier).
 * Standard PDF fonts only support ASCII/WinAnsi characters; unmapped Unicode characters
 * (like smart quotes, em-dashes, and bullets) cause corruption in strict PDF viewers
 * such as Adobe Acrobat Reader and macOS Preview.
 */
export function sanitizePdfText(str = '') {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/\u2022/g, '-')         // Bullet point
    .replace(/\u2014/g, '--')        // Em dash
    .replace(/\u2013/g, '-')         // En dash
    .replace(/\u2026/g, '...')       // Ellipsis
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Strip non-ASCII
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a clean, standardized filename for the check-in PDF report:
 * Format: MindVision_CheckIn_YYYY-MM-DD.pdf
 */
export function getPdfFilename(record) {
  let dateStr = '';
  if (record?.dateIso && typeof record.dateIso === 'string') {
    dateStr = record.dateIso.split('T')[0];
  } else if (record?.timestamp) {
    const parsed = new Date(record.timestamp);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
    }
  }

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  }

  return `MindVision_CheckIn_${dateStr}.pdf`;
}

/**
 * Generates a structured, branded PDF report for a patient check-in.
 * 
 * Includes:
 * - MindVision logo/header and "Wellness Check-in Report" title
 * - Date/time of check-in
 * - Plain-language summary matching on-screen tone
 * - Structured reflection cues (Your words, Your speaking rhythm, Gentle expressions)
 * - Footer disclaimer: "This is a wellness check-in, not a medical diagnosis."
 * - Strict binary validation: %PDF- header check, valid MIME type, and clean Blob download
 */
export async function generateCheckInPdf(record = {}, options = { save: true }) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const isElevated =
      record.riskLevel === 'ELEVATED' ||
      record.riskLevel === 'SEVERE' ||
      (typeof record.compositeRisk === 'number' && record.compositeRisk >= 5.0);

    const headline = sanitizePdfText(
      record.summary ||
      (isElevated
        ? 'It might help to talk with someone'
        : 'Steady & calm pattern reported')
    );

    const explanation = sanitizePdfText(
      record.explanation ||
      (isElevated
        ? 'We noticed subtle signs of stress in your responses today. Remember that carrying a lot is hard, and gentle support is always available.'
        : 'Your self-reported answers and estimated signals reflect a calm, steady pattern today. Nice job taking time out of your day to pause and check in with yourself.')
    );

    const filename = getPdfFilename(record);

    // -------------------------------------------------------------
    // 1. TOP BRAND HEADER (Teal Banner)
    // -------------------------------------------------------------
    doc.setFillColor(37, 124, 111); // Brand Sage Teal #257C6F
    doc.rect(0, 0, 210, 26, 'F');

    // Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('MINDVISION', 18, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Your Wellness Check-in Companion', 18, 19.5);

    // Confidential Tag
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENTIAL | FOR SELF-REFLECTION', 192, 16, { align: 'right' });

    // -------------------------------------------------------------
    // 2. REPORT TITLE & METADATA
    // -------------------------------------------------------------
    let yPos = 38;

    doc.setTextColor(31, 41, 55); // Charcoal #1F2937
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Wellness Check-in Report', 18, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(107, 114, 128); // Slate-500 #6B7280

    const displayDate = sanitizePdfText(record.timestamp || new Date().toLocaleString());
    const recordId = sanitizePdfText(record.id || 'MV-REC-TODAY');
    doc.text(`Completed: ${displayDate}   |   Reference ID: ${recordId}`, 18, yPos);

    // -------------------------------------------------------------
    // 3. PLAIN-LANGUAGE SUMMARY CARD
    // -------------------------------------------------------------
    yPos += 10;

    // Card background
    if (isElevated) {
      doc.setFillColor(254, 243, 199); // Warm amber subtle #FEF3C7
      doc.setDrawColor(251, 191, 36);  // Amber border
    } else {
      doc.setFillColor(239, 246, 245); // Teal soft #EFF6F5
      doc.setDrawColor(167, 214, 207); // Soft teal border
    }

    doc.roundedRect(18, yPos, 174, 34, 3, 3, 'FD');

    // Status Badge & Headline
    doc.setTextColor(isElevated ? 180 : 27, isElevated ? 83 : 115, isElevated ? 9 : 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(headline, 24, yPos + 10);

    // Explanation Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81); // Slate-700
    const explanationLines = doc.splitTextToSize(explanation, 162);
    doc.text(explanationLines, 24, yPos + 17);

    // -------------------------------------------------------------
    // 4. STRUCTURED REFLECTION CUES SECTION
    // -------------------------------------------------------------
    yPos += 44;

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Reflection Cues', 18, yPos);

    yPos += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text('Everyday signals and thoughts observed during your pause:', 18, yPos);

    // Cue Box 1: Your Words
    yPos += 7;
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.roundedRect(18, yPos, 174, 28, 2, 2, 'FD');

    doc.setTextColor(37, 124, 111);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. Your Words', 24, yPos + 7);

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const wordsRaw = sanitizePdfText(
      record.cues?.words ||
      (record.text ? record.text.replace(/\(High somatic.*?\)/g, '') : '') ||
      'Shared reflections on daily routine, energy, and sleep patterns.'
    );
    const wordsText = doc.splitTextToSize(`"${wordsRaw}"`, 162);
    doc.text(wordsText, 24, yPos + 14);

    // Cue Box 2: Your Speaking Rhythm
    yPos += 33;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(18, yPos, 174, 24, 2, 2, 'FD');

    doc.setTextColor(37, 124, 111);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('2. Your Speaking Rhythm', 24, yPos + 7);

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const rhythmRaw = sanitizePdfText(
      record.cues?.speakingRhythm ||
      (record.hasAudioTelemetry
        ? 'Steady, calm pacing with natural breathing intervals and warm tone.'
        : 'Even conversational pacing observed in reflections.')
    );
    const rhythmText = doc.splitTextToSize(rhythmRaw, 162);
    doc.text(rhythmText, 24, yPos + 14);

    // Cue Box 3: Gentle Expressions
    yPos += 29;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(18, yPos, 174, 24, 2, 2, 'FD');

    doc.setTextColor(37, 124, 111);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('3. Gentle Expressions', 24, yPos + 7);

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const expressionsRaw = sanitizePdfText(
      record.cues?.gentleExpressions ||
      (record.hasFacialTelemetry
        ? 'Relaxed facial muscle tone and comfortable focus observed during responses.'
        : 'Self-guided reflection completed with relaxed focus.')
    );
    const expressionsText = doc.splitTextToSize(expressionsRaw, 162);
    doc.text(expressionsText, 24, yPos + 14);

    // -------------------------------------------------------------
    // 5. HELPFUL SUPPORT & CRISIS RESOURCES
    // -------------------------------------------------------------
    yPos += 30;

    doc.setFillColor(254, 242, 242); // Warm red/rose tint #FEF2F2
    doc.setDrawColor(254, 202, 202); // #FECACA
    doc.roundedRect(18, yPos, 174, 26, 2, 2, 'FD');

    doc.setTextColor(153, 27, 27); // Deep red
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Need Support or Someone to Talk To?', 24, yPos + 7);

    doc.setTextColor(80, 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const crisisInfo = sanitizePdfText(
      'Free, confidential support is available 24/7 across the US and Canada. ' +
      'Call or text 988 to connect with the Suicide & Crisis Lifeline, or text HOME to 741741.'
    );
    const crisisLines = doc.splitTextToSize(crisisInfo, 162);
    doc.text(crisisLines, 24, yPos + 13.5);

    // -------------------------------------------------------------
    // 6. FOOTER & DISCLAIMER (Pin to bottom)
    // -------------------------------------------------------------
    doc.setDrawColor(229, 231, 235);
    doc.line(18, 272, 192, 272);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99); // Slate-600
    doc.text('This is a wellness check-in, not a medical diagnosis.', 105, 278, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175); // Slate-400
    doc.text(
      'MindVision AI | Generated locally on your device | Confidential personal reflection record',
      105,
      283,
      { align: 'center' }
    );

    // -------------------------------------------------------------
    // 7. VERIFICATION STEP IN CODE (Dev-mode verification)
    // -------------------------------------------------------------
    const blob = doc.output('blob');

    // Dev-mode console log of blob.size and blob.type
    console.log('[MindVision PDF Pipeline] Generated Blob Verification:', {
      size: blob?.size,
      type: blob?.type,
      filename: filename
    });

    if (!blob || !(blob instanceof Blob) || blob.size <= 0) {
      throw new Error(`PDF generation produced empty or invalid Blob (size: ${blob?.size || 0} bytes).`);
    }

    if (blob.type !== 'application/pdf') {
      throw new Error(`PDF generation produced incorrect MIME type: ${blob.type || 'undefined'}, expected application/pdf.`);
    }

    // Inspect arrayBuffer to confirm %PDF- binary header
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Header = new Uint8Array(arrayBuffer.slice(0, 5));
    const headerStr = String.fromCharCode(...uint8Header);
    if (!headerStr.startsWith('%PDF-')) {
      throw new Error(`Invalid PDF binary header: expected %PDF-, got ${headerStr}`);
    }

    // -------------------------------------------------------------
    // 8. DOWNLOAD USING jsPDF BUILT-IN doc.save()
    // -------------------------------------------------------------
    // jsPDF's built-in doc.save() handles Blob creation, correct MIME type,
    // and filename assignment internally — eliminating dangling Blob URLs
    // and race conditions from premature URL.revokeObjectURL.
    if (options.save !== false && typeof window !== 'undefined') {
      doc.save(filename);
    }

    return {
      success: true,
      filename,
      blob,
      size: blob.size
    };
  } catch (error) {
    console.error('[MindVision PDF Generator] Failed to generate or download valid PDF:', error);
    throw error;
  }
}
