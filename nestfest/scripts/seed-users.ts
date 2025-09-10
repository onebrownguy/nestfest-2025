/**
 * Database Seeding Script - Add Initial Users
 * Creates admin and judge user accounts for NestFest platform
 */

import { eq } from 'drizzle-orm'
import { db } from '../src/lib/db'
import { users } from '../src/lib/db/schema'

async function seedUsers() {
  console.log('🌱 Starting user seeding process...')

  try {
    // Admin User: rinconabel@gmail.com
    const adminEmail = 'rinconabel@gmail.com'
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1)

    if (existingAdmin.length === 0) {
      const adminUser = await db.insert(users).values({
        email: adminEmail,
        name: 'Abel Rincon',
        firstName: 'Abel',
        lastName: 'Rincon',
        role: 'admin',
        status: 'active',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      console.log('✅ Created admin user:', adminUser[0].email, 'with role:', adminUser[0].role)
    } else {
      console.log('ℹ️  Admin user already exists:', adminEmail)
    }

    // Judge User: abel.rincon@g.austincc.edu
    const judgeEmail = 'abel.rincon@g.austincc.edu'
    const existingJudge = await db
      .select()
      .from(users)
      .where(eq(users.email, judgeEmail))
      .limit(1)

    if (existingJudge.length === 0) {
      const judgeUser = await db.insert(users).values({
        email: judgeEmail,
        name: 'Abel Rincon (Judge)',
        firstName: 'Abel',
        lastName: 'Rincon',
        role: 'judge',
        status: 'active',
        university: 'Austin Community College',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      console.log('✅ Created judge user:', judgeUser[0].email, 'with role:', judgeUser[0].role)
    } else {
      console.log('ℹ️  Judge user already exists:', judgeEmail)
    }

    // Verify both users exist
    const allUsers = await db.select({
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status
    }).from(users)

    console.log('\n📊 Current users in database:')
    allUsers.forEach(user => {
      console.log(`  ${user.email} - ${user.role} (${user.status})`)
    })

    console.log('\n🎉 User seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    throw error
  }
}

// Run the seeding function if called directly
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('✅ Seeding process finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export default seedUsers