import ChercheObject from '#models/cherche_object'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import {
  createDonationObjectValidator,
  updateDonationObjectValidator,
} from '#validators/donation_object'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import CherchePolicy from '#policies/cherche_policy'

export default class ChercheObjectsController {
  /**
   * Liste des objets avec filtres (Home)
   */
  async index({ request, view }: HttpContext) {
    const filterCategorie = request.input('filter_categorie')

    // On ajoute direct le filtre sur le status 1 ici
    let query = ChercheObject.query()
      .where('status', 1)
      .orderBy('urgent', 'desc')
      .orderBy('created_at', 'desc')

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
      filterType: null,
      filterCategorie,
      categories,
      isChercheMode: true,
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

    const object = await ChercheObject.create({
      userId: auth.user.id,
      name: payload.name,
      description: payload.description,
      categorie: payload.categorie,
      imagePath: fileName,
      status: 1,
      urgent: !!payload.IsUrgent,
      neededFrom: payload.available_from ? DateTime.fromJSDate(payload.available_from) : null,
      neededUntil: payload.available_until ? DateTime.fromJSDate(payload.available_until) : null,
    })

    return response.redirect().toRoute('cherche_objects.show', { id: object.id })
  }

  /**
   * Affiche les détails d'un objet
   */
  async show({ params, view }: HttpContext) {
    const object = await ChercheObject.query().where('id', params.id).preload('user').firstOrFail()

    return view.render('pages/details', { object })
  }

  /**
   * Formulaire d'édition (vérification propriétaire)
   */
  async edit({ params, view, bouncer }: HttpContext) {
    const object = await ChercheObject.findOrFail(params.id)

    // Vérifie si l'utilisateur a le droit d'éditer selon la Policy
    await bouncer.with(CherchePolicy).authorize('edit', object)

    return view.render('pages/edit-object', { object })
  }

  /**
   * Mise à jour de l'objet
   */
  async update({ params, request, response, bouncer }: HttpContext) {
    const payload = await request.validateUsing(updateDonationObjectValidator)
    const object = await ChercheObject.findOrFail(params.id)

    await bouncer.with(CherchePolicy).authorize('edit', object)

    const updateData: any = {
      name: payload.name,
      description: payload.description,
      urgent: !!payload.IsUrgent,
      categorie: payload.categorie,
      neededFrom: payload.available_from ? DateTime.fromJSDate(payload.available_from) : null,
      neededUntil: payload.available_until ? DateTime.fromJSDate(payload.available_until) : null,
    }

    if (payload.image) {
      const fileName = `${cuid()}.webp`
      const uploadPath = app.makePath('public/uploads/items', fileName)

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

    return response.redirect(`/item/cherche/${object.id}`)
  }

  /**
   * Suppression de l'objet
   */
  async destroy({ params, response, bouncer }: HttpContext) {
    const object = await ChercheObject.findOrFail(params.id)

    // On vérifie le droit de suppression
    await bouncer.with(CherchePolicy).authorize('delete', object)

    if (object.imagePath) {
      try {
        await fs.unlink(app.makePath('public/uploads/items', object.imagePath))
      } catch (e) {}
    }

    await object.delete()
    return response.redirect().toPath('/account')
  }

  /**
   * Réserve un objet (un don/un donateur pour cet objet)
   */
  async reserve({ params, auth, response, session, request, bouncer }: HttpContext) {
    try {
      const user = auth.user!
      await user.refresh()

      const userMessage = request.input('user_message', 'Aucun message particulier.')

      const item = await ChercheObject.query().where('id', params.id).preload('user').firstOrFail()

      await bouncer.with(CherchePolicy).authorize('reserve', item)

      if (item.status === 2) {
        session.flash('error', 'Cet objet est déjà réservé.')
        return response.redirect().back()

      }

      item.status = 2
      item.giftedBy = user.id
      await item.save()

      const ownerEmail = item.user.email
      if (!ownerEmail) {
        session.flash('error', "Le propriétaire n'a pas d'email configuré.")
        return response.redirect().back()
      }

      // ENVOI DU MAIL
      await mail.send((message) => {
        message
          .to(ownerEmail)
          .from('dami.scoot3@gmail.com')
          .subject(`Offre de don : ${item.name}`)
          .htmlView('emails/reservation', {
            item: item.toJSON(),
            requester: user.toJSON(),
            customMessage: userMessage,
          })
      })

      session.flash('success', 'Offre envoyée ! Retrouve-la dans ton historique.')
    } catch (error) {
      console.error(error)
      session.flash('error', "L'action a échoué.")
    }

    return response.redirect().back()
  }

  /**
   * Republier un objet (annuler la réservation)
   */
  async republish({ params, auth, response, session }: HttpContext) {
    const user = auth.user!

    const object = await ChercheObject.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    object.status = 1
    object.giftedBy = null
    await object.save()

    session.flash('success', 'Objet republié avec succès!')
    return response.redirect().back()
  }
}
