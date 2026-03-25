import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

/**
 * Construction automatique du pool SMTP à partir du .env.
 *
 * - SMTP_HOST / SMTP_PORT / SMTP_USERNAME / SMTP_PASSWORD → smtp1 (obligatoire)
 * - SMTP2_HOST / SMTP2_PORT / SMTP2_USERNAME / SMTP2_PASSWORD → smtp2 (optionnel)
 * - SMTP3_HOST ... jusqu'à SMTP10_HOST (par défaut) → smtp3..smtp10
 */
const smtpPool: {
  name: string
  host: string
  port: number
  user: string
  pass: string
}[] = []

// smtp1 basé sur la config principale
smtpPool.push({
  name: 'smtp1',
  host: env.get('SMTP_HOST'),
  port: env.get('SMTP_PORT'),
  user: env.get('SMTP_USERNAME'),
  pass: env.get('SMTP_PASSWORD'),
})

// smtp2..smtp10 basés sur SMTP2_*, SMTP3_* ... SMTP10_*
for (let i = 2; i <= 10; i++) {
  const prefix = `SMTP${i}_`

  const host = env.get((prefix + 'HOST') as any, '') as string
  const user = env.get((prefix + 'USERNAME') as any, '') as string
  const pass = env.get((prefix + 'PASSWORD') as any, '') as string
  const port = env.get((prefix + 'PORT') as any, 587) as number

  if (host && user && pass) {
    smtpPool.push({
      name: `smtp${i}`,
      host,
      port,
      user,
      pass,
    })
  }
}

// On garde uniquement les entrées complètes (sécurité supplémentaire)
const validSmtpPool = smtpPool.filter((s) => !!s.host && !!s.user && !!s.pass)

export function getNextMailerName() {
  if (validSmtpPool.length === 0) {
    // Sécurité : revient sur le mailer par défaut "smtp"
    return 'smtp'
  }

  // Sélection aléatoire dans la liste des SMTP disponibles
  const randomIndex = Math.floor(Math.random() * validSmtpPool.length)
  return validSmtpPool[randomIndex].name
}

const dynamicMailers: Record<string, ReturnType<typeof transports.smtp>> = {}

for (const smtp of validSmtpPool) {
  dynamicMailers[smtp.name] = transports.smtp({
    host: smtp.host,
    port: smtp.port,
    auth: {
      type: 'login',
      user: smtp.user,
      pass: smtp.pass,
    },
  })
}

const mailConfig = defineConfig({
  // Mailer par défaut "smtp" = la config principale (utile comme fallback)
  default: 'smtp',

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME'),
        pass: env.get('SMTP_PASSWORD'),
      },
    }),

    // Mailers dynamiques (smtp1..smtp10) générés automatiquement
    ...dynamicMailers,
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
