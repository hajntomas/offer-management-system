// frontend/src/services/pdfService.ts
// Služba pro generování PDF dokumentů z nabídek

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Offer, Product } from './api';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PdfOptions {
  companyLogo?: string;
  companyName?: string;
  companyAddress?: string;
  companyContact?: string;
  companyTaxId?: string;
  companyBankAccount?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  primaryColor?: string;
  secondaryColor?: string;
  includePaymentInfo?: boolean;
  includeFooter?: boolean;
  footerText?: string;
  termsAndConditions?: string;
  language?: 'cs' | 'en';
  filename?: string;
}

export class PdfService {
  private defaultOptions: PdfOptions = {
    companyName: 'Vaše Společnost s.r.o.',
    companyAddress: 'Václavské náměstí 123, 110 00 Praha 1',
    companyContact: 'IČ: 12345678, DIČ: CZ12345678',
    companyEmail: 'info@vase-spolecnost.cz',
    companyPhone: '+420 123 456 789',
    companyWebsite: 'www.vase-spolecnost.cz',
    primaryColor: '#3b82f6',
    secondaryColor: '#f3f4f6',
    includePaymentInfo: true,
    includeFooter: true,
    footerText: 'Děkujeme za Vaši důvěru.',
    termsAndConditions: 'Nabídka je platná 30 dní od data vystavení. Všechny ceny jsou uvedeny v Kč.',
    language: 'cs',
    filename: 'nabidka.pdf'
  };
  
  // Texty podle jazyků
  private translations = {
    cs: {
      offer: 'NABÍDKA',
      offerNumber: 'Číslo nabídky',
      date: 'Datum vystavení',
      validUntil: 'Platnost do',
      customer: 'Zákazník',
      code: 'Kód',
      product: 'Produkt',
      quantity: 'Množství',
      unitPrice: 'Cena za j.',
      totalPrice: 'Celkem',
      netAmount: 'Cena bez DPH',
      vat: 'DPH 21%',
      totalAmount: 'Cena s DPH',
      unit: 'ks',
      page: 'Strana',
      of: 'z',
      termsAndConditions: 'Podmínky a ujednání',
      paymentInfo: 'Platební údaje',
      accountNumber: 'Číslo účtu',
      variableSymbol: 'Variabilní symbol',
      contactInfo: 'Kontaktní údaje',
      thankYou: 'Děkujeme za Vaši důvěru.'
    },
    en: {
      offer: 'QUOTATION',
      offerNumber: 'Quotation Number',
      date: 'Date',
      validUntil: 'Valid Until',
      customer: 'Customer',
      code: 'Code',
      product: 'Product',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      totalPrice: 'Total Price',
      netAmount: 'Net Amount',
      vat: 'VAT 21%',
      totalAmount: 'Total Amount',
      unit: 'pcs',
      page: 'Page',
      of: 'of',
      termsAndConditions: 'Terms and Conditions',
      paymentInfo: 'Payment Information',
      accountNumber: 'Account Number',
      variableSymbol: 'Variable Symbol',
      contactInfo: 'Contact Information',
      thankYou: 'Thank you for your business.'
    }
  };
  
  /**
   * Generuje PDF dokument z nabídky
   */
  public generateOfferPdf(offer: Offer, products: Product[], options?: Partial<PdfOptions>): string {
    // Sloučení defaultních a uživatelských nastavení
    const settings = { ...this.defaultOptions, ...options };
    
    // Vytvoření nového PDF dokumentu
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Přidání fontu pro české znaky
    doc.addFont('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap', 'Roboto', 'normal');
    doc.addFont('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap', 'Roboto', 'bold');
    
    // Získání textů podle zvoleného jazyka
    const texts = settings.language === 'en' ? this.translations.en : this.translations.cs;
    
    // Přidání nadpisu
    this.addHeader(doc, offer, texts, settings);
    
    // Přidání informací o zákazníkovi
    this.addCustomerInfo(doc, offer, texts, settings);
    
    // Přidání tabulky s položkami
    this.addItemsTable(doc, offer, products, texts, settings);
    
    // Přidání souhrnů
    this.addSummary(doc, offer, texts, settings);
    
    // Přidání podmínek a platebních informací
    this.addFooterInfo(doc, texts, settings);
    
    // Přidání zápatí
    if (settings.includeFooter) {
      this.addFooter(doc, texts, settings);
    }
    
    // Vrácení PDF jako datovou URL
    return doc.output('datauristring');
  }
  
  /**
   * Přímé stažení PDF
   */
  public downloadOfferPdf(offer: Offer, products: Product[], options?: Partial<PdfOptions>): void {
    // Sloučení defaultních a uživatelských nastavení
    const settings = { ...this.defaultOptions, ...options };
    
    // Vytvoření nového PDF dokumentu
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Získání textů podle zvoleného jazyka
    const texts = settings.language === 'en' ? this.translations.en : this.translations.cs;
    
    // Přidání nadpisu
    this.addHeader(doc, offer, texts, settings);
    
    // Přidání informací o zákazníkovi
    this.addCustomerInfo(doc, offer, texts, settings);
    
    // Přidání tabulky s položkami
    this.addItemsTable(doc, offer, products, texts, settings);
    
    // Přidání souhrnů
    this.addSummary(doc, offer, texts, settings);
    
    // Přidání podmínek a platebních informací
    this.addFooterInfo(doc, texts, settings);
    
    // Přidání zápatí
    if (settings.includeFooter) {
      this.addFooter(doc, texts, settings);
    }
    
    // Vygenerování názvu souboru
    const filename = settings.filename || `nabidka-${offer.cislo}.pdf`;
    
    // Stažení PDF
    doc.save(filename);
  }
  
  /**
   * Přidání hlavičky dokumentu
   */
  private addHeader(doc: jsPDF, offer: Offer, texts: any, settings: PdfOptions): void {
    // Logo (pokud existuje)
    if (settings.companyLogo) {
      try {
        doc.addImage(settings.companyLogo, 'JPEG', 10, 10, 50, 20);
      } catch (error) {
        console.warn('Nepodařilo se přidat logo:', error);
      }
    }
    
    // Informace o společnosti
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(settings.primaryColor!);
    doc.text(settings.companyName!, 10, settings.companyLogo ? 40 : 20);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(settings.companyAddress!, 10, settings.companyLogo ? 46 : 26);
    doc.text(settings.companyContact!, 10, settings.companyLogo ? 50 : 30);
    
    // Nadpis nabídky
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(settings.primaryColor!);
    doc.text(texts.offer, 140, 20);
    
    // Informace o nabídce
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${texts.offerNumber}:`, 140, 30);
    doc.text(`${texts.date}:`, 140, 36);
    doc.text(`${texts.validUntil}:`, 140, 42);
    
    doc.setFont('Roboto', 'normal');
    doc.text(offer.cislo, 180, 30);
    doc.text(new Date(offer.datum_vytvoreni).toLocaleDateString(settings.language === 'en' ? 'en-US' : 'cs-CZ'), 180, 36);
    doc.text(new Date(offer.platnost_do).toLocaleDateString(settings.language === 'en' ? 'en-US' : 'cs-CZ'), 180, 42);
    
    // Oddělovací čára
    doc.setDrawColor(settings.primaryColor!);
    doc.setLineWidth(0.5);
    doc.line(10, 55, 200, 55);
  }
  
  /**
   * Přidání informací o zákazníkovi
   */
  private addCustomerInfo(doc: jsPDF, offer: Offer, texts: any, settings: PdfOptions): void {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${texts.customer}:`, 10, 65);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(11);
    doc.text(offer.zakaznik, 10, 72);
  }
  
  /**
   * Přidání tabulky s položkami
   */
  private addItemsTable(doc: jsPDF, offer: Offer, products: Product[], texts: any, settings: PdfOptions): void {
    // Příprava dat pro tabulku
    const tableData = offer.polozky.map(item => {
      const product = products.find(p => p.id === item.produkt_id || p.kod === item.produkt_id);
      return [
        product?.kod || item.produkt_id,
        product?.nazev || 'Neznámý produkt',
        `${item.pocet} ${texts.unit}`,
        this.formatPrice(item.cena_bez_dph),
        this.formatPrice(item.cena_bez_dph * item.pocet)
      ];
    });
    
    // Nastavení hlavičky tabulky
    const headers = [
      [texts.code, texts.product, texts.quantity, texts.unitPrice, texts.totalPrice]
    ];
    
    // Vykreslení tabulky
    doc.autoTable({
      startY: 80,
      head: headers,
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: settings.primaryColor!,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: settings.secondaryColor!
      },
      columnStyles: {
        0: { cellWidth: 25 },    // Kód
        1: { cellWidth: 80 },    // Produkt
        2: { cellWidth: 20 },    // Množství
        3: { cellWidth: 30 },    // Cena za jednotku
        4: { cellWidth: 30 }     // Celkem
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data) => {
        // Přidání číslování stránek
        const pageNumber = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${texts.page} ${pageNumber} ${texts.of} ${doc.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.getHeight() - 10
        );
      }
    });
  }
  
  /**
   * Přidání souhrnů
   */
  private addSummary(doc: jsPDF, offer: Offer, texts: any, settings: PdfOptions): void {
    // Souhrn se přidá na poslední stránku tabulky
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Výpočet DPH
    const vat = offer.celkova_cena_s_dph - offer.celkova_cena_bez_dph;
    
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Celková cena bez DPH
    doc.text(texts.netAmount, 140, finalY);
    doc.text(this.formatPrice(offer.celkova_cena_bez_dph), 190, finalY, { align: 'right' });
    
    // DPH
    doc.text(texts.vat, 140, finalY + 6);
    doc.text(this.formatPrice(vat), 190, finalY + 6, { align: 'right' });
    
    // Celková cena s DPH
    doc.setFillColor(settings.primaryColor!);
    doc.setDrawColor(settings.primaryColor!);
    doc.rect(130, finalY + 10, 70, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(texts.totalAmount, 140, finalY + 16);
    doc.text(this.formatPrice(offer.celkova_cena_s_dph), 190, finalY + 16, { align: 'right' });
  }
  
  /**
   * Přidání podmínek a platebních informací
   */
  private addFooterInfo(doc: jsPDF, texts: any, settings: PdfOptions): void {
    // Zjištění Y pozice pro začátek podmínek
    const lastTable = (doc as any).lastAutoTable;
    const finalY = lastTable.finalY + 30;
    
    // Podmínky
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(texts.termsAndConditions, 10, finalY);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text(settings.termsAndConditions || '', 10, finalY + 6, {
      maxWidth: 180,
      lineHeightFactor: 1.2
    });
    
    // Platební informace (pokud jsou požadovány)
    if (settings.includePaymentInfo) {
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(11);
      doc.text(texts.paymentInfo, 10, finalY + 25);
      
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(9);
      
      if (settings.companyBankAccount) {
        doc.text(`${texts.accountNumber}: ${settings.companyBankAccount}`, 10, finalY + 32);
      }
      
      // Variabilní symbol = číslo nabídky bez písmen
      doc.text(`${texts.variableSymbol}: ${this.getNumericPart(new Date().getFullYear().toString())}`, 10, finalY + 38);
    }
    
    // Kontaktní informace
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(11);
    doc.text(texts.contactInfo, 110, finalY + 25);
    
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    if (settings.companyPhone) {
      doc.text(settings.companyPhone, 110, finalY + 32);
    }
    if (settings.companyEmail) {
      doc.text(settings.companyEmail, 110, finalY + 38);
    }
    if (settings.companyWebsite) {
      doc.text(settings.companyWebsite, 110, finalY + 44);
    }
  }
  
  /**
   * Přidání zápatí
   */
  private addFooter(doc: jsPDF, texts: any, settings: PdfOptions): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Zápatí s poděkováním
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        settings.footerText || texts.thankYou,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
      );
      
      // Spodní čára
      doc.setDrawColor(settings.primaryColor!);
      doc.setLineWidth(0.5);
      doc.line(10, doc.internal.pageSize.getHeight() - 10, 200, doc.internal.pageSize.getHeight() - 10);
    }
  }
  
  /**
   * Formátování ceny
   */
  private formatPrice(price: number): string {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
  
  /**
   * Získání číselné části z řetězce
   */
  private getNumericPart(str: string): string {
    return str.replace(/\D/g, '');
  }
}

// Export výchozí instance služby
export const pdfService = new PdfService();
export default pdfService;
