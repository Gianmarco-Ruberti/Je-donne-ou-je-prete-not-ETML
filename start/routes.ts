/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

import DonationObjectsController from '#controllers/donation_objects_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import AuthController from '#controllers/auth_controller'
import AccountsController from '#controllers/accounts_controller'
import ChercheObjectsController from '#controllers/cherche_objects_controller'

// --- Public routes ---
router.get('/login', [AuthController, 'login']).as('login')
router.post('/login', [AuthController, 'authenticate']).as('autenticate')
router.get('/', [AuthController, 'login']).as('login0')
// --- Protected routes ---
router.group(() => {
  // router.get('/profile', 'UsersController.profile').as('profile')
  router.get('/account', [AccountsController, 'account']).as('account')
  router.get('/logout', [AuthController, 'logout']).as('logout')

  // DonationObjects routes
  router.get('home', [DonationObjectsController, 'index']).as('donation_objects.index')
  router.get('new', [DonationObjectsController, 'create']).as('donation_objects.create')

  router.get('cherche/home', [ChercheObjectsController, 'index']).as('cherche_objects.index')

  router.group(() => {
    router.get('/:id', [DonationObjectsController, 'show']).as('donation_objects.show')
    router.get('/:id/edit', [DonationObjectsController, 'edit']).as('donation_objects.edit')

    router.post('/', [DonationObjectsController, 'store']).as('donation_objects.store')
    router.post('/:id', [DonationObjectsController, 'update']).as('donation_objects.update')
    router.delete('/:id', [DonationObjectsController, 'destroy']).as('donation_objects.destroy')

    router.post('/:id/reserve', [DonationObjectsController, 'reserve']).as('donation_objects.reserve')
    router.patch('/:id/republish', [DonationObjectsController, 'republish']).as('item.republish')

    router.group(() => {
      router.get('/:id', [ChercheObjectsController, 'show']).as('cherche_objects.show')
      router.get('/:id/edit', [ChercheObjectsController, 'edit']).as('cherche_objects.edit')

      router.post('/', [ChercheObjectsController, 'store']).as('cherche_objects.store')
      router.post('/:id', [ChercheObjectsController, 'update']).as('cherche_objects.update')
      router.delete('/:id', [ChercheObjectsController, 'destroy']).as('cherche_objects.destroy')

      router.post('/:id/reserve', [ChercheObjectsController, 'reserve']).as('cherche_objects.reserve')
      router.patch('/:id/republish', [ChercheObjectsController, 'republish']).as('cherche_item.republish')
    }).prefix('/cherche')
  }).prefix('/item')

}).use(middleware.auth())
