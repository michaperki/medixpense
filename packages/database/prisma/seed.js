
// packages/database/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const { createDefaultUsers } = require('./seeds/default-users')
const { adminSettings } = require('./seeds/admin-settings')
const { sampleLocations } = require('./seeds/location-seeds')
const { subscriptionTiers } = require('./seeds/subscription-tiers')
const { procedureCategories } = require('./seeds/procedure-categories')
const { generateProcedurePrice } = require('./seeds/pricing-utils')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Clearing existing data...')
  // Dynamically clear tables if model exists
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

  // 1️⃣ Seed subscription tiers if model available
  if (prisma.subscriptionPlan) {
    console.log('🌟 Seeding subscription plans...')
    for (const tier of subscriptionTiers) {
      await prisma.subscriptionPlan.create({
        data: {
          name:         tier.name,
          description:  tier.description,
          monthlyPrice: tier.monthlyPrice,
          annualPrice:  tier.annualPrice,
          features:     JSON.stringify(tier.features),
          isActive:     true
        }
      })
      console.log(`  • ${tier.name}`)
    }
  }

  // 2️⃣ Users + providers + settings
  console.log('👥 Creating users + providers + settings...')
  const defaultUsers = await createDefaultUsers()
  let providerId = null

  for (const u of defaultUsers) {
    const { providerData, settingsData, adminSettingsData, ...userData } = u
    const user = await prisma.user.create({ data: userData })
    console.log(`  • User: ${user.email}`)

    if (adminSettingsData && prisma.adminSettings) {
      await prisma.adminSettings.create({ data: { ...adminSettingsData, userId: user.id } })
      console.log('    – AdminSettings')
    }

    if (providerData && user.role === 'PROVIDER') {
      const prov = await prisma.provider.create({ data: { ...providerData, userId: user.id } })
      providerId = prov.id
      console.log(`    – Provider: ${prov.organizationName}`)

      if (settingsData && prisma.providerSettings) {
        await prisma.providerSettings.create({ data: { ...settingsData, userId: user.id } })
        console.log('      • ProviderSettings')
      }
    }
  }

  // 3️⃣ Locations
  if (providerId && prisma.location) {
    console.log('📍 Seeding locations...')
    for (const loc of sampleLocations) {
      await prisma.location.create({
        data: {
          providerId,
          name:      loc.name,
          address1:  loc.address1,
          address2:  loc.address2,
          city:      loc.city,
          state:     loc.state,
          zipCode:   loc.zipCode,
          phone:     loc.phone,
          latitude:  loc.latitude,
          longitude: loc.longitude,
          isActive:  loc.isActive ?? true
        }
      })
      console.log(`  • ${loc.name}`)
    }
  }

  // 4️⃣ Categories & templates
  if (prisma.procedureCategory && prisma.procedureTemplate) {
    console.log('📑 Seeding categories & templates...')
    const templates = []
    for (const cat of procedureCategories) {
      const main = await prisma.procedureCategory.create({ data: {
        name:        cat.name,
        description: cat.description,
        slug:        cat.name.toLowerCase().replace(/\s+/g, '-')
      }})
      console.log(`  • Category: ${main.name}`)

      for (const sub of cat.children || []) {
        const child = await prisma.procedureCategory.create({ data: {
          name:        sub.name,
          description: sub.description || '',
          slug:        sub.name.toLowerCase().replace(/\s+/g, '-'),
          parentId:    main.id
        }})
        console.log(`    – Subcategory: ${child.name}`)

        for (const proc of sub.procedures || []) {
          const tpl = await prisma.procedureTemplate.create({ data: {
            name:        proc.name,
            description: proc.description || '',
            categoryId:  child.id,
            searchTerms: proc.name.toLowerCase().replace(/\s+/g, ',')
          }})
          templates.push(tpl)
          console.log(`      • Template: ${tpl.name}`)
        }
      }
    }

    // 5️⃣ Prices
    if (providerId && prisma.procedurePrice) {
      console.log('💰 Seeding procedure prices...')
      const locs = await prisma.location.findMany({ where: { providerId } })
      let count = 0
      for (const loc of locs) {
        const subset = templates
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.ceil(templates.length * 0.7))
        for (const tpl of subset) {
          const { price, comments } = generateProcedurePrice(tpl)
          await prisma.procedurePrice.create({ data: {
            locationId: loc.id,
            templateId: tpl.id,
            price,
            comments
          }})
          count++
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
