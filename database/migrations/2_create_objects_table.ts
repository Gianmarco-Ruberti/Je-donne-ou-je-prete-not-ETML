import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'donation_objects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('name').nullable()
      table.string('description', 5000).nullable()

      // On imagine : type true = prêt, type false = don
      table.boolean('type').notNullable()

      // Temps de réservation en minutes (nullable au niveau DB)
      // Dans ta migration up()
      table.timestamp('available_from').nullable()
      table.timestamp('available_until').nullable()

      table.integer('status').notNullable().defaultTo(1)
      table.string('image_path').nullable()
      table.string('categorie').defaultTo('aucune')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}