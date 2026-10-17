'use client'

/**
 * ContributeView — formulir kontribusi budaya (wajib masuk).
 * Alur: pengguna mengirim → status SUBMITTED → ditinjau kurator manusia
 * (keputusan akhir). Catatan kurasi otomatis (AI) hanya pelengkap.
 * Moderasi kini berada di panel admin (terproteksi role) — tidak lagi di sini.
 */
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  useMe, useProvinces, useCategories, useSubmitContribution,
} from '@/hooks/use-waradata'
import { useWaranusa } from '@/store/waranusa'
import { CONTRIBUTION_STATUS_LABEL, type ContributionRecord } from '@/lib/types'
import {
  Send, HandHeart, Lock, LogIn, History, ScrollText, UserRoundCheck, ListChecks, Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

const NONE_PROVINCE = 'NONE'

interface FormErrors {
  category?: string
  title?: string
  content?: string
}

export function ContributeView() {
  const { toast } = useToast()
  const setView = useWaranusa((s) => s.setView)
  const setLoginRedirect = useWaranusa((s) => s.setLoginRedirect)
  const { data: user, isLoading: meLoading } = useMe()
  const { data: provinces } = useProvinces()
  const { data: categories } = useCategories()
  const submit = useSubmitContribution()

  const [provinceId, setProvinceId] = useState(NONE_PROVINCE)
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceRef, setSourceRef] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [lastContribution, setLastContribution] = useState<ContributionRecord | null>(null)

  const goMasuk = () => {
    setLoginRedirect('kontribusi')
    setView('masuk')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goRiwayat = () => {
    setView('riwayat')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!category) next.category = 'Pilih kategori budaya terlebih dahulu.'
    const t = title.trim()
    if (t.length < 3 || t.length > 120) next.title = 'Judul harus terdiri dari 3 sampai 120 karakter.'
    const c = content.trim()
    if (c.length < 20 || c.length > 4000) next.content = 'Deskripsi harus terdiri dari 20 sampai 4000 karakter.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    submit.mutate(
      {
        provinceId: provinceId === NONE_PROVINCE ? null : provinceId,
        category,
        title: title.trim(),
        content: content.trim(),
        sourceRef: sourceRef.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setLastContribution(data.contribution)
          toast({
            title: 'Kontribusi terkirim — menunggu peninjauan kurator.',
            description: 'Anda dapat memantau statusnya di halaman riwayat kontribusi.',
          })
          setTitle('')
          setContent('')
          setSourceRef('')
          setCategory('')
          setProvinceId(NONE_PROVINCE)
          setErrors({})
        },
        onError: (err: Error) => {
          toast({ title: 'Gagal mengirim kontribusi', description: err.message, variant: 'destructive' })
        },
      },
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Banner ilustrasi */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border shadow-sm">
        <img
          src="/images/kontribusi.png"
          alt="Ilustrasi kolaborasi komunitas menjaga warisan budaya"
          className="h-40 w-full object-cover sm:h-52"
          width={1344}
          height={768}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center gap-1 p-6 sm:p-10">
          <h1 className="font-display text-3xl font-bold text-white drop-shadow sm:text-4xl">Kontribusi Budaya</h1>
          <p className="max-w-lg text-sm text-white/85 sm:text-base">
            Tambahkan informasi atau dokumentasi budaya daerah Anda. Setiap kiriman ditinjau kurator
            sebelum dipublikasikan agar arsip tetap kredibel.
          </p>
        </div>
      </div>

      {/* Status sesi sedang diperiksa */}
      {meLoading && (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Memuat halaman kontribusi">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {/* Gate: belum masuk */}
      {!meLoading && !user && (
        <Card className="mx-auto max-w-xl rounded-2xl shadow-sm">
          <CardHeader>
            <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" aria-hidden />
            </span>
            <CardTitle className="font-display text-2xl">Masuk untuk Berkontribusi</CardTitle>
            <CardDescription>
              Kontribusi budaya dilakukan dengan akun agar setiap kiriman memiliki atribusi nama
              dan dapat ditinjau kurator. Setelah masuk, alur kontribusi Anda adalah:
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ol className="grid gap-2 text-sm text-muted-foreground">
              {[
                'Diajukan — kiriman Anda masuk dengan status Diajukan.',
                'Menunggu peninjauan — kurator memeriksa isi dan sumbernya.',
                'Keputusan — Disetujui, Perlu Revisi, atau Ditolak.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <Button onClick={goMasuk} className="w-full gap-2 sm:w-fit">
              <LogIn className="h-4 w-4" aria-hidden /> Masuk / Daftar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sudah masuk: formulir + info */}
      {!meLoading && user && (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          {/* (a) Formulir */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HandHeart className="h-5 w-5" aria-hidden />
                </span>
                Formulir Kontribusi
              </CardTitle>
              <CardDescription>
                Bagikan pengetahuan budaya daerah Anda: rumah adat, tarian, alat musik, makanan, atau tradisi lainnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-label="Formulir kontribusi budaya">
                <div className="grid gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="c-title">Judul kontribusi</Label>
                    <span className="text-[11px] tabular-nums text-muted-foreground" aria-hidden>{title.length}/120</span>
                  </div>
                  <Input
                    id="c-title"
                    required
                    minLength={3}
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Tari Baris War dari Bali"
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? 'c-title-error' : undefined}
                  />
                  {errors.title && (
                    <p id="c-title-error" className="text-xs text-destructive" role="alert">{errors.title}</p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="c-category">Kategori budaya</Label>
                  <Select value={category} onValueChange={(v) => { setCategory(v); setErrors((p) => ({ ...p, category: undefined })) }}>
                    <SelectTrigger id="c-category" aria-invalid={!!errors.category} aria-label="Kategori budaya">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((c) => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category ? (
                    <p className="text-xs text-destructive" role="alert">{errors.category}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Kategori membantu kurator mengelompokkan kontribusi Anda.</p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="c-province">Provinsi terkait</Label>
                  <Select value={provinceId} onValueChange={setProvinceId}>
                    <SelectTrigger id="c-province" aria-label="Provinsi terkait">
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value={NONE_PROVINCE}>Umum / lintas wilayah</SelectItem>
                      {(provinces ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="c-content">Deskripsi</Label>
                    <span className="text-[11px] tabular-nums text-muted-foreground" aria-hidden>{content.length}/4000</span>
                  </div>
                  <Textarea
                    id="c-content"
                    required
                    minLength={20}
                    maxLength={4000}
                    rows={7}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Jelaskan asal-usul, fungsi, dan konteks budaya (minimal 20 karakter)…"
                    aria-invalid={!!errors.content}
                    aria-describedby={errors.content ? 'c-content-error c-content-helper' : 'c-content-helper'}
                  />
                  <p id="c-content-helper" className="text-xs text-muted-foreground">
                    Jelaskan asal-usul, fungsi, dan konteks budaya.
                  </p>
                  {errors.content && (
                    <p id="c-content-error" className="text-xs text-destructive" role="alert">{errors.content}</p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="c-source">
                    Referensi sumber <span className="font-normal text-muted-foreground">(opsional)</span>
                  </Label>
                  <Input
                    id="c-source"
                    maxLength={300}
                    value={sourceRef}
                    onChange={(e) => setSourceRef(e.target.value)}
                    placeholder="Contoh: Buku …, situs museum.go.id, atau wawancara narasumber"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cantumkan buku, situs resmi, atau narasumber agar mudah diverifikasi.
                  </p>
                </div>

                <Button type="submit" disabled={submit.isPending} className="mt-1 w-full gap-2 sm:w-fit">
                  {submit.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Mengirim…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden /> Kirim Kontribusi
                    </>
                  )}
                </Button>

                {/* Kartu sukses inline */}
                {lastContribution && (
                  <div className="rounded-xl border border-emerald-600/30 bg-emerald-50/60 p-4 dark:bg-emerald-950/20" role="status">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserRoundCheck className="h-4.5 w-4.5 text-emerald-600" aria-hidden />
                      <p className="text-sm font-semibold text-foreground">Kontribusi berhasil dikirim</p>
                      <Badge variant="outline" className="border-teal-600/50 bg-teal-50/70 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                        {CONTRIBUTION_STATUS_LABEL[lastContribution.status]} ({lastContribution.status})
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{lastContribution.title}</p>
                    {lastContribution.aiNote && (
                      <div className="mt-2 rounded-lg bg-muted/70 p-2.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Catatan kurasi otomatis (AI) — bukan keputusan akhir:
                        </p>
                        <p className="mt-0.5 text-xs italic text-muted-foreground">{lastContribution.aiNote}</p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={goRiwayat} className="mt-3 gap-1.5">
                      <History className="h-3.5 w-3.5" aria-hidden /> Lihat Riwayat Kontribusi
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* (b) Info setelah dikirim */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-orange">
                  <ScrollText className="h-5 w-5" aria-hidden />
                </span>
                Setelah Dikirim
              </CardTitle>
              <CardDescription>Alur peninjauan kontribusi Anda oleh kurator.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ol className="grid gap-3">
                {[
                  { judul: 'Diajukan', isi: 'Kiriman Anda tercatat dengan status Diajukan (SUBMITTED) dan langsung masuk antrean kurasi.' },
                  { judul: 'Peninjauan kurator', isi: 'Kurator memeriksa keakuratan isi serta referensi yang Anda cantumkan.' },
                  { judul: 'Keputusan', isi: 'Kontribusi dapat Disetujui, diminta Perlu Revisi, atau Ditolak beserta catatan peninjauan.' },
                ].map((langkah, i) => (
                  <li key={langkah.judul} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{langkah.judul}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{langkah.isi}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Separator />
              <div className="flex items-start gap-2.5 rounded-xl bg-muted/60 p-3">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Konten yang disetujui menjadi objek budaya di katalog dengan atribusi nama Anda.
                </p>
              </div>
              <Button variant="outline" onClick={goRiwayat} className="w-full gap-2">
                <History className="h-4 w-4" aria-hidden /> Lihat Riwayat Kontribusi
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.section>
  )
}
