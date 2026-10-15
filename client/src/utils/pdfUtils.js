import logo from '../GI_logo.png';

// Function to add Global Image logo to PDF
export const addLogoToPDF = async (doc, x = 20, y = 20, width = 30, height = 30) => {
  try {
    // Convert logo to base64
    const response = await fetch(logo);
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = function() {
        try {
          const base64 = reader.result.split(',')[1];
          doc.addImage(base64, 'PNG', x, y, width, height);
          console.log('Logo added to PDF successfully');
          resolve();
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
          // Don't reject, just continue without logo
          resolve();
        }
      };
      reader.onerror = () => {
        console.error('Error reading logo file');
        // Don't reject, just continue without logo
        resolve();
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo for PDF:', error);
    // If logo fails to load, continue without it
    return Promise.resolve();
  }
};

// Function to create PDF header with logo and title
export const createPDFHeader = async (doc, title, subtitle = null) => {
  // Add logo in top-left corner
  await addLogoToPDF(doc, 20, 20, 25, 25);
  
  // Add title on the right side of logo
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210);
  doc.text(title, 55, 35);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 55, 45);
  }
  
  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 55, 55);
  
  // Return the Y position after header for content positioning
  return 70;
};
