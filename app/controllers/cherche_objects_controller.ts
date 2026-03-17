import ChercheObject from '#models/cherche_object'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ChercheObjectsController {
      /**
       * Liste des objets avec filtres (Home)
       */
      async index({ request, view }: HttpContext) {
        const filterType = request.input('filter_type')
        const filterCategorie = request.input('filter_categorie')
    
        // On ajoute direct le filtre sur le status 1 ici
        let query = ChercheObject.query()
          .where('status', 1)
          .orderBy('urgent', 'desc')
          .orderBy('created_at', 'desc')
    
        if (filterType === '0') {
          query = query.where('type', false)
        } else if (filterType === '1') {
          query = query.where('type', true)
        }
    
        if (filterCategorie && filterCategorie !== '') {
          query = query.where('categorie', filterCategorie)
        }
    
        const objects = await query
    
        // Pour les filtres, on ne veut aussi que les catégories des objets dispos
        const categoriesResult = await db
          .from('cherche_objects')
          .where('status', 1) // Optionnel: pour ne pas afficher des catégories vides
          .distinct('categorie')
          .orderBy('categorie', 'asc')
    
        const categories = categoriesResult.map((row) => row.categorie)
    
        return view.render('pages/home', {
          objects,
          filterType,
          filterCategorie,
          categories,
        })
      }
}