import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class ChercheObject extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string | null

  @column()
  declare description: string | null

  @column()
  declare status: number

  @column()
  declare categorie: string | null

  @column()
  declare imagePath: string | null

  @column.dateTime()
  declare neededFrom: DateTime | null

  @column.dateTime()
  declare neededUntil: DateTime | null

  @column()
  declare giftedBy: number | null

  @belongsTo(() => User, { foreignKey: 'giftedBy' })
  declare donor: BelongsTo<typeof User>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare urgent: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}