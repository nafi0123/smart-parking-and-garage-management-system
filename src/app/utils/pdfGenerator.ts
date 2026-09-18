import PDFDocument from 'pdfkit';

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
 * Generate PDF Invoice Buffer
 */
export const generateInvoicePDF = (data: IInvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Primary Colors
      const primaryColor = '#1e3a8a'; // Deep Navy
      const secondaryColor = '#3b82f6'; // Bright Blue
      const textColor = '#1f2937';
      const grayColor = '#6b7280';
      const lightBg = '#f3f4f6';

      // 1. Header & Branding
      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('SMART PARKING SYSTEM', 50, 50);

      doc
        .fillColor(grayColor)
        .fontSize(10)
        .font('Helvetica')
        .text('Smart Garage & Parking Management Platform', 50, 75)
        .text('Support: support@smartparking.com | Web: smartparking.com', 50, 88);

      // Invoice Title
      doc
        .fillColor(primaryColor)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('PARKING RECEIPT / INVOICE', 350, 50, { align: 'right' });

      const invoiceNumber = `INV-${data.bookingId.slice(0, 8).toUpperCase()}`;
      doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica')
        .text(`Invoice No: ${invoiceNumber}`, 350, 72, { align: 'right' })
        .text(`Date: ${new Date().toLocaleDateString('en-US')}`, 350, 86, { align: 'right' })
        .text(`Status: ${data.paymentStatus.toUpperCase()}`, 350, 100, { align: 'right' });

      // Divider Line
      doc.moveTo(50, 120).lineTo(545, 120).strokeColor(secondaryColor).lineWidth(1.5).stroke();

      // 2. Info Boxes (Customer & Garage)
      // Customer Info
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('BILLED TO (DRIVER):', 50, 135);

      doc
        .fillColor(textColor)
        .fontSize(10)
        .font('Helvetica')
        .text(data.customerName, 50, 152)
        .text(data.customerEmail, 50, 166)
        .text(data.customerPhone || 'Phone: N/A', 50, 180)
        .text(`Vehicle No: ${data.vehicleNumber || 'N/A'}`, 50, 194);

      // Garage Info
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('GARAGE LOCATION:', 320, 135);

      doc
        .fillColor(textColor)
        .fontSize(10)
        .font('Helvetica')
        .text(data.garageName, 320, 152)
        .text(data.garageAddress, 320, 166)
        .text(`Area/City: ${data.garageLocation || 'Dhaka'}`, 320, 180)
        .text(`Rate: ৳${data.pricePerHour}/hour`, 320, 194);

      // Divider Line
      doc.moveTo(50, 220).lineTo(545, 220).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // 3. Booking Schedule
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('PARKING SCHEDULE', 50, 235);

      const startStr = new Date(data.startTime).toLocaleString('en-US');
      const endStr = new Date(data.endTime).toLocaleString('en-US');

      doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica')
        .text(`Start Time: ${startStr}`, 50, 252)
        .text(`End Time:   ${endStr}`, 50, 266)
        .text(`Total Duration: ${data.durationHours} Hour(s)`, 320, 252)
        .text(`Transaction ID: ${data.transactionId || 'N/A'}`, 320, 266);

      // 4. Itemized Table
      const tableTop = 295;
      doc.rect(50, tableTop, 495, 22).fill(lightBg);

      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Item Description', 60, tableTop + 6)
        .text('Rate / Hr', 280, tableTop + 6, { width: 70, align: 'right' })
        .text('Hours', 370, tableTop + 6, { width: 50, align: 'right' })
        .text('Amount (BDT)', 440, tableTop + 6, { width: 95, align: 'right' });

      // Table Row
      const rowTop = tableTop + 28;
      doc
        .fillColor(textColor)
        .fontSize(10)
        .font('Helvetica')
        .text(`Parking Slot Reservation (${data.garageName})`, 60, rowTop)
        .text(`৳${data.pricePerHour.toFixed(2)}`, 280, rowTop, { width: 70, align: 'right' })
        .text(`${data.durationHours}`, 370, rowTop, { width: 50, align: 'right' })
        .text(`৳${data.paidAmount.toFixed(2)}`, 440, rowTop, { width: 95, align: 'right' });

      // Divider Line
      doc
        .moveTo(50, rowTop + 20)
        .lineTo(545, rowTop + 20)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();

      // Total Breakdown
      const subtotalTop = rowTop + 35;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Subtotal:', 350, subtotalTop, { width: 90, align: 'right' })
        .text(`৳${data.paidAmount.toFixed(2)}`, 440, subtotalTop, { width: 95, align: 'right' });

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('Total Paid:', 350, subtotalTop + 20, { width: 90, align: 'right' })
        .text(`৳${data.paidAmount.toFixed(2)}`, 440, subtotalTop + 20, {
          width: 95,
          align: 'right',
        });

      // 5. Payment Badge / Verification Stamp
      doc.rect(50, subtotalTop + 5, 200, 45).fillAndStroke('#ecfdf5', '#10b981');
      doc
        .fillColor('#065f46')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PAYMENT VERIFIED', 60, subtotalTop + 14)
        .fontSize(8)
        .font('Helvetica')
        .text(`Status: ${data.paymentStatus} | Method: SSLCommerz Gateway`, 60, subtotalTop + 30);

      // 6. Footer & Terms
      const footerTop = 700;
      doc.moveTo(50, footerTop).lineTo(545, footerTop).strokeColor('#e5e7eb').lineWidth(1).stroke();

      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica')
        .text('Thank you for choosing Smart Parking System!', 50, footerTop + 10, {
          align: 'center',
        })
        .text(
          'This is a computer-generated invoice and does not require a physical signature.',
          50,
          footerTop + 22,
          { align: 'center' },
        )
        .text(
          'Cancellation & Refund Policy: Cancellations are allowed up to 1 hour before scheduled start time.',
          50,
          footerTop + 34,
          { align: 'center' },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
