import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

export default defineConfig({
  defaultLocale: 'fr',
  formatter: formatters.icu(),
  supportedLocales: ['fr', 'en'], // Ajoute cette ligne !
  loaders: [
    loaders.fs({
      location: app.languageFilesPath(),
    }),
  ],
})
