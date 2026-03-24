import { Logger } from '@adonisjs/core/logger'
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import { execSync } from 'node:child_process'

/**
 * The container bindings middleware binds classes to their request
 * specific value using the container resolver.
 *
 * - We bind "HttpContext" class to the "ctx" object
 * - And bind "Logger" class to the "ctx.logger" object
 */
export default class ContainerBindingsMiddleware {
  private static cachedRepoVersion: string | null = null

  private static computeRepoVersion() {
    if (this.cachedRepoVersion) {
      return this.cachedRepoVersion
    }

    try {
      const rawCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim()
      const commitCount = Number.parseInt(rawCount, 10)

      if (Number.isNaN(commitCount) || commitCount < 0) {
        this.cachedRepoVersion = 'V0.00'
        return this.cachedRepoVersion
      }

      const major = Math.floor(commitCount / 100)
      const minor = (commitCount % 100).toString().padStart(2, '0')

      this.cachedRepoVersion = `V${major}.${minor}`
      return this.cachedRepoVersion
    } catch {
      this.cachedRepoVersion = 'V0.00'
      return this.cachedRepoVersion
    }
  }

  handle(ctx: HttpContext, next: NextFn) {
    ctx.containerResolver.bindValue(HttpContext, ctx)
    ctx.containerResolver.bindValue(Logger, ctx.logger)
    ctx.view.share({ repoVersion: ContainerBindingsMiddleware.computeRepoVersion() })

    return next()
  }
}
