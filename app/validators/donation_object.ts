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

    // Type : '0' pour Don, '1' pour Prêt
    type: vine.enum(['0', '1']),

    // Durée de réservation (en heures ou jours selon ton choix)
    // On la rend obligatoire seulement si type est '1'
    reservation_duration: vine.number()
      .positive()
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

    // Idem pour l'update, on peut vouloir changer la durée
    reservation_duration: vine.number()
      .positive()
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