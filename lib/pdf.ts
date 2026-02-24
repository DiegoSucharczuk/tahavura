import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quote } from './types';

export async function generateQuotePDF(
  quote: Quote,
  elementId?: string
): Promise<void> {
  try {
    // Create a temporary container div - optimized for single A4 page
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '640px';
    container.style.padding = '20px';
    container.style.backgroundColor = 'white';
    container.style.direction = 'rtl';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.lineHeight = '1.3';
    
    // Build HTML content
    let html = `
      <div style="text-align: right; direction: rtl;">
        <h1 style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0; color: #1f2937;">הצעה</h1>
        <hr style="border: none; border-top: 1px solid #333; margin: 8px 0;">
        
        <div style="margin: 8px 0; font-size: 12px;">
          <p style="margin: 4px 0;"><strong>לקוח:</strong> ${quote.customerName}</p>
          <p style="margin: 4px 0;"><strong>תעודה:</strong> ${quote.idNumber || '—'}</p>
          <p style="margin: 4px 0;"><strong>רכב:</strong> ${quote.carPlate}</p>
          <p style="margin: 4px 0;"><strong>טלפון:</strong> ${quote.phoneNumber}</p>
          <p style="margin: 4px 0;"><strong>תאריך:</strong> ${quote.createdAt.toLocaleDateString('he-IL')}</p>
          <p style="margin: 4px 0;"><strong>סטטוס:</strong> <span style="color: ${quote.status === 'approved' ? '#16a34a' : '#ca8a04'}">${quote.status === 'approved' ? '✓ אושר' : '⏳ בהמתנה'}</span></p>
    `;

    if (quote.approvedAt) {
      html += `<p style="margin: 4px 0;"><strong>אושור:</strong> ${quote.approvedAt.toLocaleDateString('he-IL')}</p>`;
    }

    html += `
        </div>
    `;

    if (quote.notes && quote.notes.trim()) {
      html += `
        <div style="margin: 8px 0;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 3px 0;">הערות:</h3>
          <p style="margin: 0; white-space: pre-wrap; background: #f3f4f6; padding: 5px; border-radius: 2px; font-size: 11px; max-height: 40px; overflow: hidden;">${quote.notes}</p>
        </div>
      `;
    }

    if (quote.quoteImageUrl) {
      html += `
        <div style="margin: 8px 0; border: 1px solid #e5e7eb; border-radius: 2px; padding: 5px;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 4px 0;">תמונה:</h3>
          <img src="${quote.quoteImageUrl}" style="max-width: 100%; height: auto; display: block; margin: 0; max-height: 180px; object-fit: cover;" />
      `;

      // Add signature if approved
      if (quote.status === 'approved' && quote.signatureImageUrl) {
        html += `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ddd;">
            <h3 style="font-size: 10px; font-weight: bold; margin: 0 0 3px 0;">חתימה:</h3>
            <img src="${quote.signatureImageUrl}" style="height: 35px; width: auto; display: block; margin: 0;" />
            <p style="margin: 2px 0 0 0; font-size: 9px; color: #666;">חתום: ${quote.customerName}</p>
          </div>
        `;
      }

      html += `
        </div>
      `;
    }

    html += `
        <hr style="border: none; border-top: 1px solid #ddd; margin: 8px 0;">
        <p style="margin: 0; font-size: 9px; color: #808080; text-align: center;">${new Date().toLocaleDateString('he-IL')} | ${quote.id}</p>
      </div>
    `;

    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait a bit for images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture the HTML as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      allowTaint: true,
      useCORS: true,
      logging: false,
      windowHeight: container.scrollHeight,
    });

    // Remove the temporary container
    document.body.removeChild(container);

    // Convert canvas to PDF - fit on single page
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 10;
    const maxHeight = pageHeight - 10;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Scale down if content exceeds single page
    if (imgHeight > maxHeight) {
      const scale = maxHeight / imgHeight;
      imgHeight = maxHeight;
      // Image width scales proportionally
    }
    
    // Add image centered on page
    const xPosition = (pageWidth - imgWidth) / 2;
    const yPosition = 5;
    
    pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
    pdf.save(`quote-${quote.id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

