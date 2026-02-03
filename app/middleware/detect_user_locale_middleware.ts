import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { type HttpContext, RequestValidator } from '@adonisjs/core/http'

export default class DetectUserLocaleMiddleware {
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  /**
   * Cette méthode va chercher les langues préférées du navigateur
   * et les comparer avec tes locales supportées (fr, en).
   */
  protected getRequestLocale(ctx: HttpContext) {
    const userLanguages = ctx.request.languages()
    // Si le navigateur dit "en-US", getSupportedLocaleFor renverra "en"
    return i18nManager.getSupportedLocaleFor(userLanguages) || i18nManager.defaultLocale
  }

  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * On récupère la langue détectée ou la langue par défaut (fr)
     */
    const language = this.getRequestLocale(ctx)

    /**
     * On instancie i18n avec cette langue
     */
    ctx.i18n = i18nManager.locale(language)

    /**
     * On partage l'instance avec Edge (tes vues)
     */
    if ('view' in ctx) {
      ctx.view.share({ i18n: ctx.i18n })
    }

    return next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n
  }
}
