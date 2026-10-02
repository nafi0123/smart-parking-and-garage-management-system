import PDFDocument from 'pdfkit';
import 'pdfkit/standard-fonts/Helvetica';
import 'pdfkit/standard-fonts/HelveticaBold';

interface IInvoiceData {
  bookingId: string;
  transactionId?: string;
  paymentStatus: string;
  paidAmount: number;
  paidAt?: Date | string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  garageName: string;
  garageAddress: string;
  garageLocation?: string | null;
  vehicleNumber?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  durationHours: number;
  pricePerHour: number;
}

/**
 * Generate Clean, Professional PDF Invoice Buffer
 */
export const generateInvoicePDF = (data: IInvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Brand Palette
      const navyDark = '#0f2a6b';
      const bluePrimary = '#1e40af';
      const textMain = '#111827';
      const textMuted = '#4b5563';
      const bgLight = '#f8fafc';
      const lineBorder = '#e2e8f0';

      // 1. Top Header Banner
      doc
        .fillColor(navyDark)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PARKWISE SMART PARKING', 40, 40);

      doc
        .fillColor(textMuted)
        .fontSize(9)
        .font('Helvetica')
        .text('Central Automated Garage & Parking Network', 40, 65)
        .text('Website: smartparking.com  |  Support: support@smartparking.com', 40, 78);

      // Top Right: Invoice Header
      doc
        .fillColor(bluePrimary)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('OFFICIAL RECEIPT', 320, 40, { width: 235, align: 'right' });

      const invoiceNumber = `INV-${data.bookingId.slice(0, 8).toUpperCase()}`;
      const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      doc
        .fillColor(textMain)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Invoice No: ${invoiceNumber}`, 320, 62, { width: 235, align: 'right' });

      doc
        .fillColor(textMuted)
        .font('Helvetica')
        .text(`Issue Date: ${issueDate}`, 320, 75, { width: 235, align: 'right' })
        .text(`Status: ${data.paymentStatus.toUpperCase()}`, 320, 88, {
          width: 235,
          align: 'right',
        });

      // Top Divider Line
      doc.moveTo(40, 108).lineTo(555, 108).strokeColor(bluePrimary).lineWidth(1.5).stroke();

      // 2. Customer & Garage Facility Info (Side by Side)
      const infoTop = 120;

      // Left Box: Billed To Customer
      doc
        .fillColor(navyDark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILLED TO (CUSTOMER):', 40, infoTop);

      doc
        .fillColor(textMain)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(data.customerName || 'Valued Driver', 40, infoTop + 16, { width: 240 });

      doc
        .fillColor(textMuted)
        .font('Helvetica')
        .text(`Email: ${data.customerEmail}`, 40, infoTop + 29, { width: 240 })
        .text(`Phone: ${data.customerPhone || 'N/A'}`, 40, infoTop + 42, { width: 240 })
        .text(`Vehicle Plate: ${data.vehicleNumber || 'N/A (Standard Spot)'}`, 40, infoTop + 55, {
          width: 240,
        });

      // Right Box: Garage Facility
      doc
        .fillColor(navyDark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PARKING FACILITY:', 310, infoTop);

      doc
        .fillColor(textMain)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(data.garageName || 'Parking Facility', 310, infoTop + 16, { width: 245 });

      doc
        .fillColor(textMuted)
        .font('Helvetica')
        .text(`Address: ${data.garageAddress}`, 310, infoTop + 29, { width: 245 })
        .text(`Zone / Area: ${data.garageLocation || 'Dhaka'}`, 310, infoTop + 42, { width: 245 })
        .text(`Rate: BDT ${Number(data.pricePerHour || 0).toFixed(2)} / hour`, 310, infoTop + 55, {
          width: 245,
        });

      // Divider Line
      doc.moveTo(40, 195).lineTo(555, 195).strokeColor(lineBorder).lineWidth(1).stroke();

      // 3. Schedule & Session Summary Box
      const schedTop = 205;
      doc.roundedRect(40, schedTop, 515, 50, 4).fillAndStroke(bgLight, lineBorder);

      const startStr = new Date(data.startTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const endStr = new Date(data.endTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      doc
        .fillColor(navyDark)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PARKING SCHEDULE & SESSION:', 52, schedTop + 8);

      doc
        .fillColor(textMain)
        .fontSize(8.5)
        .font('Helvetica')
        .text(`Entry Time:   ${startStr}`, 52, schedTop + 22)
        .text(`Exit Time:    ${endStr}`, 52, schedTop + 34)
        .text(`Total Duration:  ${data.durationHours} Hour(s)`, 310, schedTop + 22)
        .text(`Transaction ID:  ${data.transactionId || 'SSL-TRX-CONFIRMED'}`, 310, schedTop + 34);

      // 4. Itemized Table
      const tableTop = 270;
      doc.rect(40, tableTop, 515, 22).fill(navyDark);

      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Item Description', 50, tableTop + 6, { width: 240 })
        .text('Rate / Hour', 290, tableTop + 6, { width: 80, align: 'right' })
        .text('Hours', 380, tableTop + 6, { width: 50, align: 'right' })
        .text('Total (BDT)', 445, tableTop + 6, { width: 100, align: 'right' });

      // Table Row
      const rowTop = tableTop + 28;
      doc
        .fillColor(textMain)
        .fontSize(9)
        .font('Helvetica')
        .text(`Parking Spot Reservation - ${data.garageName}`, 50, rowTop, { width: 240 })
        .text(`BDT ${Number(data.pricePerHour || 0).toFixed(2)}`, 290, rowTop, {
          width: 80,
          align: 'right',
        })
        .text(`${data.durationHours}`, 380, rowTop, { width: 50, align: 'right' })
        .text(`BDT ${Number(data.paidAmount || 0).toFixed(2)}`, 445, rowTop, {
          width: 100,
          align: 'right',
        });

      // Divider Below Table
      doc
        .moveTo(40, rowTop + 22)
        .lineTo(555, rowTop + 22)
        .strokeColor(lineBorder)
        .lineWidth(1)
        .stroke();

      // 5. Financial Summary & Verified Badge
      const sumTop = rowTop + 32;

      // Left: SSLCommerz Verification Stamp Box
      doc.roundedRect(40, sumTop, 250, 52, 4).fillAndStroke('#ecfdf5', '#10b981');
      doc
        .fillColor('#065f46')
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .text('PAYMENT VERIFIED (SSLCOMMERZ)', 52, sumTop + 10)
        .fontSize(8)
        .font('Helvetica')
        .text(`Status: ${data.paymentStatus.toUpperCase()}  |  Channel: SSLCommerz Payment Gateway`, 52, sumTop + 24)
        .text(`Instant slot reserved and confirmed in live garage inventory`, 52, sumTop + 36);

      // Right: Subtotal & Total
      doc
        .fillColor(textMuted)
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal:', 320, sumTop + 8, { width: 110, align: 'right' })
        .fillColor(textMain)
        .font('Helvetica-Bold')
        .text(`BDT ${Number(data.paidAmount || 0).toFixed(2)}`, 445, sumTop + 8, {
          width: 100,
          align: 'right',
        });

      doc
        .fillColor(textMuted)
        .fontSize(9)
        .font('Helvetica')
        .text('Gateway Processing:', 320, sumTop + 22, { width: 110, align: 'right' })
        .fillColor('#059669')
        .font('Helvetica-Bold')
        .text('FREE', 445, sumTop + 22, { width: 100, align: 'right' });

      doc.moveTo(350, sumTop + 36).lineTo(555, sumTop + 36).strokeColor(lineBorder).lineWidth(1).stroke();

      doc
        .fillColor(navyDark)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total Paid:', 320, sumTop + 42, { width: 110, align: 'right' })
        .fillColor(bluePrimary)
        .text(`BDT ${Number(data.paidAmount || 0).toFixed(2)}`, 445, sumTop + 42, {
          width: 100,
          align: 'right',
        });

      // 6. Security Note & Footer
      const footerTop = 720;
      doc.moveTo(40, footerTop).lineTo(555, footerTop).strokeColor(lineBorder).lineWidth(1).stroke();

      doc
        .fillColor(textMuted)
        .fontSize(7.5)
        .font('Helvetica')
        .text('Thank you for booking with ParkWise Smart Parking System!', 40, footerTop + 8, {
          align: 'center',
          width: 515,
        })
        .text(
          'This is an electronically generated official receipt. For support, contact support@smartparking.com',
          40,
          footerTop + 19,
          { align: 'center', width: 515 },
        )
        .text(
          'Cancellation Policy: Booking cancellations and instant refunds are permitted anytime prior to session completion.',
          40,
          footerTop + 30,
          { align: 'center', width: 515 },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
