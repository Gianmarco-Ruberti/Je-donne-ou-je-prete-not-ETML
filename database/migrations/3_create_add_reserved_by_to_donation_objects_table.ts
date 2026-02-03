import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'donation_objects'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('reserved_by').unsigned().references('id').inTable('users').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('reserved_by')
    })
  }
}
