import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { HttpContext } from '@adonisjs/core/http'

export default class DetectUserLocaleMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {

    const configLocales = i18nManager.config.supportedLocales
    const supportedLocales = Array.isArray(configLocales) 
      ? configLocales 
      : Object.keys(configLocales || { 'fr': {}, 'en': {} })


    let lang = ctx.request.input('lang')

    if (lang && supportedLocales.includes(lang)) {

      ctx.response.cookie('user_locale', lang, {
        path: '/',
        maxAge: '1y',
        sameSite: 'lax',
      })
    } else {

      lang = ctx.request.cookie('user_locale')
      

      if (!lang || !supportedLocales.includes(lang)) {
        const userLanguages = ctx.request.languages()
        lang = i18nManager.getSupportedLocaleFor(userLanguages) || i18nManager.defaultLocale
      }
    }


    ctx.i18n = i18nManager.locale(lang)

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