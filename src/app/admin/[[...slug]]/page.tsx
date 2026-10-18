'use client'

/**
 * Route /admin/[[...slug]] — rute App Router untuk CMS WaraNusa:
 * Mendukung URL langsung:
 * - /admin/dashboard
 * - /admin/cultural-items
 * - /admin/regions
 * - /admin/categories
 * - /admin/media
 * - /admin/sources
 * - /admin/contributions
 * - /admin/users
 */
import { use } from 'react'
import { Providers } from '@/components/waranusa/providers'
import { SiteHeader } from '@/components/waranusa/site-header'
import { SiteFooter } from '@/components/waranusa/site-footer'
import { AdminView } from '@/components/waranusa/views/admin-view'

export default function AdminPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug?.[0] ?? 'dashboard'

  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <AdminView key={slug} initialTab={slug} />
        </main>
        <SiteFooter />
      </div>
    </Providers>
  )
}
