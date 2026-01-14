import DonationObject from '#models/donation-object'
import type { HttpContext } from '@adonisjs/core/http'
import {
  createDonationObjectValidator,
  updateDonationObjectValidator,
} from '#validators/donation_object'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'

export default class DonationObjectsController {
  /**
   * Liste des objets avec filtres (Home)
   */
  async index({ request, view }: HttpContext) {
    const filterType = request.input('filter_type')
    const filterCategorie = request.input('filter_categorie')

    let query = DonationObject.query().orderBy('created_at', 'desc')

    if (filterType === '0') {
      query = query.where('type', false)
    } else if (filterType === '1') {
      query = query.where('type', true)
    }

    if (filterCategorie && filterCategorie !== '') {
      query = query.where('categorie', filterCategorie)
    }

    const objects = await query

    // Récupération des catégories uniques pour le filtre
    const categoriesResult = await db
      .from('donation_objects')
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

  /**
   * Affiche le formulaire de création
   */
  async create({ view }: HttpContext) {
    return view.render('pages/new-object')
  }

  /**
   * Enregistre un nouvel objet (Compression WebP)
   */
  async store({ request, response, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized('Vous devez être connecté.')

    // 1. Validation des données
    const payload = await request.validateUsing(createDonationObjectValidator)

    let fileName: string | null = null

    // 2. Traitement de l'image avec Sharp
    if (payload.image) {
      fileName = `${cuid()}.webp`
      const uploadPath = app.makePath('public/uploads/items', fileName)

      if (payload.image.tmpPath) {
        await sharp(payload.image.tmpPath)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75 }) // Compression WebP optimisée
          .toFile(uploadPath)
      }
    }

    // 3. Création en base de données
    const object = await DonationObject.create({
      userId: auth.user.id,
      name: payload.name,
      description: payload.description,
      type: payload.type === '1',
      categorie: payload.categorie,
      imagePath: fileName,
      status: 1,
    })

    return response.redirect().toPath(`/item/${object.id}`)
  }

  /**
   * Affiche les détails d'un objet
   */
  async show({ params, view }: HttpContext) {
    const object = await DonationObject.query().where('id', params.id).preload('user').firstOrFail()

    return view.render('pages/details', { object })
  }

  /**
   * Formulaire d'édition (vérification propriétaire)
   */
  async edit({ params, view, auth, response }: HttpContext) {
    const user = auth.user!
    const object = await DonationObject.findOrFail(params.id)

    if (object.userId !== user.id) {
      return response.redirect().toRoute('donation_objects.index')
    }

    return view.render('pages/edit-object', { object })
  }

  /**
   * Mise à jour de l'objet (Suppression ancienne image + WebP)
   */
  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateDonationObjectValidator)
    const object = await DonationObject.findOrFail(params.id)

    const updateData: any = {
      name: payload.name,
      description: payload.description,
      type: payload.type === 1,
      categorie: payload.categorie,
    }

    // Si une nouvelle image est envoyée
    if (payload.image) {
      const fileName = `${cuid()}.webp`
      const uploadPath = app.makePath('public/uploads/items', fileName)

      // Supprimer l'ancienne image physiquement du disque
      if (object.imagePath) {
        try {
          await fs.unlink(app.makePath('public/uploads/items', object.imagePath))
        } catch (e) {
          // On ignore si le fichier n'existait pas déjà
        }
      }

      // Compression de la nouvelle image
      if (payload.image.tmpPath) {
        await sharp(payload.image.tmpPath)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(uploadPath)

        updateData.imagePath = fileName
      }
    }

    object.merge(updateData)
    await object.save()

    return response.redirect(`/item/${object.id}`)
  }

  /**
   * Suppression de l'objet et de son image
   */
  async destroy({ params, response }: HttpContext) {
    const object = await DonationObject.findOrFail(params.id)

    // Nettoyage du fichier image sur le serveur
    if (object.imagePath) {
      try {
        await fs.unlink(app.makePath('public/uploads/items', object.imagePath))
      } catch (e) {
        // Erreur ignorée
      }
    }

    await object.delete()
    return response.redirect().toPath('/account')
  }


  async reserve({ params, auth, response, session }: HttpContext) {

    try {
      const item = await DonationObject.query()
        .where('id', params.id)
        .preload('user')
        .firstOrFail()



      await mail.send((message) => {
        message
          .to(`${item.user.email}`) // Ton mail de test
          .from('dami.scoot3@gmail.com') // Ton mail valide Brevo
          .subject(`Demande de réservation : ${item.name}`)
          .html(`
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Nouvelle demande !</h1>
            </div>
            
            <div style="padding: 20px; line-height: 1.6;">
              <p>Bonjour <strong>${item.user.Username}</strong>,</p>
              
              <p>Bonne nouvelle ! Un utilisateur est intéressé par votre objet : <strong>${item.name}</strong>.</p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                <p style="margin: 0;"><strong>Demandeur :</strong> ${auth.user?.Username}</p>
                <p style="margin: 5px 0 0 0;"><strong>Email :</strong> ${auth.user?.email}</p>
              </div>

              <p>Vous pouvez contacter cette personne directement en répondant à cet email.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="mailto:tkt}" style="background-color: #22c55e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Répondre au demandeur</a>
              </div>
            </div>

            <div style="background-color: #f3f4f6; color: #6b7280; padding: 15px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Ceci est un message automatique envoyé par JeDonneJePrete.</p>
            </div>
          </div>
        `)
      })

      session.flash('success', 'Email envoyé au propriétaire !')

    } catch (error) {
      console.log('ERREUR CAPTURÉE :', error)
      session.flash('error', "L'envoi a échoué : " + error.message)
    }

    return response.redirect().back()
  }
}
