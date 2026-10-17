'use client'

/**
 * AuthView — halaman masuk & pendaftaran WaraNusa.
 * Setelah sukses, pengguna diarahkan ke tujuan tersimpan (loginRedirect)
 * atau kembali ke beranda. Memuat kartu akun demonstrasi untuk penilaian.
 */
import { useState } from 'react'
import { useWaranusa } from '@/store/waranusa'
import { useMe, useLogin, useRegister, useLogout } from '@/hooks/use-waradata'
import { ROLE_LABEL } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertCircle,
  HandHeart,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Map,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
} from 'lucide-react'
import { motion } from 'framer-motion'

const DEMO_PASSWORD = 'waranusa123'

const DEMO_ACCOUNTS: { email: string; role: string; desc: string }[] = [
  { email: 'admin@waranusa.id', role: 'Administrator', desc: 'Akses penuh: CMS budaya, moderasi, dan pengguna' },
  { email: 'editor@waranusa.id', role: 'Editor', desc: 'Mengelola katalog objek budaya & provinsi' },
  { email: 'kurator@waranusa.id', role: 'Kurator', desc: 'Meninjau dan memutuskan kontribusi komunitas' },
  { email: 'warga@waranusa.id', role: 'Kontributor', desc: 'Mengirim kontribusi budaya baru' },
]

export function AuthView() {
  const { toast } = useToast()
  const setView = useWaranusa((s) => s.setView)
  const loginRedirect = useWaranusa((s) => s.loginRedirect)
  const setLoginRedirect = useWaranusa((s) => s.setLoginRedirect)
  const { data: user, isLoading: meLoading } = useMe()
  const logout = useLogout()

  const [tab, setTab] = useState('masuk')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regError, setRegError] = useState<string | null>(null)

  const login = useLogin()
  const register = useRegister()

  const goAfterAuth = (nama: string, judulToast: string, deskToast: string) => {
    toast({ title: judulToast, description: deskToast })
    const target = loginRedirect ?? 'jelajah'
    setLoginRedirect(null)
    setView(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    login.mutate(
      { email: loginEmail.trim(), password: loginPassword },
      {
        onSuccess: (data) =>
          goAfterAuth(
            data.user.name,
            `Selamat datang, ${data.user.name}!`,
            'Anda berhasil masuk ke WaraNusa.',
          ),
        onError: (err: Error) => setLoginError(err.message),
      },
    )
  }

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    if (regName.trim().length < 2 || regName.trim().length > 60) {
      setRegError('Nama harus terdiri dari 2 sampai 60 karakter.')
      return
    }
    if (regPassword.length < 8 || regPassword.length > 72) {
      setRegError('Kata sandi harus terdiri dari 8 sampai 72 karakter.')
      return
    }
    if (regPassword !== regConfirm) {
      setRegError('Konfirmasi kata sandi tidak sama dengan kata sandi.')
      return
    }
    register.mutate(
      { name: regName.trim(), email: regEmail.trim(), password: regPassword },
      {
        onSuccess: (data) =>
          goAfterAuth(
            data.user.name,
            `Selamat datang, ${data.user.name}!`,
            'Akun berhasil dibuat. Anda dapat langsung berkontribusi.',
          ),
        onError: (err: Error) => setRegError(err.message),
      },
    )
  }

  const fillDemo = (email: string) => {
    setTab('masuk')
    setLoginEmail(email)
    setLoginPassword(DEMO_PASSWORD)
    setLoginError(null)
  }

  /* --- Status sesi sedang diperiksa --- */
  if (meLoading) {
    return (
      <section
        className="mx-auto w-full max-w-md px-4 py-14 sm:px-0"
        aria-busy="true"
        aria-label="Memuat status sesi"
      >
        <div className="grid gap-4">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </section>
    )
  }

  /* --- Sudah login: tampilkan kartu sesi aktif --- */
  if (user) {
    return (
      <section className="mx-auto w-full max-w-md px-4 py-14 sm:px-0">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full rounded-2xl shadow-sm">
            <CardHeader>
              <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" aria-hidden />
              </span>
              <CardTitle className="font-display text-2xl">Anda sudah masuk</CardTitle>
              <CardDescription>
                Anda masuk sebagai <span className="font-semibold text-foreground">{user.name}</span> ({ROLE_LABEL[user.role]}).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2.5">
              <p className="text-sm text-muted-foreground">
                Email: <span className="font-medium text-foreground">{user.email}</span>
              </p>
              <Button
                onClick={() => {
                  setView('jelajah')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="mt-1 w-full gap-2"
              >
                <Map className="h-4 w-4" aria-hidden /> Ke Beranda
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={logout.isPending}
                onClick={() =>
                  logout.mutate(undefined, {
                    onSuccess: () =>
                      toast({
                        title: 'Anda telah keluar.',
                        description: 'Sesi Anda diakhiri dengan aman.',
                      }),
                    onError: (err: Error) =>
                      toast({
                        title: 'Gagal keluar',
                        description: err.message,
                        variant: 'destructive',
                      }),
                  })
                }
              >
                {logout.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden />
                )}
                Keluar
              </Button>
            </CardContent>
          </Card>
        </motion.section>
      </section>
    )
  }

  /* --- Belum login: kartu masuk/daftar + panel brand --- */
  return (
    <section className="mx-auto flex w-full max-w-5xl items-start justify-center gap-12 px-4 py-12 sm:px-6 lg:py-16">
      {/* Panel brand (tersembunyi di mobile) */}
      <aside className="hidden w-full max-w-sm shrink-0 flex-col gap-5 pt-6 lg:flex" aria-hidden="true">
        <div className="flex items-center gap-3.5">
          <img
            src="/images/brand/emblem.png"
            alt=""
            className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-1 ring-border"
            width={64}
            height={64}
          />
          <div>
            <p className="font-display text-3xl font-bold tracking-tight text-foreground">WaraNusa</p>
            <p className="text-sm font-medium text-primary">Nusantara dalam Satu Peta</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Jelajahi peta interaktif, pelajari rumah adat dalam visual 3D, mainkan instrumen tradisional,
          dan lestarikan warisan budaya bersama komunitas seluruh Indonesia.
        </p>
        <Separator />
        <ul className="grid gap-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2.5">
            <Map className="h-4 w-4 shrink-0 text-brand-teal" />
            18 provinsi dengan ratusan objek budaya terdokumentasi
          </li>
          <li className="flex items-center gap-2.5">
            <HandHeart className="h-4 w-4 shrink-0 text-brand-orange" />
            Kontribusi warga ditinjau kurator sebelum dipublikasikan
          </li>
          <li className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-green" />
            Arsip bersumber jelas dengan atribusi penyumbang
          </li>
        </ul>
      </aside>

      {/* Kartu autentikasi */}
      <div className="grid w-full max-w-md gap-4">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-2xl">Selamat Datang</CardTitle>
              <CardDescription>
                Masuk untuk berkontribusi dan mengelola warisan budaya Nusantara.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="masuk" className="gap-1.5">
                    <LogIn className="h-4 w-4" aria-hidden /> Masuk
                  </TabsTrigger>
                  <TabsTrigger value="daftar" className="gap-1.5">
                    <UserRoundPlus className="h-4 w-4" aria-hidden /> Daftar
                  </TabsTrigger>
                </TabsList>

                {/* Form Masuk */}
                <TabsContent value="masuk" className="pt-4">
                  <form onSubmit={onLogin} className="grid gap-4" aria-label="Formulir masuk">
                    <div className="grid gap-1.5">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="login-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="nama@contoh.id"
                          className="pl-9"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          aria-label="Email"
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="login-password">Kata Sandi</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="login-password"
                          type="password"
                          required
                          minLength={8}
                          autoComplete="current-password"
                          placeholder="Minimal 8 karakter"
                          className="pl-9"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          aria-label="Kata sandi"
                        />
                      </div>
                    </div>
                    {loginError && (
                      <Alert variant="destructive" role="alert">
                        <AlertCircle className="h-4 w-4" aria-hidden />
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="mt-1 w-full gap-2" disabled={login.isPending}>
                      {login.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memproses…
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" aria-hidden /> Masuk
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Form Daftar */}
                <TabsContent value="daftar" className="pt-4">
                  <form onSubmit={onRegister} className="grid gap-4" aria-label="Formulir pendaftaran">
                    <div className="grid gap-1.5">
                      <Label htmlFor="reg-name">Nama Lengkap</Label>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="reg-name"
                          type="text"
                          required
                          minLength={2}
                          maxLength={60}
                          autoComplete="name"
                          placeholder="Nama Anda (2-60 karakter)"
                          className="pl-9"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          aria-label="Nama lengkap"
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="reg-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="reg-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="nama@contoh.id"
                          className="pl-9"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          aria-label="Email pendaftaran"
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="reg-password">Kata Sandi</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="reg-password"
                          type="password"
                          required
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          placeholder="8-72 karakter"
                          className="pl-9"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          aria-label="Kata sandi baru"
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="reg-confirm">Konfirmasi Kata Sandi</Label>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="reg-confirm"
                          type="password"
                          required
                          autoComplete="new-password"
                          placeholder="Ulangi kata sandi"
                          className="pl-9"
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          aria-label="Konfirmasi kata sandi"
                        />
                      </div>
                      {regConfirm.length > 0 && regPassword !== regConfirm && (
                        <p className="text-xs text-destructive" role="alert">
                          Konfirmasi kata sandi belum sama.
                        </p>
                      )}
                    </div>
                    {regError && (
                      <Alert variant="destructive" role="alert">
                        <AlertCircle className="h-4 w-4" aria-hidden />
                        <AlertDescription>{regError}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="mt-1 w-full gap-2" disabled={register.isPending}>
                      {register.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Mendaftarkan…
                        </>
                      ) : (
                        <>
                          <UserRoundPlus className="h-4 w-4" aria-hidden /> Buat Akun
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.section>

        {/* Kartu akun demonstrasi */}
        <Card className="rounded-2xl border-dashed shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" aria-hidden /> Akun Demonstrasi
            </CardTitle>
            <CardDescription>
              Untuk penilaian: klik salah satu baris untuk mengisi formulir masuk secara otomatis.
              Kata sandi semua akun: <span className="font-mono font-semibold text-foreground">waranusa123</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc.email)}
                aria-label={`Gunakan akun demonstrasi ${acc.role}, ${acc.email}`}
                className="flex flex-col rounded-xl border bg-muted/40 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-semibold text-foreground">{acc.email}</span>
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                    {acc.role}
                  </span>
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">{acc.desc}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
