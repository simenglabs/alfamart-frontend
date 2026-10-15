// Klien Alfamart API (backend/). Semua data & aturan ada di server; web hanya menampilkan dan mengirim aksi.

// Production Caddy and the local Vite proxy both expose the InJourney API at /api.
const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api'
const KEY = 'alfamart-staff-session'
// admin memakai web hanya untuk mengelola akun staff
export const STAFF = ['tenant_relations', 'operations', 'finance', 'dispatcher', 'management', 'admin'] as const
export type Role = (typeof STAFF)[number]
export interface User { id: string; email: string; name: string; role: Role }

function saved(): { token: string | null; user: User | null } {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? { token: null, user: null } } catch { return { token: null, user: null } }
}
// ponytail: token di localStorage; pindah ke cookie httpOnly bila konsol dibuka di luar jaringan internal
export const session = $state(saved())

function setSession(token: string | null, user: User | null) {
  session.token = token
  session.user = user
  try { if (token) localStorage.setItem(KEY, JSON.stringify({ token, user })); else localStorage.removeItem(KEY) } catch { /* storage diblok: sesi hanya di tab ini */ }
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Tidak bisa terhubung ke server API')
  }
}

export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await send(method, path, body)
  const j = await res.json().catch(() => ({}))
  if (res.status === 401 && session.token) setSession(null, null) // token kedaluwarsa: kembali ke login
  if (!res.ok) throw new Error(j.error ?? `Terjadi kesalahan (${res.status})`)
  return j.data as T
}

export async function apiBlob(path: string): Promise<Blob> {
  const res = await send('GET', path)
  if (!res.ok) throw new Error(`Gagal memuat file (${res.status})`)
  return res.blob()
}

function start(s: { token: string; user: User }) {
  if (!STAFF.includes(s.user.role)) throw new Error('Akun ini untuk aplikasi mobile Alfamart')
  setSession(s.token, s.user)
}
export const login = async (email: string, password: string) => start(await api('POST', '/auth/login', { email, password }))
/** Aktivasi akun staff baru / setelah reset password, memakai kode dari admin. */
export const acceptInvite = async (code: string, password: string) => start(await api('POST', '/auth/invite/accept', { code, password }))


export const logout = () => setSession(null, null)
