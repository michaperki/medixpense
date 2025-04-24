// packages/database/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const { procedureCategories } = require('./seeds/procedure-categories')
const { createDefaultUsers, hashPassword } = require('./seeds/default-users')
const { sampleLocations } = require('./seeds/location-seeds')
const { subscriptionTiers } = require('./seeds/subscription-tiers')
const { generateProcedurePrice } = require('./seeds/pricing-utils')
const { adminSettings } = require('./seeds/admin-settings')
const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')
  
  // Clear existing data - order matters due to foreign key constraints
  console.log('Clearing existing data...')
  await prisma.procedurePrice.deleteMany({})
  await prisma.procedureTemplate.deleteMany({})
  await prisma.procedureCategory.deleteMany({})
  await prisma.location.deleteMany({})
  await prisma.providerSettings.deleteMany({})
  await prisma.provider.deleteMany({})
  await prisma.user.deleteMany({})
  
  // Get default users
  const defaultUsers = await createDefaultUsers();
  
  // Create default users and providers
  console.log('Creating default users and providers...')
  let providerUserId = null;
  let providerId = null;
  
  for (const userData of defaultUsers) {
    const { providerData, settingsData, adminSettingsData, ...user } = userData
    
    // Create the user
    console.log(`Creating user: ${user.email}`)
    const createdUser = await prisma.user.create({
      data: user
    })
    
    // Create admin settings if applicable
    if (adminSettingsData && user.role === 'ADMIN') {
      console.log(`Creating admin settings for: ${user.email}`)
      // Could create admin-specific settings table here if needed
    }
    
    // Create the provider if data exists
    if (providerData && user.role === 'PROVIDER') {
      console.log(`Creating provider for: ${user.email}`)
      
      const provider = await prisma.provider.create({
        data: {
          ...providerData,
          userId: createdUser.id
        }
      })
      
      // Store provider IDs for later use
      providerUserId = createdUser.id;
      providerId = provider.id;
      
      // Create provider settings if data exists
      if (settingsData) {
        console.log(`Creating settings for: ${user.email}`)
        await prisma.providerSettings.create({
          data: {
            ...settingsData,
            userId: createdUser.id
          }
        })
      }
    }
  }
  
  // Create sample locations for the provider
  if (providerId) {
    console.log('Creating sample locations...')
    const createdLocations = [];
    
    for (const location of sampleLocations) {
      const createdLocation = await prisma.location.create({
        data: {
          ...location,
          providerId: providerId
        }
      });
      createdLocations.push(createdLocation);
    }
    
    console.log(`Created ${createdLocations.length} locations`);
  }
  
  // Create the procedure categories and templates
  console.log('Creating procedure categories and templates...')
  const createdTemplates = [];
  
  for (const category of procedureCategories) {
    console.log(`Creating category: ${category.name}`)
    
    // Create the main category
    const mainCategory = await prisma.procedureCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug: category.name.toLowerCase().replace(/\s+/g, '-')
      }
    })
    
    // Create subcategories and their procedures
    if (category.children && category.children.length > 0) {
      for (const subcategory of category.children) {
        console.log(`Creating subcategory: ${subcategory.name}`)
        
        // Create the subcategory
        const subCategory = await prisma.procedureCategory.create({
          data: {
            name: subcategory.name,
            description: subcategory.description || '',
            parentId: mainCategory.id,
            slug: subcategory.name.toLowerCase().replace(/\s+/g, '-')
          }
        })
        
        // Create procedure templates for this subcategory
        if (subcategory.procedures && subcategory.procedures.length > 0) {
          console.log(`Creating ${subcategory.procedures.length} procedures for ${subcategory.name}`)
          
          for (const procedure of subcategory.procedures) {
            const template = await prisma.procedureTemplate.create({
              data: {
                name: procedure.name,
                description: procedure.description || '',
                categoryId: subCategory.id,
                searchTerms: procedure.name.toLowerCase().replace(/\s+/g, ',')
              }
            });
            createdTemplates.push(template);
          }
        }
      }
    }
  }
  
  console.log(`Created ${createdTemplates.length} procedure templates`);
  
  // Add procedure prices if we have locations and templates
  if (providerId) {
    console.log('Adding procedure prices...')
    
    // Get all locations for the provider
    const locations = await prisma.location.findMany({
      where: { providerId: providerId }
    });
    
    // Create procedure prices for each location and template
    let priceCount = 0;
    
    for (const location of locations) {
      // Assign prices to a subset of procedures for each location
      // This simulates the real-world scenario where not all procedures
      // are available at every location
      const templatesForLocation = createdTemplates
        .sort(() => 0.5 - Math.random()) // Shuffle the array
        .slice(0, Math.ceil(createdTemplates.length * 0.7)); // Use 70% of templates
      
      for (const template of templatesForLocation) {
        const priceData = generateProcedurePrice(template);
        
        await prisma.procedurePrice.create({
          data: {
            locationId: location.id,
            templateId: template.id,
            price: priceData.price,
            comments: priceData.comments
          }
        });
        
        priceCount++;
      }
    }
    
    console.log(`Created ${priceCount} procedure prices`);
  }
  
  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
