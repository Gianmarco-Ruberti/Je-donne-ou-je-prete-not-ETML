import vine from '@vinejs/vine'

// Définition des catégories pour validation (doit correspondre aux options du formulaire)
const categoriesList = [
  'Sport & Loisirs',
  'Culture & Livres',
  'Vêtements',
  'Informatique & Tech',
  'Maison & Cuisine',
  'Jouets & Enfants',
  'Électroménager',
  'Musique & Art',
  'Bureau & Fournitures',
]
export const createDonationObjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().escape().maxLength(5000).optional(),
    type: vine.enum(['0', '1']), 

    // Date de début : Obligatoire si Prêt ('1')
    available_from: vine.date({ formats: ['iso8601', 'yyyy-MM-dd\'T\'HH:mm'] })
      .optional()
      .requiredWhen('type', '=', '1'),

    // Date de fin : Obligatoire si Prêt ('1') + Doit être APRÈS le début
    available_until: vine.date({ formats: ['iso8601', 'yyyy-MM-dd\'T\'HH:mm'] })
      .afterField('available_from') 
      .optional()
      .requiredWhen('type', '=', '1'),

    categorie: vine.string().trim(),
    image: vine
      .file({
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      .optional(),
  })
)

export const updateDonationObjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().escape().maxLength(5000).optional(),
    type: vine.enum(['0', '1']),

    available_from: vine.date({ formats: ['iso8601', 'yyyy-MM-dd\'T\'HH:mm'] })
      .optional()
      .requiredWhen('type', '=', '1'),

    available_until: vine.date({ formats: ['iso8601', 'yyyy-MM-dd\'T\'HH:mm'] })
      .afterField('available_from')
      .optional()
      .requiredWhen('type', '=', '1'),

    categorie: vine.string().trim(),
    image: vine
      .file({
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      .optional(),
  })
)