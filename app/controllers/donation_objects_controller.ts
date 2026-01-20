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
import { DateTime } from 'luxon'

export default class DonationObjectsController {
  /**
   * Liste des objets avec filtres (Home)
   */
  async index({ request, view }: HttpContext) {
    const filterType = request.input('filter_type')
    const filterCategorie = request.input('filter_categorie')

    // On ajoute direct le filtre sur le status 1 ici
    let query = DonationObject.query().where('status', 1).orderBy('created_at', 'desc')

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
      availableFrom: payload.available_from ? DateTime.fromJSDate(payload.available_from) : null,
      availableUntil: payload.available_until ? DateTime.fromJSDate(payload.available_until) : null,
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
      availableFrom: payload.available_from ? DateTime.fromJSDate(payload.available_from) : null,
      availableUntil: payload.available_until ? DateTime.fromJSDate(payload.available_until) : null,
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
      // 1. On récupère l'objet
      const item = await DonationObject.query().where('id', params.id).preload('user').firstOrFail()

      // 2. Sécurité : On vérifie s'il n'est pas déjà réservé (status 2)
      if (item.status === 2) {
        session.flash('error', 'Cet objet est déjà en cours de réservation.')
        return response.redirect().back()
      }

      // 3. Envoi du mail (ton code actuel)
      await mail.send((message) => {
        message
          .to(`${item.user.email}`)
          .from('dami.scoot3@gmail.com')
          .subject(`Demande de réservation : ${item.name}`)
          .htmlView('emails/reservation', {
            item: item,
            requester: auth.user,
          })
      })

      // 4. MAJ du status à 2 et sauvegarde en DB
      item.status = 2
      await item.save()

      console.log('Email envoyé et status mis à jour à 2.')
      session.flash('success', "Demande envoyée ! L'objet est maintenant réservé.")
    } catch (error) {
      console.error(error)
      session.flash('error', "L'action a échoué.")
    }

    return response.redirect().back()
  }
}
