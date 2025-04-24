// packages/database/prisma/seeds/pricing-utils.js

/**
 * Generate realistic procedure prices based on procedure type
 * 
 * @param {string} locationId - The location ID for the price
 * @param {Object} template - The procedure template object
 * @returns {Object} - Price and comments
 */
function generateProcedurePrice(template) {
  const name = template.name.toLowerCase();
  
  // MRI procedures should be expensive
  if (name.includes('mri')) {
    return {
      price: Math.floor(Math.random() * 1000) + 1000, // $1000-2000
      comments: 'Price may vary based on insurance coverage'
    };
  }
  
  // CT scans slightly less expensive
  if (name.includes('ct scan') || name.includes('computed tomography')) {
    return {
      price: Math.floor(Math.random() * 500) + 500, // $500-1000
      comments: 'Price includes radiologist reading'
    };
  }
  
  // X-rays more affordable
  if (name.includes('x-ray')) {
    return {
      price: Math.floor(Math.random() * 150) + 100, // $100-250
      comments: 'Additional views may incur extra charges'
    };
  }
  
  // Lab tests
  if (name.includes('blood') || name.includes('panel') || name.includes('test') || name.includes('count')) {
    return {
      price: Math.floor(Math.random() * 80) + 40, // $40-120
      comments: 'Fasting may be required'
    };
  }
  
  // Default for other procedures
  return {
    price: Math.floor(Math.random() * 300) + 100, // $100-400
    comments: 'Standard rate'
  };
}

module.exports = { generateProcedurePrice };
