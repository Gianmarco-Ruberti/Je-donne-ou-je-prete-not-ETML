import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {

    const users = [{
      username: 'Admin',
      email:'dami.scoot3@gmail.com',
      password: 'Admin',
    },{
      username: 'Test',
      email:'test@example.com',
      password: '1234',
    },{
      username: 'Guest',
      email:'guest@example.com',
      password: 'Guest',
    },
  ]

    await User.createMany(users)
  }
}
