// State konsol staff: salinan data dari API + aksi yang memanggil endpoint lalu memuat ulang data terkait.
// Validasi & state machine dijalankan server; pesan penolakannya ditampilkan sebagai toast.
import { api, session, type Role } from './api.svelte'

export type OutletStatus = 'application' | 'verification' | 'survey' | 'contract' | 'active' | 'revision' | 'rejected' | 'terminated'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved'
export type WasteStatus = 'requested' | 'assigned' | 'in_progress' | 'done' | 'settled'
export type Priority = 'high' | 'medium' | 'low'

export interface Contract { start: string; end: string; rent: number; service: number }
export interface Survey { date: string; note: string }
export interface Outlet {
  id: string; accountId: string; company: string; brand: string; category: string; unit: string; pic: string; email: string
  status: OutletStatus; reason: string; checks: Record<string, boolean>; provisions: Record<string, boolean>
  docs: Record<string, { fileName: string; storageKey: string | null }>; contract: Contract | null; survey: Survey | null; createdAt: string
}
export interface Ticket {
  id: string; outletId: string | null; place: string; category: string; title: string; priority: Priority; source: string; status: TicketStatus
  vendorId: string | null; vendorName: string | null; note: string; photoId: string | null; resolvePhotoId: string | null
  createdAt: string; startedAt: string | null; resolvedAt: string | null; deadline: string; late: boolean
}
export interface Invoice {
  id: string; outletId: string; brand: string; period: string; due: string; status: 'unpaid' | 'failed' | 'paid'; ref: string | null
  paidAt: string | null; linkSentAt: string | null; total: number; overdue: boolean; items: { label: string; amount: number }[]
}
export interface WasteRequest {
  id: string; outletId: string; place: string; type: string; service: 'regular' | 'express'; estimate: string; note: string; status: WasteStatus
  officerId: string | null; officer: string | null; checklist: string[]; weightKg: number | null; photoId: string | null
  createdAt: string; startedAt: string | null; doneAt: string | null; deadline: string; late: boolean
}
export interface Settlement { id: string; requestId: string; outletId: string; brand: string; incentive: number; fee: number; ref: string; at: string }
export interface Vendor { id: string; name: string; category: string }
export interface Score { id: string; name: string; active: number; resolved: number; inSla: number }
export interface PM { id: string; asset: string; vendorId: string; vendor: string; due: string; everyDays: number; overdue: boolean }
export interface Unit { code: string; terminal: string; status: 'kosong' | 'dalam proses' | 'terisi' }
export interface Officer { id: string; name: string; activeTasks: number }
export interface Partner { id: string; email: string; name: string; role: 'vendor' | 'officer'; vendorId: string | null; vendor: string | null; active: boolean; pending: boolean }
export interface StaffUser { id: string; email: string; name: string; role: Role; active: boolean; pending: boolean; createdAt: string }
export interface StaffEvent { userId: string; email: string | null; type: string; actor: string; note: string; at: string }
export interface AppEvent { id: string; type: string; actor: string; note: string; at: string }
export interface Revenue { byCategory: { category: string; billed: number; collected: number }[]; overdue: Invoice[]; expressFee: number }
export interface Dashboard {
  byType: { type: string; kg: number; co2Kg: number }[]; totalKg: number; recycledKg: number; co2AvoidedKg: number
  pickupsDone: number; pickupsInSla: number; incentivePaid: number; bins: { id: string; loc: string; type: string; fill: number }[]
}
export interface Meta {
  ticketCategories: { code: string; defaultVendorId: string }[]; sla: { priority: Priority; hours: number }[]
  wasteRates: { type: string; incentiveKg: number; co2Factor: number }[]; wasteServices: { service: string; slaMinutes: number; fee: number }[]
  outletCategories: string[]; docKinds: string[]; binChecks: string[]
}

export const STAGES: OutletStatus[] = ['application', 'verification', 'survey', 'contract', 'active']
export const STATUS_LABEL: Record<string, string> = {
  application: 'Pengajuan', verification: 'Verifikasi', survey: 'Survei', contract: 'Kontrak', active: 'Aktif',
  revision: 'Perlu revisi', rejected: 'Ditolak', terminated: 'Berakhir',
  open: 'Open', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved',
  requested: 'Menunggu', done: 'Selesai', settled: 'Settled',
  unpaid: 'Belum bayar', failed: 'Gagal bayar', paid: 'Lunas',
}
export const CHECKS: Record<string, string> = { profil: 'Profil & NIB', legal: 'Akta', finansial: 'NPWP', inspeksi: 'Inspeksi lokasi' }
export const PROVISIONS: Record<string, string> = { akses: 'Kartu akses', wallet: 'Wallet as a service'}
export const DOCS: Record<string, string> = { nib: 'Profil / NIB', akta: 'Akta', npwp: 'NPWP' }
export const WASTE_TYPES = ['plastik', 'organik', 'kardus', 'umum']

export const ROLES: Record<Role, string> = {
  tenant_relations: 'Tenant relations', operations: 'Operations', finance: 'Commercial / finance', dispatcher: 'Dispatcher waste', management: 'Manajemen',
  admin: 'Admin',
}
// cermin RBAC server, hanya untuk menampilkan/menonaktifkan tombol
const PERM = {
  tenant: ['tenant_relations'], ops: ['operations'], billing: ['finance'], dispatch: ['dispatcher'], settle: ['finance'], partners: ['operations', 'dispatcher'],
} satisfies Record<string, Role[]>
export type Perm = keyof typeof PERM
export const can = (perm: Perm) => !!session.user && (PERM[perm] as Role[]).includes(session.user.role)

// jam global: hitung mundur SLA & sisa hari ikut bergerak
export const clock = $state({ now: Date.now() })
export const toasts = $state<{ id: number; msg: string; tone: string }[]>([])
export function toast(msg: string, tone = 'ok') {
  const id = Math.random()
  toasts.push({ id, msg, tone })
  setTimeout(() => { const i = toasts.findIndex((x) => x.id === id); if (i >= 0) toasts.splice(i, 1) }, 3500)
}

const isoDay = (ts: number) => new Date(ts).toISOString().slice(0, 10)
export const today = () => isoDay(clock.now)
export const period = (offset = 0) => { const d = new Date(clock.now); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + offset); return isoDay(d.getTime()).slice(0, 7) }
export const daysLeft = (o: Outlet) => (o.contract ? Math.ceil((Date.parse(o.contract.end + 'T00:00:00Z') - clock.now) / 864e5) : 0)

// --- data dari API ---
export const db = $state({
  outlets: [] as Outlet[], tickets: [] as Ticket[], invoices: [] as Invoice[], waste: [] as WasteRequest[], settlements: [] as Settlement[],
  vendors: [] as Vendor[], scores: [] as Score[], pm: [] as PM[], units: [] as Unit[], officers: [] as Officer[], users: [] as Partner[],
  staff: [] as StaffUser[], staffEvents: [] as StaffEvent[],
  revenue: null as Revenue | null, dashboard: null as Dashboard | null, meta: null as Meta | null,
})
export type Key = keyof typeof db
const PATH: Record<Key, string> = {
  outlets: '/outlets', tickets: '/tickets', invoices: '/invoices', waste: '/waste', settlements: '/settlements', vendors: '/vendors',
  scores: '/vendors/scores', pm: '/pm', units: '/units', officers: '/officers', users: '/users', staff: '/staff', staffEvents: '/staff/events', revenue: '/revenue', dashboard: '/waste/dashboard', meta: '/meta',
}
const used = new Set<Key>()
export const dataState = $state<Partial<Record<Key, { pending: boolean; ready: boolean; error: string }>>>({})
let generation = 0
const requests = new Map<Key, number>()

/** Memuat koleksi dari API. Koleksi yang pernah dimuat ikut disegarkan oleh refresh(). */
export async function load(...keys: Key[]) {
  const current = generation
  await Promise.all(keys.map(async (k) => {
    used.add(k)
    const request = (requests.get(k) ?? 0) + 1
    requests.set(k, request)
    dataState[k] = { pending: true, ready: dataState[k]?.ready ?? false, error: '' }
    try {
      const value = await api('GET', PATH[k])
      if (generation !== current || requests.get(k) !== request) return
      ;(db as Record<Key, unknown>)[k] = value
      dataState[k] = { pending: false, ready: true, error: '' }
    } catch (e) {
      if (generation === current && requests.get(k) === request) dataState[k] = { pending: false, ready: dataState[k]?.ready ?? false, error: (e as Error).message }
    }
  }))
}
export const refresh = () => load(...used)
export const resetData = () => {
  generation++
  used.clear()
  for (const key of Object.keys(db) as Key[]) {
    ;(db as Record<Key, unknown>)[key] = ['meta', 'dashboard', 'revenue'].includes(key) ? null : []
    delete dataState[key]
  }
}

export const outletEvents = (id: string) => api<AppEvent[]>('GET', `/outlets/${id}/events`)
export const ticketEvents = (id: string) => api<AppEvent[]>('GET', `/tickets/${id}/events`)

async function run(fn: () => Promise<unknown>, reload: Key[], ok?: string): Promise<boolean> {
  try {
    await fn()
    await load(...reload)
    if (ok) toast(ok)
    return true
  } catch (e) {
    toast((e as Error).message, 'bad')
    return false
  }
}
const post = (path: string, body: unknown = {}) => api('POST', path, body)
const outlet = (id: string, action: string, body?: unknown, ok?: string) => run(() => post(`/outlets/${id}/${action}`, body), ['outlets', 'units'], ok)

// --- aksi (setara endpoint API) ---
export const actions = {
  startVerification: (id: string) => outlet(id, 'verification/start'),
  setCheck: (id: string, k: string, value: boolean) => outlet(id, `checks/${k}`, { value }),
  approve: (id: string) => outlet(id, 'approve', undefined, 'Verifikasi disetujui, lanjut survei'),
  completeSurvey: (id: string, survey: Survey) => outlet(id, 'survey/complete', survey, 'Survei selesai, lanjut kontrak'),
  reject: (id: string, reason: string) => outlet(id, 'reject', { reason }),
  revise: (id: string, reason: string) => outlet(id, 'revise', { reason }),
  saveContract: (id: string, c: { start: string; months: number; rent: number; service: number }) =>
    run(() => api('PUT', `/outlets/${id}/contract`, { ...c, months: Number(c.months), rent: Number(c.rent), service: Number(c.service) }), ['outlets'], 'Kontrak disimpan'),
  setProvision: (id: string, k: string, value: boolean) => outlet(id, `provisions/${k}`, { value }),
  activate: (id: string) => outlet(id, 'activate', undefined, 'Outlet aktif'),
  renew: (id: string, months: number, rent: number, service: number) => outlet(id, 'renew', { months, rent, service }, 'Kontrak diperpanjang'),
  terminate: (id: string) => outlet(id, 'terminate', undefined, 'Kontrak diakhiri'),

  createTicket: (f: { outletId: string; category: string; title: string; priority: Priority }) =>
    run(() => post('/tickets', { ...f, outletId: f.outletId || null }), ['tickets'], 'Ticket dibuat'),
  assignTicket: (id: string, vendorId: string) => run(() => post(`/tickets/${id}/assign`, { vendorId }), ['tickets', 'scores']),
  runPM: (id: string) => run(() => post(`/pm/${id}/run`), ['pm', 'tickets'], 'Work order PM dibuat'),

  generateInvoices: (per: string) => run(() => post('/invoices/generate', { period: per }), ['invoices'], `Invoice ${per} dibuat`),
  sendPayLink: (id: string) => run(() => post(`/invoices/${id}/send-link`), ['invoices'], 'Link bayar terkirim ke PIC'),
  // ponytail: hanya bila server MOCK_GATEWAY=true; di produksi status invoice berubah lewat webhook LinkAja
  mockCallback: (id: string, success: boolean) => run(() => post(`/invoices/${id}/mock-callback`, { success }), ['invoices'], success ? 'Pembayaran berhasil' : 'Pembayaran gagal'),

  assignWaste: (id: string, officerId: string) => run(() => post(`/waste/${id}/assign`, { officerId }), ['waste', 'officers']),
  settleWaste: (id: string) => run(() => post(`/waste/${id}/settle`), ['waste', 'settlements'], 'Settlement LinkAja berhasil'),

  async invite(f: { email: string; name: string; role: 'vendor' | 'officer'; vendorId: string }): Promise<string | null> {
    let code: string | null = null
    await run(async () => { code = (await post('/users/invite', { ...f, vendorId: f.vendorId || null }) as { inviteCode: string }).inviteCode }, ['users'], 'Undangan dibuat')
    return code
  },
  setActive: (id: string, value: boolean) => run(() => post(`/users/${id}/active`, { value }), ['users']),

  // admin: akun staff. createStaff & resetStaff mengembalikan kode undangan untuk diserahkan ke staff.
  async createStaff(f: { email: string; name: string; role: Role }): Promise<string | null> {
    let code: string | null = null
    await run(async () => { code = (await post('/staff', f) as { inviteCode: string }).inviteCode }, ['staff', 'staffEvents'], 'Akun staff dibuat')
    return code
  },
  setStaffRole: (id: string, role: Role) => run(() => post(`/staff/${id}/role`, { role }), ['staff', 'staffEvents'], 'Role diubah'),
  setStaffActive: (id: string, value: boolean) => run(() => post(`/staff/${id}/active`, { value }), ['staff', 'staffEvents']),
  async resetStaff(id: string): Promise<string | null> {
    let code: string | null = null
    await run(async () => { code = (await post(`/staff/${id}/reset`) as { inviteCode: string }).inviteCode }, ['staff', 'staffEvents'], 'Password direset')
    return code
  },
}
