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
    const imgWidth = pageWidth - 10;

    // ===== PAGE 1: DETAILS & TEXT =====
    const container1 = document.createElement('div');
    container1.style.position = 'absolute';
    container1.style.left = '-9999px';
    container1.style.width = '640px';
    container1.style.padding = '20px';
    container1.style.backgroundColor = 'white';
    container1.style.direction = 'rtl';
    container1.style.fontFamily = 'Arial, sans-serif';
    container1.style.lineHeight = '1.3';

    // Build HTML content for page 1 (without images)
    let html1 = `
      <div style="text-align: right; direction: rtl;">
        <h1 style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0; color: #1f2937;">הצעה</h1>
        <hr style="border: none; border-top: 1px solid #333; margin: 8px 0;">
        
        <div style="margin: 8px 0; font-size: 12px;">
          <p style="margin: 4px 0;"><strong>שם לקוח:</strong> ${quote.customerName}</p>
          <p style="margin: 4px 0;"><strong>תעודת זהות:</strong> ${quote.idNumber || '—'}</p>
          <p style="margin: 4px 0;"><strong>מספר רכב:</strong> ${quote.carPlate}</p>
          <p style="margin: 4px 0;"><strong>מספר הצעה:</strong> <span style="color: #2563eb; font-weight: bold;">${quote.quoteNumber}</span></p>
          <p style="margin: 4px 0;"><strong>סכום (כולל מע״מ):</strong> <span style="color: #16a34a; font-weight: bold;">₪ ${quote.quoteAmount}</span></p>
          <p style="margin: 4px 0;"><strong>טלפון:</strong> ${quote.phoneNumber}</p>
          <p style="margin: 4px 0;"><strong>תאריך:</strong> ${quote.createdAt.toLocaleDateString('he-IL')}</p>
          <p style="margin: 4px 0;"><strong>סטטוס:</strong> <span style="color: ${quote.status === 'approved' ? '#16a34a' : '#ca8a04'}">${quote.status === 'approved' ? '✓ אושר' : '⏳ בהמתנה'}</span></p>
    `;

    if (quote.approvedAt) {
      html1 += `<p style="margin: 4px 0;"><strong>אישור:</strong> ${quote.approvedAt.toLocaleDateString('he-IL')}</p>`;
    }

    html1 += `</div>`;

    if (quote.notes && quote.notes.trim()) {
      html1 += `
        <div style="margin: 8px 0;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 8px 0;">הערות:</h3>
          <p style="margin: 0; white-space: pre-wrap; background: #f3f4f6; padding: 5px; border-radius: 2px; font-size: 11px; max-height: 60px; overflow: hidden;">${quote.notes}</p>
        </div>
      `;
    }

    html1 += `
        <hr style="border: none; border-top: 1px solid #ddd; margin: 8px 0;">
        <p style="margin: 0; font-size: 9px; color: #808080; text-align: center;">${new Date().toLocaleDateString('he-IL')} | ${quote.id}</p>
      </div>
    `;

    container1.innerHTML = html1;
    document.body.appendChild(container1);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 300));

    // Capture page 1
    const canvas1 = await html2canvas(container1, {
      scale: 2.5,
      backgroundColor: '#ffffff',
      allowTaint: true,
      useCORS: true,
      logging: false,
      windowHeight: container1.scrollHeight,
    });

    document.body.removeChild(container1);

    // Add page 1 to PDF
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.85);
    let imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
    const maxHeight = pageHeight - 10;

    if (imgHeight1 > maxHeight) {
      imgHeight1 = maxHeight;
    }

    const xPosition = (pageWidth - imgWidth) / 2;
    pdf.addImage(imgData1, 'JPEG', xPosition, 5, imgWidth, imgHeight1);

    // ===== PAGE 2: QUOTE IMAGE (if exists) =====
    if (quote.quoteImageUrl) {
      pdf.addPage();

      const container2 = document.createElement('div');
      container2.style.position = 'absolute';
      container2.style.left = '-9999px';
      container2.style.width = '640px';
      container2.style.padding = '20px';
      container2.style.backgroundColor = 'white';
      container2.style.display = 'flex';
      container2.style.flexDirection = 'column';
      container2.style.alignItems = 'center';

      let html2 = `
        <div style="text-align: center; width: 100%;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #1f2937;">תמונת ההצעה</h2>
          <div style="position: relative; display: inline-block; width: 100%;">
            <img src="${quote.quoteImageUrl}" style="max-width: 100%; height: auto; display: block; margin: 0;" />
      `;

      // Add signature if approved - overlay on image
      if (quote.status === 'approved' && quote.signatureImageUrl) {
        html2 += `
            <div style="position: absolute; bottom: 15px; left: 15px;">
              <img src="${quote.signatureImageUrl}" style="height: 50px; width: auto; display: block; margin: 0; border: 2px solid #000; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" />
              <p style="margin: 5px 0 0 0; font-size: 9px; font-weight: bold; color: #000; white-space: nowrap;">חתום: ${quote.customerName}</p>
            </div>
        `;
      }

      html2 += `
          </div>
        </div>
      `;

      container2.innerHTML = html2;
      document.body.appendChild(container2);

      // Wait for image to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture page 2
      const canvas2 = await html2canvas(container2, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true,
        logging: false,
        windowHeight: container2.scrollHeight,
      });

      document.body.removeChild(container2);

      // Add page 2 to PDF
      const imgData2 = canvas2.toDataURL('image/jpeg', 0.85);
      let imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;

      if (imgHeight2 > maxHeight) {
        imgHeight2 = maxHeight;
      }

      pdf.addImage(imgData2, 'JPEG', xPosition, 5, imgWidth, imgHeight2);
    }

    // Save PDF
    pdf.save(`quote-${quote.id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

