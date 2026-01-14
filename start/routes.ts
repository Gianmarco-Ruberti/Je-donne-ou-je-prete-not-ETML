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
 
// --- Public routes ---
router.get('/login', [AuthController, 'login']).as('login')
router.post('/login', [AuthController, 'authenticate']).as('autenticate')
router.get('/', [AuthController, 'login']).as('login0')
// --- Protected routes ---
router.group(() => {
  router.get('/profile', 'UsersController.profile').as('profile')
  router.get('/account', [AccountsController, 'account']).as('account')
  router.get('/logout', [AuthController, 'logout']).as('logout')
 
  // DonationObjects routes
  router.get('home', [DonationObjectsController, 'index']).as('donation_objects.index')
  router.get('new', [DonationObjectsController, 'create']).as('donation_objects.create')
  router.get('item/:id', [DonationObjectsController, 'show']).as('donation_objects.show')
  router.get('item/:id/edit', [DonationObjectsController, 'edit']).as('donation_objects.edit')
 
  router.post('items', [DonationObjectsController, 'store']).as('donation_objects.store')
  router.post('item/:id', [DonationObjectsController, 'update']).as('donation_objects.update')
  router.delete('item/:id', [DonationObjectsController, 'destroy']).as('donation_objects.destroy')
  router.post('/item/:id/reserve', [DonationObjectsController, 'reserve']).as('donation_objects.reserve')
}).use(middleware.auth())
