import vine from '@vinejs/vine'


const categoriesList = ['sport', 'books', 'clothes', 'tech', 'home', 'toys', 'appliances', 'art', 'office']

export const createDonationObjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().minLength(10).maxLength(5000).optional(),
    type: vine.enum(['0', '1']), 

    // Important: Le format correspond au <input type="datetime-local">
    available_from: vine.date({ formats: ['iso8601', "yyyy-MM-dd'T'HH:mm"] })
      .optional()
      .requiredWhen('type', '=', '1'),

    available_until: vine.date({ formats: ['iso8601', "yyyy-MM-dd'T'HH:mm"] })
      .afterField('available_from') 
      .optional()
      .requiredWhen('type', '=', '1'),

    // On valide que c'est bien une des clés techniques (ex: 'sport')
    categorie: vine.enum(categoriesList),
    
    image: vine.file({
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    }).optional(),
  })
)

export const updateDonationObjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().escape().minLength(10).maxLength(5000).optional(),
    type: vine.enum(['0', '1']),

    available_from: vine.date({ formats: ['iso8601', 'yyyy-MM-dd\'T\'HH:mm'] })
      .optional()
      .requiredWhen('type', '=', '1'),

    available_until: vine.date({ formats: ['iso8601', 'yyyy-MM-dd\'T\'HH:mm'] })
      .afterField('available_from')
      .optional()
      .requiredWhen('type', '=', '1'),

    categorie: vine.enum(categoriesList),
    image: vine
      .file({
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      .optional(),
  })
)