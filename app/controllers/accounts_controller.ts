import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/donation-object'
import DonationObject from '#models/donation-object'

export default class AccountsController {
  public async account({ view, auth, response }: HttpContext) {

    if (!auth.isAuthenticated) {
      return response.redirect('/login')
    }

    const user = auth.user!

    const userObjects = await user.related('posts').query()


    const reservations = await DonationObject.query()
      .where('reservedBy', user.id)
      .whereNot('userId', user.id)
      .preload('user')
    return view.render('pages/account', {
      user: user,
      objects: userObjects,
      reservations: reservations
    })
  }
}
