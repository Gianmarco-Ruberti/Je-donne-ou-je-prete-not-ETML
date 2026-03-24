import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'isadmin')

    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.boolean('isadmin').notNullable().defaultTo(false)
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'isadmin')

    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('isadmin')
      })
    }
  }
}
