'use client'

/**
 * Tab Pengguna — khusus Administrator (SUPER_ADMIN): daftar pengguna dan
 * pengubahan peran. Server menolak menurunkan SUPER_ADMIN terakhir.
 */
import { useAdminUsers, useUpdateUserRole } from '@/hooks/use-admin-data'
import { useToast } from '@/hooks/use-toast'
import { AdminErrorPanel, AdminEmpty, TableSkeleton, formatDateId } from './shared'
import { ROLE_LABEL, USER_ROLES, type AdminUserRecord, type SessionUser, type UserRole } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ShieldAlert } from 'lucide-react'

export function UsersTab({ me }: { me: SessionUser }) {
  const { toast } = useToast()
  const { data: users, isLoading, isError, error, refetch } = useAdminUsers()
  const roleMut = useUpdateUserRole()

  const superCount = (users ?? []).filter((u) => u.role === 'SUPER_ADMIN').length

  /**
   * Kunci selektor peran: baris sendiri bila diri satu-satunya SUPER_ADMIN.
   * Server TETAP menolak (400) bila mencoba menurunkan SUPER_ADMIN terakhir —
   * galat ditangani via toast.
   */
  const isLocked = (u: AdminUserRecord): boolean =>
    roleMut.isPending ||
    (u.id === me.id && u.role === 'SUPER_ADMIN' && superCount <= 1)

  const changeRole = (u: AdminUserRecord, role: string) => {
    roleMut.mutate(
      { id: u.id, role },
      {
        onSuccess: () =>
          toast({ title: 'Peran diperbarui', description: `${u.name} kini berperan sebagai ${ROLE_LABEL[role as UserRole]}.` }),
        onError: (e: Error) =>
          toast({ title: 'Gagal mengubah peran', description: e.message, variant: 'destructive' }),
      },
    )
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="rounded-xl border p-4">
          <TableSkeleton rows={4} />
        </div>
      ) : isError ? (
        <AdminErrorPanel
          message={error instanceof Error ? error.message : 'Coba lagi nanti.'}
          onRetry={() => void refetch()}
        />
      ) : (users?.length ?? 0) === 0 ? (
        <AdminEmpty message="Belum ada pengguna terdaftar" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="min-w-36">Nama</TableHead>
                <TableHead className="min-w-48">Email</TableHead>
                <TableHead className="min-w-44">Peran</TableHead>
                <TableHead className="text-right">Kontribusi</TableHead>
                <TableHead className="min-w-28">Terdaftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.name}
                    {u.id === me.id && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-teal">
                        (Anda)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => changeRole(u, v)} disabled={isLocked(u)}>
                      <SelectTrigger
                        aria-label={`Peran ${u.name}`}
                        className="h-8 w-44 text-xs"
                        title={isLocked(u) ? 'Minimal satu Administrator harus tetap ada.' : undefined}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">{u.contributionCount}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateId(u.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-gold" />
        Peran menentukan akses panel pengelola dan kemampuan moderasi. Minimal satu Administrator harus tetap ada —
        sistem menolak penurunan peran Administrator terakhir.
      </p>
    </div>
  )
}
