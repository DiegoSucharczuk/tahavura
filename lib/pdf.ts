import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quote } from './types';

export async function generateQuotePDF(
  quote: Quote,
  elementId?: string
): Promise<void> {
  try {
    // Create a temporary container div
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.direction = 'rtl';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.lineHeight = '1.6';
    
    // Build HTML content
    let html = `
      <div style="text-align: right; direction: rtl;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 15px 0; color: #1f2937;">הצעה</h1>
        <hr style="border: none; border-top: 2px solid #333; margin: 15px 0;">
        
        <div style="margin: 15px 0;">
          <p style="margin: 8px 0;"><strong>שם הלקוח:</strong> ${quote.customerName}</p>
          <p style="margin: 8px 0;"><strong>מספר תעודת זהות:</strong> ${quote.idNumber || '—'}</p>
          <p style="margin: 8px 0;"><strong>מספר רישוי רכב:</strong> ${quote.carPlate}</p>
          <p style="margin: 8px 0;"><strong>מספר טלפון:</strong> ${quote.phoneNumber}</p>
          <p style="margin: 8px 0;"><strong>נוצר ב-:</strong> ${quote.createdAt.toLocaleDateString('he-IL')}</p>
          <p style="margin: 8px 0;"><strong>סטטוס:</strong> <span style="color: ${quote.status === 'approved' ? '#16a34a' : '#ca8a04'}">${quote.status === 'approved' ? '✓ אושר' : '⏳ בהמתנה'}</span></p>
    `;

    if (quote.approvedAt) {
      html += `<p style="margin: 8px 0;"><strong>אושר ב-:</strong> ${quote.approvedAt.toLocaleDateString('he-IL')}</p>`;
    }

    html += `
        </div>
    `;

    if (quote.notes) {
      html += `
        <div style="margin: 15px 0;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">הערות:</h3>
          <p style="margin: 0; white-space: pre-wrap; background: #f3f4f6; padding: 10px; border-radius: 3px; font-size: 13px;">${quote.notes}</p>
        </div>
      `;
    }

    if (quote.quoteImageUrl) {
      html += `
        <div style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 3px; padding: 10px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">תמונת ההצעה:</h3>
          <img src="${quote.quoteImageUrl}" style="max-width: 100%; height: auto; display: block; margin: 0;" />
      `;

      // Add signature if approved
      if (quote.status === 'approved' && quote.signatureImageUrl) {
        html += `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd;">
            <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">חתימה:</h3>
            <img src="${quote.signatureImageUrl}" style="height: 60px; width: auto; display: block; margin: 0;" />
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">חתום על ידי: ${quote.customerName}</p>
          </div>
        `;
      }

      html += `
        </div>
      `;
    }

    html += `
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p style="margin: 0; font-size: 11px; color: #808080; text-align: center;">נוצר ב- ${new Date().toLocaleDateString('he-IL')} | מזהה הצעה: ${quote.id}</p>
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

    // Convert canvas to PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`quote-${quote.id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

