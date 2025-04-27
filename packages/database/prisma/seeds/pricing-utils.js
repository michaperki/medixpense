// packages/database/prisma/seeds/pricing-utils.js

/**
 * Generate a realistic procedure price based on the type of procedure
 * Also includes market average price for comparison
 */
function generateProcedurePrice(template) {
  // Base price ranges by procedure name keywords (simplified)
  const priceRanges = {
    'mri': { min: 600, max: 1200 },
    'ct': { min: 500, max: 1000 },
    'x-ray': { min: 100, max: 300 },
    'ultrasound': { min: 200, max: 500 },
    'physical': { min: 100, max: 250 },
    'consultation': { min: 75, max: 180 },
    'therapy': { min: 90, max: 175 },
    'screening': { min: 120, max: 350 },
    'injection': { min: 80, max: 200 },
    'biopsy': { min: 300, max: 800 },
    'surgery': { min: 1500, max: 5000 },
    'default': { min: 150, max: 500 }
  };
  
  // Find matching price range
  let range = priceRanges.default;
  const nameLower = template.name.toLowerCase();
  
  for (const [keyword, values] of Object.entries(priceRanges)) {
    if (nameLower.includes(keyword)) {
      range = values;
      break;
    }
  }
  
  // Generate random price within range
  const price = Math.round(Math.random() * (range.max - range.min) + range.min);
  
  // Generate market average price (10-40% higher than our price)
  const marketPriceMultiplier = 1 + (Math.random() * 0.3 + 0.1);
  const averageMarketPrice = Math.round(price * marketPriceMultiplier);
  
  // Comments explaining any special conditions or preparation required
  const comments = generateComments(template);
  
  return { 
    price, 
    averageMarketPrice,
    comments 
  };
}

/**
 * Generate realistic comments for procedure price
 */
function generateComments(template) {
  const nameLower = template.name.toLowerCase();
  
  // Some common procedure comments
  const commentOptions = [
    "Standard procedure. No special preparation required.",
    "Fasting required 8 hours prior to procedure.",
    "Please bring prior imaging records if available.",
    "Requires physician referral.",
    "Insurance pre-authorization recommended.",
    "Follow-up consultation included in price.",
    "Multiple sessions may be required for full treatment.",
    "Price includes facility fee and basic supplies.",
    "Weekend appointments available at additional cost.",
    "Sedation available upon request at additional cost."
  ];
  
  // Special comments for certain procedures
  if (nameLower.includes('mri') || nameLower.includes('ct')) {
    return "Please notify us of any implants or metal objects. Contrast option available.";
  } else if (nameLower.includes('ultrasound')) {
    return "Full bladder may be required. Please drink 32oz of water 1 hour before appointment.";
  } else if (nameLower.includes('surgery')) {
    return "Consultation and one follow-up visit included. Pre-op labs not included in price.";
  } else if (nameLower.includes('biopsy')) {
    return "Results typically available within 3-5 business days. Follow-up consultation recommended.";
  }
  
  // Random comment for other procedures
  return commentOptions[Math.floor(Math.random() * commentOptions.length)];
}

module.exports = {
  generateProcedurePrice
};
