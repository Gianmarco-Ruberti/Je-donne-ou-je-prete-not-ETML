import { ChercheObjectFactory } from '#database/factories/cherche_object_factory'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await ChercheObjectFactory.createMany(10000)
  }
}