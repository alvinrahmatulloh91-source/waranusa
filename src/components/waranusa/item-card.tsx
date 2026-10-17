'use client'

import { Badge } from '@/components/ui/badge'
import { CATEGORY_MAP } from '@/data/islands'
import { useWaranusa } from '@/store/waranusa'
import type { CulturalItemFull } from '@/lib/types'
import { Box, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function ItemCard({ item, showProvince = false }: { item: CulturalItemFull; showProvince?: boolean }) {
  const openItemDetail = useWaranusa((s) => s.openItemDetail)
  const cat = CATEGORY_MAP[item.category]

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35 }}
      onClick={() => openItemDetail(item.id)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
      aria-label={`Lihat detail ${item.name}`}
    >
      <div className="relative h-32 w-full overflow-hidden sm:h-36">
        { }
        <img
          src={item.imageUrl ?? cat?.image ?? '/images/arsip-banner.png'}
          alt={`Ilustrasi ${item.name}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          loading="lazy"
          width={1152}
          height={864}
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge className="bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {cat?.label ?? item.category}
          </Badge>
        </div>
        <div className="absolute right-2 top-2 flex gap-1">
          {item.model3d && (
            <Badge className="gap-1 bg-brand-gold/95 px-1.5 py-0.5 text-[10px] font-semibold text-stone-900 backdrop-blur-sm">
              <Box className="h-3 w-3" /> 3D
            </Badge>
          )}
          {item.playable && (
            <Badge className="gap-1 bg-brand-green/95 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Volume2 className="h-3 w-3" /> Audio
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="font-display text-[15px] font-bold leading-snug text-foreground">{item.name}</p>
        {showProvince && item.province && (
          <p className="text-[11px] font-medium text-primary">{item.province.name}</p>
        )}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.shortDesc}</p>
      </div>
    </motion.button>
  )
}
