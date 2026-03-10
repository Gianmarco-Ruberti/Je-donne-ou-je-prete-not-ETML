import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cherche_objects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('name').nullable()
      table.string('description', 5000).nullable()

      table.integer('status').notNullable().defaultTo(1)
      table.string('categorie').defaultTo('aucune')

      // Temps de réservation en minutes (nullable au niveau DB)
      // Dans ta migration up()
      table.timestamp('needed_from').nullable()
      table.timestamp('needed_until').nullable()
      table.boolean('urgent').defaultTo('false')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}