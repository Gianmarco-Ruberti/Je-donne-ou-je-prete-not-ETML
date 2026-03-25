import mail from '@adonisjs/mail/services/main'
import { getNextMailerName } from '#config/mail'

type MailCallback = Parameters<typeof mail.send>[0]

/**
 * Envoie un email en utilisant un SMTP choisi dans le pool.
 * - Choix aléatoire d'un mailer dans smtpPool (config/mail.ts)
 * - En cas d'erreur, fallback sur le mailer par défaut "smtp"
 */
export async function sendWithPool(callback: MailCallback) {
  const mailerName = getNextMailerName()

  try {
    await mail.use(mailerName as never).send(callback)
  } catch (error) {
    console.error(`Erreur avec le mailer ${mailerName}`, error)

    // Fallback silencieux sur le mailer par défaut (Brevo)
    await mail.use('smtp').send(callback)
  }
}
