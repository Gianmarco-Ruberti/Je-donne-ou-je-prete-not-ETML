import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class DonationObject extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string | null

  @column()
  declare description: string | null

  @column()
  declare type: boolean

  @column()
  declare status: number

  @column()
  declare categorie: string | null

  @column()
  declare imagePath: string | null

  @column.dateTime()
  declare availableFrom: DateTime | null

  @column.dateTime()
  declare availableUntil: DateTime | null

  @column()
  declare reservedBy: number | null

  @belongsTo(() => User, { foreignKey: 'reservedBy' })
  declare reserver: BelongsTo<typeof User>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
