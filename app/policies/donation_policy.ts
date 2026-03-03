import User from '#models/user'
import DonationObject from '#models/donation-object' // Vérifie bien le nom du fichier ici
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class DonationPolicy extends BasePolicy {
  // Seul le proprio modifie
  edit(user: User, donation: DonationObject): AuthorizerResponse {
    return user.id === donation.userId
  }

  // Seul le proprio supprime
  delete(user: User, donation: DonationObject): AuthorizerResponse {
    return user.id === donation.userId
  }

  // Interdit de réserver son propre objet
  reserve(user: User, donation: DonationObject): AuthorizerResponse {
    return user.id !== donation.userId
  }
}