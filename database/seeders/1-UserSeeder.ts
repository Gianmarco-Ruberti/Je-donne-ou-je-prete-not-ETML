import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {

    const users = [{
      username: 'Admin',
      email:'dami.scoot3@gmail.com',
      password: 'Admin',
      extainre: false,
      isadmin: true,
    },{
      username: 'Test',
      email:'test@example.com',
      password: '1234',
      extainre: false,
      isadmin: false,
    },{
      username: 'Guest',
      email:'guest@example.com',
      password: 'Guest',
      extainre: true,
      isadmin: false,
    },
  ]

    await User.createMany(users)
  }
}
