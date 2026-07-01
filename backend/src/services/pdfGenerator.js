const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  static async generateCorrespondence(correspondence) {
    return new Promise((resolve, reject) => {
      try {
        const dir = path.join(__dirname, '../../uploads/correspondence');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const cleanReference = correspondence.reference.replace(/[\/\\]/g, '-');
        const filename = `correspondance-${cleanReference}-${Date.now()}.pdf`;
        const filepath = path.join(dir, filename);

        // ============================================
        // CHARGER LA POLICE ARABE
        // ============================================
        const fontsDir = path.join(__dirname, '../fonts');
        const arabicFontPath = path.join(fontsDir, 'NotoSansArabic-Regular.ttf');
        const arabicBoldFontPath = path.join(fontsDir, 'NotoSansArabic-Bold.ttf');

        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          font: 'Helvetica',
        });

        // Enregistrer la police arabe si elle existe
        let hasArabicFont = false;
        if (fs.existsSync(arabicFontPath)) {
          doc.registerFont('NotoSansArabic', arabicFontPath);
          hasArabicFont = true;
        }
        if (fs.existsSync(arabicBoldFontPath)) {
          doc.registerFont('NotoSansArabic-Bold', arabicBoldFontPath);
        }

        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        const isFrench = correspondence.language === 'fr';
        const alignment = isFrench ? 'left' : 'right';
        const arabicFont = hasArabicFont ? 'NotoSansArabic' : 'Helvetica';
        const arabicBoldFont = hasArabicFont ? 'NotoSansArabic-Bold' : 'Helvetica-Bold';

        // ============================================
        // EN-TÊTE
        // ============================================
        if (isFrench) {
          // Version française (LTR)
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .fillColor('#1a5b3e')
             .text('RÉPUBLIQUE TUNISIENNE', { align: 'center' })
             .fontSize(10)
             .font('Helvetica')
             .fillColor('#000000')
             .text('Ministère des Affaires Sociales', { align: 'center' })
             .text('Caisse Nationale de Retraite et de Prévoyance Sociale', { align: 'center' })
             .text('Bureau de la Communication et de la Coopération Internationale', { align: 'center' })
             .moveDown(1);
        } else {
          // Version arabe (RTL) avec police arabe
          doc.fontSize(12)
             .font(arabicBoldFont)
             .fillColor('#1a5b3e')
             .text('الجمهورية التونسية', { align: 'center' })
             .fontSize(10)
             .font(arabicFont)
             .fillColor('#000000')
             .text('وزارة الشؤون الاجتماعية', { align: 'center' })
             .text('الصندوق الوطني للتقاعد والضمان الاجتماعي', { align: 'center' })
             .text('مكتب الاتصال والتعاون الدولي', { align: 'center' })
             .moveDown(1);
        }

        // Ligne de séparation
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .strokeColor('#1a5b3e')
           .lineWidth(1)
           .stroke()
           .moveDown(0.5);

        // ============================================
        // RÉFÉRENCE ET DATE
        // ============================================
        const date = new Date().toLocaleDateString(isFrench ? 'fr-FR' : 'fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        if (isFrench) {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(`Réf: ${correspondence.reference}`, { align: 'left' })
             .text(`Date: ${date}`, { align: 'left' })
             .moveDown(1);
        } else {
          doc.fontSize(10)
             .font(arabicBoldFont)
             .text(`المرجع: ${correspondence.reference}`, { align: 'right' })
             .text(`التاريخ: ${date}`, { align: 'right' })
             .moveDown(1);
        }

        // ============================================
        // DESTINATAIRE
        // ============================================
        if (correspondence.recipient) {
          doc.fontSize(10)
             .font(isFrench ? 'Helvetica-Bold' : arabicBoldFont)
             .text(isFrench ? 'À' : 'إلى', { align: 'left' })
             .font(isFrench ? 'Helvetica' : arabicFont)
             .text(correspondence.recipient, { align: 'left' });
          
          if (correspondence.recipient_position) {
            doc.text(correspondence.recipient_position, { align: 'left' });
          }
          doc.moveDown(1);
        }

        // ============================================
        // OBJET
        // ============================================
        if (isFrench) {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text(`Objet: ${correspondence.title}`, { 
               align: 'left',
               underline: true,
             })
             .moveDown(1);
        } else {
          doc.fontSize(12)
             .font(arabicBoldFont)
             .text(`الموضوع: ${correspondence.title}`, { 
               align: 'right',
               underline: true,
             })
             .moveDown(1);
        }

        // ============================================
        // CONTENU
        // ============================================
        doc.fontSize(11)
           .font(isFrench ? 'Helvetica' : arabicFont)
           .text(correspondence.content, {
             align: alignment,
             lineGap: 5,
             paragraphGap: 10,
             width: 500,
           })
           .moveDown(2);

        // ============================================
        // FORMULE DE POLITESSE
        // ============================================
        if (isFrench) {
          doc.fontSize(10)
             .font('Helvetica')
             .text('Veuillez agréer, Monsieur, l\'expression de mes salutations distinguées.', {
               align: 'left',
             })
             .moveDown(3);
        } else {
          doc.fontSize(10)
             .font(arabicFont)
             .text('وتفضلوا بقبول فائق الاحترام والتقدير', {
               align: 'right',
             })
             .moveDown(3);
        }

        // ============================================
        // SIGNATURE
        // ============================================
        if (isFrench) {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text('Le Président Directeur Général', { 
               align: 'left',
               underline: true,
             })
             .moveDown(0.5)
             .font('Helvetica')
             .text('.........................................', { align: 'left' })
             .moveDown(0.5)
             .text('Cachet et signature', { 
               align: 'left',
               fontSize: 9,
               color: '#666666',
             });
        } else {
          doc.fontSize(10)
             .font(arabicBoldFont)
             .text('الرئيس المدير العام', { 
               align: 'right',
               underline: true,
             })
             .moveDown(0.5)
             .font(arabicFont)
             .text('.........................................', { align: 'right' })
             .moveDown(0.5)
             .text('الختم والتوقيع', { 
               align: 'right',
               fontSize: 9,
               color: '#666666',
             });
        }
        doc.moveDown(2);

        // ============================================
        // PIED DE PAGE
        // ============================================
        doc.fontSize(8)
           .font(isFrench ? 'Helvetica' : arabicFont)
           .fillColor('#666666')
           .text('TASK TAB - Plateforme de Pilotage des Projets et des Activités', {
             align: 'center',
           })
           .text(`Document généré le ${date} - ${correspondence.reference}`, { 
             align: 'center',
           })
           .text('© CNRPS - Tous droits réservés', { 
             align: 'center',
           });

        doc.end();

        writeStream.on('finish', () => resolve(filepath));
        writeStream.on('error', reject);
        doc.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFGenerator;