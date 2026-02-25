import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quote } from './types';

export async function generateQuotePDF(
  quote: Quote,
  elementId?: string
): Promise<void> {
  try {
    // Initialize PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Create single page container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.padding = '20px';
    container.style.backgroundColor = 'white';
    container.style.direction = 'rtl';
    container.style.fontFamily = 'Arial, sans-serif';

    // Build HTML for single page
    let html = `
      <div style="text-align: right; direction: rtl;">
        <h1 style="font-size: 22px; font-weight: bold; margin: 0 0 10px 0; color: #1f2937;">הצעת מחיר</h1>
        <hr style="border: none; border-top: 2px solid #333; margin: 8px 0;">

        <div style="margin: 10px 0; font-size: 13px; line-height: 1.4;">
          <p style="margin: 3px 0;"><strong>שם לקוח:</strong> ${quote.customerName}</p>
          <p style="margin: 3px 0;"><strong>תעודת זהות:</strong> ${quote.idNumber || '—'}</p>
          <p style="margin: 3px 0;"><strong>מספר רכב:</strong> ${quote.carPlate}</p>
          <p style="margin: 3px 0;"><strong>מספר הצעה:</strong> <span style="color: #2563eb; font-weight: bold;">${quote.quoteNumber}</span></p>
          <p style="margin: 3px 0;"><strong>סכום (כולל מע״מ):</strong> <span style="color: #16a34a; font-weight: bold; font-size: 15px;">₪${quote.quoteAmount}</span></p>
          <p style="margin: 3px 0;"><strong>טלפון:</strong> ${quote.phoneNumber}</p>
          <p style="margin: 3px 0;"><strong>תאריך:</strong> ${quote.createdAt.toLocaleDateString('he-IL')}</p>
    `;

    // Add notes section BEFORE images (max 3 lines)
    if (quote.notes && quote.notes.trim()) {
      html += `
        <div style="margin: 8px 0;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 3px 0;">הערות:</h3>
          <div style="background: #f3f4f6; padding: 6px 8px; border-radius: 4px; font-size: 10px; line-height: 1.3; white-space: pre-wrap; word-wrap: break-word; max-height: 42px; overflow: hidden;">${quote.notes}</div>
        </div>
      `;
    }

    html += `<hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">`;

    // Images section - side by side if 2 images, single if 1 image
    const hasImage2 = quote.quoteImageUrl2 && quote.quoteImageUrl2.length > 0;
    const isApproved = quote.status === 'approved' && quote.signatureImageUrl;

    console.log('📄 PDF Generation:', { hasImage2, quoteImageUrl2Length: quote.quoteImageUrl2?.length });

    if (hasImage2) {
      // Two images side by side using table layout (better for PDF)
      html += `
        <table style="width: 100%; margin: 10px 0; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; text-align: center; padding: 5px; vertical-align: top;">
              <p style="font-size: 10px; font-weight: bold; margin: 0 0 5px 0;">הצעה 1</p>
              <div style="position: relative; display: inline-block; width: 100%;">
                <img src="${quote.quoteImageUrl}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; display: block;" />
      `;

      // Add signature overlay on Image 1 (bottom left)
      if (isApproved) {
        html += `
              <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(255,255,255,0.95); padding: 8px; border: 2px solid #16a34a; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <img src="${quote.signatureImageUrl}" style="height: 50px; width: auto; display: block; margin: 0 0 4px 0;" />
                <p style="margin: 0; font-size: 10px; font-weight: bold; color: #000; white-space: nowrap;">חתימת ${quote.customerName}</p>
              </div>
        `;
      }

      html += `
              </div>
            </td>
            <td style="width: 50%; text-align: center; padding: 5px; vertical-align: top;">
              <p style="font-size: 10px; font-weight: bold; margin: 0 0 5px 0;">הצעה 2</p>
              <img src="${quote.quoteImageUrl2}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; display: block;" />
            </td>
          </tr>
        </table>
      `;
    } else {
      // Single image - larger with signature overlay
      html += `
        <div style="margin: 10px 0; text-align: center;">
          <p style="font-size: 11px; font-weight: bold; margin: 0 0 8px 0;">תמונת ההצעה</p>
          <div style="position: relative; display: inline-block; width: 80%;">
            <img src="${quote.quoteImageUrl}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; display: block;" />
      `;

      // Add signature overlay (bottom left)
      if (isApproved) {
        html += `
            <div style="position: absolute; bottom: 15px; left: 15px; background: rgba(255,255,255,0.95); padding: 10px; border: 2px solid #16a34a; border-radius: 6px; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">
              <img src="${quote.signatureImageUrl}" style="height: 60px; width: auto; display: block; margin: 0 0 5px 0;" />
              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #000; white-space: nowrap;">חתימת ${quote.customerName}</p>
            </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    // Show approval status if approved (but signature is on image now)
    if (isApproved) {
      html += `
        <div style="margin: 10px 0; padding: 8px; border: 2px solid #16a34a; border-radius: 6px; background: #f0fdf4; text-align: center;">
          <p style="font-size: 11px; font-weight: bold; margin: 0; color: #16a34a;">✓ הצעה אושרה ונחתמה ב-${quote.approvedAt?.toLocaleDateString('he-IL')}</p>
        </div>
      `;
    } else {
      // Placeholder for signature if not approved
      html += `
        <div style="margin: 10px 0; padding: 12px; border: 2px dashed #d1d5db; border-radius: 6px; text-align: center; background: #f9fafb;">
          <p style="font-size: 11px; color: #6b7280; margin: 0;">ממתין לחתימת הלקוח</p>
        </div>
      `;
    }

    // Footer
    html += `
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 9px; color: #6b7280; text-align: center;">${new Date().toLocaleDateString('he-IL')} | מזהה: ${quote.id}</p>
        </div>
      </div>
    `;

    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait for images to load
    const images = container.getElementsByTagName('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    // Additional wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture as canvas with good quality
    const canvas = await html2canvas(container, {
      scale: 2, // Good resolution
      backgroundColor: '#ffffff',
      allowTaint: true,
      useCORS: true,
      logging: false,
      windowHeight: container.scrollHeight,
      imageTimeout: 15000,
    });

    document.body.removeChild(container);

    // Convert to PDF - compress to reduce file size
    const imgData = canvas.toDataURL('image/jpeg', 0.75); // 75% quality for smaller size
    const imgWidth = pageWidth - 20; // margins
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Scale down if too tall to fit on one page
    const maxHeight = pageHeight - 20;
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
    }

    const xPosition = 10;
    const yPosition = 10;

    pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);

    // Save PDF
    pdf.save(`quote-${quote.quoteNumber}-${quote.customerName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}
