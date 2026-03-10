import factory from '@adonisjs/lucid/factories'
import ChercheObject from '#models/cherche_object'
import { DateTime } from 'luxon'

export const ChercheObjectFactory = factory
  .define(ChercheObject, async ({ faker }) => {
    return {
          name: faker.commerce.productName(),
          user_id : 1,
          description: faker.commerce.productDescription(),

          // 'status' est un nombre (ex: 0 pour dispo, 1 pour réservé)
          status: faker.number.int({ min: 0, max: 2 }),
          categorie: faker.helpers.arrayElement(['sport', 'books', 'clothes', 'tech', 'home', 'toys', 'appliances', 'art', 'office']),
          urgent: false,
    
          // Dates de disponibilité
          neededFrom: DateTime.fromJSDate(faker.date.soon()),
          neededUntil: DateTime.fromJSDate(faker.date.future()),
    
          // Note : userId et reservedBy seront gérés via les relations
          // ou passés manuellement lors de la création
        }
  })
  .build()