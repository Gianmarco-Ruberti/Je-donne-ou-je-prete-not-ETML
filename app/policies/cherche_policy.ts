import User from '#models/user'
import ChercheObject from '#models/cherche_object'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class CherchePolicy extends BasePolicy {
  // Seul le proprio modifie
  edit(user: User, cherche: ChercheObject): AuthorizerResponse {
    return user.id === cherche.userId
  }

  // Seul le proprio supprime
  delete(user: User, cherche: ChercheObject): AuthorizerResponse {
    return user.id === cherche.userId
  }

  // Interdit de se proposer pour son propre objet
  reserve(user: User, cherche: ChercheObject): AuthorizerResponse {
    return user.id !== cherche.userId
  }
}
