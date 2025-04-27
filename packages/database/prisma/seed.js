// packages/database/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const { createDefaultUsers } = require('./seeds/default-users')
const { adminSettings } = require('./seeds/admin-settings')
const { sampleLocations } = require('./seeds/location-seeds')
const { subscriptionTiers } = require('./seeds/subscription-tiers')
const { procedureCategories } = require('./seeds/procedure-categories')
const { generateProcedurePrice } = require('./seeds/pricing-utils')

// Create Prisma client - enable logging only if needed for debugging
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Clearing existing data...')
  const modelsToClear = [
    'procedurePrice',
    'procedureTemplate',
    'procedureCategory',
    'location',
    'providerSettings',
    'provider',
    'adminSettings',
    'subscriptionPlan',
    'user'
  ]

  for (const modelName of modelsToClear) {
    if (prisma[modelName] && typeof prisma[modelName].deleteMany === 'function') {
      await prisma[modelName].deleteMany()
      console.log(`  • Cleared ${modelName}`)
    }
  }
  console.log('✅ All specified tables cleared.')

  // Seed subscription plans
  if (prisma.subscriptionPlan) {
    console.log('🌟 Seeding subscription plans...')
    for (const tier of subscriptionTiers) {
      await prisma.subscriptionPlan.create({
        data: {
          name: tier.name,
          description: tier.description,
          monthlyPrice: tier.monthlyPrice,
          annualPrice: tier.annualPrice,
          features: JSON.stringify(tier.features),
          isActive: true
        }
      })
      console.log(`  • ${tier.name}`)
    }
  }

  console.log('👥 Creating users + providers + settings...')
  const defaultUsers = await createDefaultUsers()
  let providerId = null

  for (const u of defaultUsers) {
    const { providerData, settingsData, adminSettingsData, ...userData } = u
    const user = await prisma.user.create({ data: userData })
    console.log(`  • User: ${user.email}`)

    // Create admin settings if this is an admin user
    if (adminSettingsData && prisma.adminSettings) {
      await prisma.adminSettings.create({ data: { ...adminSettingsData, userId: user.id } })
      console.log('    – AdminSettings')
    }

    // Create provider if this is a provider user
    if (providerData && user.role === 'PROVIDER') {
      try {
        // Step 1: Create provider with basic fields
        const baseProviderData = {
          organizationName: providerData.organizationName,
          phone: providerData.phone,
          website: providerData.website,
          bio: providerData.bio,
          logoUrl: providerData.logoUrl,
          address: providerData.address,
          city: providerData.city,
          state: providerData.state,
          zipCode: providerData.zipCode,
          subscriptionStatus: providerData.subscriptionStatus,
          subscriptionTier: providerData.subscriptionTier,
          userId: user.id
        }
        
        const prov = await prisma.provider.create({ data: baseProviderData })
        providerId = prov.id
        console.log(`    – Provider: ${prov.organizationName}`)
        
        // Step 2: Update with advanced fields using SQL
        const specialties = providerData.specialties ? JSON.stringify(providerData.specialties) : null
        const services = providerData.services ? JSON.stringify(providerData.services) : null
        const insuranceAccepted = providerData.insuranceAccepted ? JSON.stringify(providerData.insuranceAccepted) : null
        
        await prisma.$executeRaw`
          UPDATE "providers"
          SET 
            "email" = ${providerData.email},
            "mission" = ${providerData.mission},
            "yearEstablished" = ${providerData.yearEstablished},
            "licensingInfo" = ${providerData.licensingInfo},
            "reviewCount" = ${providerData.reviewCount},
            "rating" = ${providerData.rating},
            "specialties" = ${specialties}::jsonb,
            "services" = ${services}::jsonb,
            "insuranceAccepted" = ${insuranceAccepted}::jsonb
          WHERE "id" = ${prov.id}
        `

        // Create provider settings
        if (settingsData && prisma.providerSettings) {
          await prisma.providerSettings.create({ data: { ...settingsData, userId: user.id } })
          console.log('      • ProviderSettings')
        }
      } catch (error) {
        console.error('❌ Provider creation error:', error.message)
      }
    }
  }

  // Create locations
  if (providerId && prisma.location) {
    console.log('📍 Seeding locations...')
    for (const loc of sampleLocations) {
      try {
        // Create location with basic fields
        const basicLocationData = {
          name: loc.name,
          address1: loc.address1,
          address2: loc.address2,
          city: loc.city,
          state: loc.state,
          zipCode: loc.zipCode,
          phone: loc.phone,
          latitude: loc.latitude,
          longitude: loc.longitude,
          isActive: true,
          providerId
        }
        
        const location = await prisma.location.create({ data: basicLocationData })
        
        // Add hours data using SQL
        if (loc.hours) {
          await prisma.$executeRaw`
            UPDATE "locations"
            SET "hours" = ${JSON.stringify(loc.hours)}::jsonb
            WHERE "id" = ${location.id}
          `
        }
        
        console.log(`  • ${loc.name}`)
      } catch (error) {
        console.error(`❌ Location creation error for ${loc.name}:`, error.message)
      }
    }
  }

  // Create procedure categories and templates
  if (prisma.procedureCategory && prisma.procedureTemplate) {
    console.log('📁 Seeding categories & templates...')
    const templates = []
    
    for (const cat of procedureCategories) {
      // Create main category
      const main = await prisma.procedureCategory.create({
        data: {
          name: cat.name,
          description: cat.description,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-')
        }
      })
      console.log(`  • Category: ${main.name}`)

      // Create subcategories and procedures
      for (const sub of cat.children || []) {
        const child = await prisma.procedureCategory.create({
          data: {
            name: sub.name,
            description: sub.description || '',
            slug: sub.name.toLowerCase().replace(/\s+/g, '-'),
            parentId: main.id
          }
        })
        console.log(`    – Subcategory: ${child.name}`)

        // Create procedure templates
        for (const proc of sub.procedures || []) {
          const tpl = await prisma.procedureTemplate.create({
            data: {
              name: proc.name,
              description: proc.description || '',
              categoryId: child.id,
              searchTerms: proc.name.toLowerCase().replace(/\s+/g, ','),
              cptCode: proc.cptCode || null,
              isActive: true
            }
          })
          templates.push(tpl)
          console.log(`      • Template: ${tpl.name}`)
        }
      }
    }

    // Create procedure prices
    if (providerId && prisma.procedurePrice && templates.length > 0) {
      console.log('💰 Seeding procedure prices...')
      const locs = await prisma.location.findMany({ where: { providerId } })
      let count = 0
      
      for (const loc of locs) {
        // Create a random subset of procedures for each location
        const subset = templates.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(templates.length * 0.7))
        
        for (const tpl of subset) {
          try {
            const { price, averageMarketPrice, comments } = generateProcedurePrice(tpl)
            
            // Create price with basic fields
            const priceData = {
              locationId: loc.id,
              templateId: tpl.id,
              price,
              comments,
              isActive: true
            }
            
            const procedurePrice = await prisma.procedurePrice.create({ data: priceData })
            
            // Add average market price using SQL if available
            if (averageMarketPrice) {
              await prisma.$executeRaw`
                UPDATE "procedure_prices"
                SET "averageMarketPrice" = ${averageMarketPrice}
                WHERE "id" = ${procedurePrice.id}
              `
            }
            
            count++
          } catch (error) {
            console.error(`❌ Price creation error:`, error.message)
          }
        }
      }
      
      console.log(`  • ${count} prices created`)
    }
  }

  console.log('🎉 Seeding complete!')
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
