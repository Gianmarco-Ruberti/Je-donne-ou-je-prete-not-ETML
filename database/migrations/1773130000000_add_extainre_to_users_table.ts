import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'extainre')

    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.boolean('extainre').notNullable().defaultTo(false)
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'extainre')

    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('extainre')
      })
    }
  }
}
