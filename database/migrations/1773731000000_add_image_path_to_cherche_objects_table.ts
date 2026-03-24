import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cherche_objects'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'image_path')

    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.string('image_path').nullable()
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'image_path')

    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('image_path')
      })
    }
  }
}
