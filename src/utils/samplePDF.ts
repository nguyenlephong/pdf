import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createSamplePDF(): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Add a page
  const page = pdfDoc.addPage([612, 792]); // Standard letter size

  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Add title
  page.drawText('Hợp đồng lao động', {
    x: 50,
    y: 750,
    size: 24,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Add some sample content
  const content = [
    'Công ty: ..................................................................',
    'Địa chỉ: ..................................................................',
    'Điện thoại: ...............................................................',
    '',
    'Nhân viên: ...............................................................',
    'Ngày sinh: ...............................................................',
    'CMND/CCCD: ...............................................................',
    'Địa chỉ: ..................................................................',
    '',
    'Vị trí công việc: ........................................................',
    'Mức lương: ...............................................................',
    'Ngày bắt đầu: ............................................................',
    'Ngày kết thúc: ...........................................................',
    '',
    'Điều khoản hợp đồng:',
    '1. Nhân viên cam kết thực hiện đầy đủ các nhiệm vụ được giao.',
    '2. Công ty cam kết trả lương đúng hạn theo thỏa thuận.',
    '3. Hợp đồng có thể được gia hạn hoặc chấm dứt theo quy định pháp luật.',
    '',
    'Chữ ký nhân viên: ............................  Chữ ký đại diện công ty: ............................',
    '',
    'Ngày: .......... / .......... / ..........'
  ];

  let yPosition = 700;
  content.forEach((line, index) => {
    if (line.trim() === '') {
      yPosition -= 20;
      return;
    }
    
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
