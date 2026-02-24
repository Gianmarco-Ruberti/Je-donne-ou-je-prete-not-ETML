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
import { Message } from '@adonisjs/mail/types'
import { DateTime } from 'luxon'

export default class DonationObjectsController {
  /**
   * Liste des objets avec filtres (Home)
   */
  async index({ request, view }: HttpContext) {
    const filterType = request.input('filter_type')
    const filterCategorie = request.input('filter_categorie')

    // On ajoute direct le filtre sur le status 1 ici
    let query = DonationObject.query().where('status', 1).orderBy('urgent', 'desc').orderBy('created_at', 'desc')

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
      .from('donation_objects')
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

    const payload = await request.validateUsing(createDonationObjectValidator)

    let fileName: string | null = null
    if (payload.image && payload.image.tmpPath) {
      fileName = `${cuid()}.webp`
      const uploadPath = app.makePath('public/uploads/items', fileName)
      await sharp(payload.image.tmpPath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(uploadPath)
    }

    const object = await DonationObject.create({
      userId: auth.user.id,
      name: payload.name,
      description: payload.description,
      type: payload.type === '1',
      categorie: payload.categorie,
      imagePath: fileName,
      status: 1,
      urgent: !!payload.IsUrgent,
      availableFrom: payload.available_from ? DateTime.fromJSDate(payload.available_from) : null,
      availableUntil: payload.available_until ? DateTime.fromJSDate(payload.available_until) : null,
    })

    return response.redirect().toRoute('donation_objects.show', { id: object.id })
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
      urgent: !!payload.IsUrgent,
      type: payload.type === '1',
      categorie: payload.categorie,
      availableFrom: payload.available_from ? DateTime.fromJSDate(payload.available_from) : null,
      availableUntil: payload.available_until ? DateTime.fromJSDate(payload.available_until) : null,
    }

    // Si une nouvelle image est envoyée
    if (payload.image) {
      const fileName = `${cuid()}.webp`
      const uploadPath = app.makePath('public/uploads/items', fileName)

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
      } catch (e) {}
    }

    await object.delete()
    return response.redirect().toPath('/account')
  }

  async reserve({ params, auth, response, session, request }: HttpContext) {
    // Retiré 'mail' d'ici
    try {
      const user = auth.user!
      const userMessage = request.input('user_message', 'Aucun message particulier.')

      const item = await DonationObject.query().where('id', params.id).preload('user').firstOrFail()

      if (item.status === 2) {
        session.flash('error', 'Cet objet est déjà réservé.')
        return response.redirect().back()
      }

      item.status = 2
      item.reservedBy = user.id
      await item.save()

      // Utilisation du service mail importé
      await mail.send((message: Message) => {
        // <--- Ajout du type : Message
        message
          .to(item.user.email)
          .from('dami.scoot3@gmail.com')
          .subject(`Demande de réservation : ${item.name}`)
          .htmlView('emails/reservation', {
            item: item,
            requester: user,
            customMessage: userMessage,
          })
      })

      session.flash('success', 'Demande envoyée ! Retrouve-la dans ton historique.')
    } catch (error) {
      console.error(error)
      session.flash('error', "L'action a échoué.")
    }

    return response.redirect().back()
  }

  async republish({ params, auth, response, session }: HttpContext) {
    const user = auth.user!

    const object = await DonationObject.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    object.status = 1
    object.reservedBy = null
    await object.save()

    session.flash('success', "L'objet est de nouveau disponible !")
    return response.redirect().back()
  }
}
