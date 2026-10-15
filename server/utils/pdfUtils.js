const path = require('path');
const fs = require('fs');

// Function to add Global Image logo to PDF
const addLogoToPDF = (doc, x = 20, y = 20, width = 30, height = 30) => {
  try {
    console.log('Attempting to add logo to PDF...');
    console.log('Current directory:', __dirname);
    
    // Path to the logo file in the client public directory
    const logoPath = path.join(__dirname, '../../client/public/GI_logo.png');
    console.log('Logo path:', logoPath);
    
    // Check if logo file exists
    if (fs.existsSync(logoPath)) {
      console.log('Logo file found, reading...');
      const logoBuffer = fs.readFileSync(logoPath);
      doc.image(logoBuffer, x, y, { width, height });
      console.log('Logo added to PDF successfully');
    } else {
      console.warn('Logo file not found at:', logoPath);
      // Try alternative path
      const altLogoPath = path.join(__dirname, '../../client/src/GI_logo.png');
      console.log('Trying alternative path:', altLogoPath);
      if (fs.existsSync(altLogoPath)) {
        const logoBuffer = fs.readFileSync(altLogoPath);
        doc.image(logoBuffer, x, y, { width, height });
        console.log('Logo added to PDF successfully from alternative path');
      } else {
        console.warn('Logo file not found at alternative path:', altLogoPath);
        console.log('Continuing without logo...');
      }
    }
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
    console.log('Continuing without logo due to error...');
    // If logo fails to load, continue without it
  }
};

// Function to create PDF header with logo and title
const createPDFHeader = (doc, title, subtitle = null) => {
  try {
    console.log('Creating PDF header with title:', title);
    
    // Get page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    
    // Add logo in top-left corner (larger size)
    addLogoToPDF(doc, 20, 20, 70, 70);
    
    // Set margins for content area (adjusted for larger logo)
    const leftMargin = 100; // Increased to accommodate larger logo
    const rightMargin = 20;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Position elements (adjusted for larger logo)
    let currentY = 55; // Increased to align with larger logo
    
    // Add title centered
    doc.fontSize(20);
    const titleWidth = doc.widthOfString(title);
    const titleX = leftMargin + (contentWidth - titleWidth) / 2;
    doc.text(title, titleX, currentY);
    currentY += 30;
    
    // Add subtitle if provided (centered below title)
    if (subtitle) {
      doc.fontSize(12);
      const subtitleWidth = doc.widthOfString(subtitle);
      const subtitleX = leftMargin + (contentWidth - subtitleWidth) / 2;
      doc.text(subtitle, subtitleX, currentY);
      currentY += 25;
    }
    
    // Add generation date (centered)
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const dateText = `Generated on: ${currentDate}`;
    doc.fontSize(10);
    const dateWidth = doc.widthOfString(dateText);
    const dateX = leftMargin + (contentWidth - dateWidth) / 2;
    doc.text(dateText, dateX, currentY);
    currentY += 30;
    
    // Add a line separator
    doc.moveTo(leftMargin, currentY).lineTo(pageWidth - rightMargin, currentY).stroke();
    currentY += 25;
    
    console.log('PDF header created successfully');
    
    // Return the Y position after header for content positioning
    return currentY;
  } catch (error) {
    console.error('Error creating PDF header:', error);
    // Fallback: create simple header without logo
    console.log('Using fallback header without logo');
    
    const pageWidth = doc.page.width;
    const leftMargin = 20;
    const rightMargin = 20;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    let currentY = 35;
    
    // Add title centered
    doc.fontSize(20);
    const titleWidth = doc.widthOfString(title);
    const titleX = leftMargin + (contentWidth - titleWidth) / 2;
    doc.text(title, titleX, currentY);
    currentY += 30;
    
    if (subtitle) {
      doc.fontSize(12);
      const subtitleWidth = doc.widthOfString(subtitle);
      const subtitleX = leftMargin + (contentWidth - subtitleWidth) / 2;
      doc.text(subtitle, subtitleX, currentY);
      currentY += 25;
    }
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const dateText = `Generated on: ${currentDate}`;
    doc.fontSize(10);
    const dateWidth = doc.widthOfString(dateText);
    const dateX = leftMargin + (contentWidth - dateWidth) / 2;
    doc.text(dateText, dateX, currentY);
    currentY += 30;
    
    // Add a line separator
    doc.moveTo(leftMargin, currentY).lineTo(pageWidth - rightMargin, currentY).stroke();
    currentY += 25;
    
    return currentY;
  }
};

module.exports = {
  addLogoToPDF,
  createPDFHeader
};
