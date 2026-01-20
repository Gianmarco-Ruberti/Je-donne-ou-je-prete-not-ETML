// app/Models/User.ts
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations' // Import type important
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Post from './donation-object.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['Username'], // On utilise Username à la place de email
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare Username: string | null

  @column()
  declare email: string | null

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Post)
  declare posts: HasMany<typeof Post>
}