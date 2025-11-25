/**
 * Production-Ready PDF Generator
 * Uses Puppeteer to convert HTML reports to professional PDF files
 */

// Dynamic import to avoid browser compatibility issues
// import * as puppeteer from 'puppeteer';

export interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  landscape?: boolean;
}

export interface PDFResult {
  success: boolean;
  pdfBuffer?: Buffer;
  htmlContent?: string;
  error?: string;
}

export class PDFGenerator {
  private static browser: any = null;

  /**
   * Initialize the browser instance
   */
  private static async getBrowser(): Promise<any> {
    if (!this.browser) {
      const puppeteer = await import('puppeteer');
      this.browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from HTML content
   */
  static async generatePDF(htmlContent: string, options: PDFOptions = {}): Promise<PDFResult> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Set content and wait for it to load
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Configure PDF options
      const pdfOptions: any = {
        format: options.format || 'A4',
        margin: {
          top: options.margin?.top || '20mm',
          right: options.margin?.right || '20mm',
          bottom: options.margin?.bottom || '20mm',
          left: options.margin?.left || '20mm'
        },
        printBackground: options.printBackground !== false,
        preferCSSPageSize: options.preferCSSPageSize || false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        landscape: options.landscape || false
      };

      // Add header/footer if specified
      if (options.headerTemplate) {
        pdfOptions.headerTemplate = options.headerTemplate;
      }
      if (options.footerTemplate) {
        pdfOptions.footerTemplate = options.footerTemplate;
      }

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      await page.close();

      return {
        success: true,
        pdfBuffer: Buffer.from(pdfBuffer)
      };

    } catch (error) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate PDF from HTML file
   */
  static async generatePDFFromFile(htmlFilePath: string, options: PDFOptions = {}): Promise<PDFResult> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Load HTML file
      await page.goto(`file://${htmlFilePath}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Configure PDF options
      const pdfOptions: any = {
        format: options.format || 'A4',
        margin: {
          top: options.margin?.top || '20mm',
          right: options.margin?.right || '20mm',
          bottom: options.margin?.bottom || '20mm',
          left: options.margin?.left || '20mm'
        },
        printBackground: options.printBackground !== false,
        preferCSSPageSize: options.preferCSSPageSize || false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        landscape: options.landscape || false
      };

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      await page.close();

      return {
        success: true,
        pdfBuffer: Buffer.from(pdfBuffer)
      };

    } catch (error) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate PDF with custom header and footer
   */
  static async generatePDFWithHeaderFooter(
    htmlContent: string, 
    headerTemplate: string, 
    footerTemplate: string,
    options: PDFOptions = {}
  ): Promise<PDFResult> {
    return this.generatePDF(htmlContent, {
      ...options,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate
    });
  }

  /**
   * Generate executive summary PDF
   */
  static async generateExecutivePDF(htmlContent: string): Promise<PDFResult> {
    const headerTemplate = `
      <div style="font-size: 10px; padding: 10px; text-align: center; width: 100%;">
        <span style="color: #2196f3; font-weight: bold;">NeuroLint Pro</span> - Executive Summary
      </div>
    `;

    const footerTemplate = `
      <div style="font-size: 8px; padding: 10px; text-align: center; width: 100%;">
        <span>Generated on <span class="date"></span></span> | 
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    return this.generatePDFWithHeaderFooter(htmlContent, headerTemplate, footerTemplate, {
      format: 'A4',
      printBackground: true
    });
  }

  /**
   * Generate technical report PDF
   */
  static async generateTechnicalPDF(htmlContent: string): Promise<PDFResult> {
    const headerTemplate = `
      <div style="font-size: 10px; padding: 10px; text-align: center; width: 100%;">
        <span style="color: #2196f3; font-weight: bold;">NeuroLint Pro</span> - Technical Analysis Report
      </div>
    `;

    const footerTemplate = `
      <div style="font-size: 8px; padding: 10px; text-align: center; width: 100%;">
        <span>Technical Report | Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    return this.generatePDFWithHeaderFooter(htmlContent, headerTemplate, footerTemplate, {
      format: 'A4',
      printBackground: true
    });
  }

  /**
   * Generate comprehensive report PDF
   */
  static async generateComprehensivePDF(htmlContent: string): Promise<PDFResult> {
    const headerTemplate = `
      <div style="font-size: 10px; padding: 10px; text-align: center; width: 100%;">
        <span style="color: #2196f3; font-weight: bold;">NeuroLint Pro</span> - Comprehensive Analysis Report
      </div>
    `;

    const footerTemplate = `
      <div style="font-size: 8px; padding: 10px; text-align: center; width: 100%;">
        <span>Comprehensive Report | <span class="date"></span> | Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    return this.generatePDFWithHeaderFooter(htmlContent, headerTemplate, footerTemplate, {
      format: 'A4',
      printBackground: true
    });
  }

  /**
   * Close the browser instance
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get default PDF options for different report types
   */
  static getDefaultOptions(reportType: string): PDFOptions {
    switch (reportType) {
      case 'executive':
        return {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '25mm',
            right: '20mm',
            bottom: '25mm',
            left: '20mm'
          }
        };
      case 'technical':
        return {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          }
        };
      case 'comprehensive':
        return {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        };
      default:
        return {
          format: 'A4',
          printBackground: true
        };
    }
  }
}
