const { PrismaClient } = require('@prisma/client')
const { procedureCategories } = require('./seeds/procedure-categories')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')
  
  // Create the procedure categories and templates
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
            await prisma.procedureTemplate.create({
              data: {
                name: procedure.name,
                description: procedure.description || '',
                categoryId: subCategory.id
              }
            })
          }
        }
      }
    }
  }
  
  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
