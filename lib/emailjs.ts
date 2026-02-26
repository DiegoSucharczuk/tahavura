import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_u9uiexa';
const EMAILJS_TEMPLATE_ID = 'template_zmd3hbo';
const EMAILJS_PUBLIC_KEY = 't1756hDG1muyIMO9R';

// Initialize EmailJS
console.log('🔧 Initializing EmailJS with public key:', EMAILJS_PUBLIC_KEY);
emailjs.init(EMAILJS_PUBLIC_KEY);
console.log('✅ EmailJS initialized');

/**
 * Send PDF by email using EmailJS
 * @param toEmail - Recipient email address
 * @param pdfDataUrl - Base64 PDF data URL
 * @param quoteDetails - Quote information
 * @param fromEmail - Optional email of the employee who created the quote (for reply-to)
 */
export async function sendPDFByEmail(
  toEmail: string,
  pdfDataUrl: string,
  quoteDetails: {
    customerName: string;
    carPlate: string;
    quoteNumber: string;
    quoteAmount: string;
  },
  fromEmail?: string,
  quoteId?: string
): Promise<void> {
  try {
    console.log('📧 Starting email send...');
    console.log('📧 To:', toEmail);
    console.log('📧 From:', fromEmail);
    console.log('📧 Quote ID:', quoteId);
    console.log('📧 Current origin:', window.location.origin);
    console.log('📧 Current href:', window.location.href);

    // Generate PDF view link instead of attaching PDF
    if (!quoteId) {
      console.error('❌ ERROR: No quote ID provided!');
      throw new Error('Quote ID is required to send email');
    }

    // Create a view token (valid for 24 hours)
    console.log('🔐 Creating secure view token...');
    const tokenResponse = await fetch(`/api/quotes/${quoteId}/create-view-token`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to create view token');
    }

    const { token: viewToken } = await tokenResponse.json();
    console.log('✅ View token created:', viewToken.substring(0, 8) + '...');

    // Use current origin for email links
    // This way localhost emails work locally, and production emails work in production
    const baseUrl = window.location.origin;

    // Use /view/ route with secure token
    const pdfLink = `${baseUrl}/view/${quoteId}?token=${viewToken}`;

    console.log('📧 Base URL:', baseUrl);
    console.log('📧 Generated PDF Link:', pdfLink.substring(0, 80) + '...');
    console.log('📧 ⚠️ Token expires in 24 hours');

    // EmailJS template parameters (without PDF attachment)
    const templateParams = {
      to_email: toEmail,
      reply_to: fromEmail || toEmail,
      from_name: fromEmail || 'מערכת הצעות מחיר',
      customer_name: quoteDetails.customerName,
      car_plate: quoteDetails.carPlate,
      quote_number: quoteDetails.quoteNumber,
      quote_amount: quoteDetails.quoteAmount,
      pdf_link: pdfLink, // Link to view PDF instead of attachment
      view_quote_url: pdfLink, // Alternative variable name in case pdf_link doesn't work
    };

    console.log('📧 Template params:', templateParams);
    console.log('📧 IMPORTANT - Copy this link and verify it works:', pdfLink);

    // Send email
    console.log('📧 Calling emailjs.send...');
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email sent successfully:', response);
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error text:', error?.text);
    console.error('❌ Error status:', error?.status);
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to send email: ${error?.text || error?.message || 'Unknown error'}`);
  }
}
