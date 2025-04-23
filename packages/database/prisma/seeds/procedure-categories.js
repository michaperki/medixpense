// packages/database/prisma/seeds/procedure-categories.js
const procedureCategories = [
  {
    name: 'Diagnostic Imaging',
    description: 'Scans and imaging services',
    children: [
      {
        name: 'MRI',
        procedures: [
          { name: 'MRI Brain', description: 'Magnetic resonance imaging of the brain' },
          { name: 'MRI Lumbar Spine', description: 'Magnetic resonance imaging of the lower back' },
          { name: 'MRI Knee', description: 'Magnetic resonance imaging of the knee joint' }
        ]
      },
      {
        name: 'CT Scan',
        procedures: [
          { name: 'CT Scan - Head', description: 'Computed tomography of the head' },
          { name: 'CT Scan - Chest', description: 'Computed tomography of the chest' },
          { name: 'CT Scan - Abdomen & Pelvis', description: 'Computed tomography of the abdomen and pelvis' }
        ]
      },
      {
        name: 'X-Ray',
        procedures: [
          { name: 'X-Ray - Chest (2 views)', description: 'Two-view chest X-ray' },
          { name: 'X-Ray - Hand', description: 'X-ray imaging of the hand' },
          { name: 'X-Ray - Foot', description: 'X-ray imaging of the foot' }
        ]
      }
    ]
  },
  {
    name: 'Laboratory',
    description: 'Blood tests and other lab work',
    children: [
      {
        name: 'Blood Tests',
        procedures: [
          { name: 'Complete Blood Count (CBC)', description: 'Basic blood panel' },
          { name: 'Comprehensive Metabolic Panel', description: 'Blood chemistry test' },
          { name: 'Lipid Panel', description: 'Cholesterol test' }
        ]
      }
    ]
  },
  // Additional categories would be defined here
];

module.exports = { procedureCategories };
