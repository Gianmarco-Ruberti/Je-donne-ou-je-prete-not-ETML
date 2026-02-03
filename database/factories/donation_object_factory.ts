import factory from '@adonisjs/lucid/factories'
import DonationObject from '#models/donation-object'
import { DateTime } from 'luxon'

export const DonationObjectFactory = factory
  .define(DonationObject, async ({ faker }) => {
    const availableImages = [
      'jf6ae3md1vx5rpeb7wuctf8s.webp',
      'jtzr9kb8vf98szbiohc8wma5.webp',
      'l0omffpcb7howtrp6b3htyzi.webp',
      'nrcvmnldl7922uq9yhwj3mqp.webp',
      'r7cced5ai4kvjqirf8g5r4bw.webp',
      'wfabt9ybrsro9pdzja3ns2br.webp',
      'x822ydtkt4avju6s6mx1go1v.webp'
    ]
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      // 'type' est un boolean dans ton modèle
      type: faker.datatype.boolean(),
      // 'status' est un nombre (ex: 0 pour dispo, 1 pour réservé)
      status: faker.number.int({ min: 0, max: 2 }),
      categorie: faker.helpers.arrayElement([
        'Sport & Loisirs',
        'Culture & Livres',
        'Vêtements',
        'Informatique & Tech',
        'Maison & Cuisine',
        'Jouets & Enfants',
        'Électroménager',
        'Musique & Art',
        'Bureau & Fournitures',
      ]),
      imagePath: faker.helpers.arrayElement(availableImages),

      // Dates de disponibilité
      availableFrom: DateTime.fromJSDate(faker.date.soon()),
      availableUntil: DateTime.fromJSDate(faker.date.future()),

      // Note : userId et reservedBy seront gérés via les relations
      // ou passés manuellement lors de la création
    }
  })
  .build()
