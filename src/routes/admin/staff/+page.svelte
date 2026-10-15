<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import { session, type Role } from '$lib/api.svelte'
  import { db, actions, load, ROLES } from '$lib/store.svelte'
  import { fmtTime } from '$lib/format'

  onMount(() => load('staff', 'staffEvents'))
  const roles = Object.entries(ROLES) as [Role, string][]
  let f = $state({ email: '', name: '', role: 'tenant_relations' as Role })
  // kode undangan hanya ditampilkan sekali, untuk diserahkan admin ke staff terkait
  let code = $state<{ who: string; code: string; reason: string } | null>(null)

  let access = $state<{ id: string; email: string; role?: Role; active?: boolean } | null>(null)
  let reviewing = $state(false)
  let accessBusy = $state(false)
  let accessError = $state('')
  async function saveAccess() {
    if (!access || accessBusy) return
    accessBusy = true; accessError = ''
    const ok = access.role ? await actions.setStaffRole(access.id, access.role) : await actions.setStaffActive(access.id, access.active!)
    accessBusy = false
    if (ok) { reviewing = false; access = null }
    else accessError = 'Perubahan belum tersimpan. Coba lagi.'
  }
  let creating = $state(false)
  let saving = $state(false)
  let formError = $state('')

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (saving) return
    formError = ''
    saving = true
    try {
      const c = await actions.createStaff(f)
      if (c) {
        creating = false
        code = { who: f.email, code: c, reason: 'akun baru' }
        f = { email: '', name: '', role: 'tenant_relations' }
      } else { formError = 'Undangan belum berhasil dibuat. Periksa email dan pilihan akun lalu coba lagi.' }
    } finally { saving = false }
  }
  async function reset(id: string, email: string) {
    if (!confirm(`Reset password ${email}? Sesi yang sedang aktif akan keluar.`)) return
    const c = await actions.resetStaff(id)
    if (c) code = { who: email, code: c, reason: 'reset password' }
  }
</script>

<DataState keys={['staff', 'staffEvents']}>


<div class="stack">
  <div class="create-toolbar"><p class="muted">Kelola akun dan hak akses staff.</p><button onclick={() => { formError = ''; creating = true }}>+ Tambah akun staff</button></div>
    {#if code}
      <p class="note">Kode {code.reason} untuk {code.who}: <span class="code">{code.code}</span><br />
        Serahkan lewat kanal aman. Staff membuka konsol → "Punya kode undangan / reset password?" lalu membuat password. Kode hanya berlaku sekali.</p>
    {/if}

  <section class="panel scroll-x">
    <h3>Akun staff</h3>
    <table class="mobile-records">
      <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {#each db.staff as u (u.id)}
          {@const self = u.id === session.user?.id}
          <tr>
            <td data-label="Nama"><b>{u.name}</b>{#if self}<br /><small class="muted">akun Anda</small>{/if}</td>
            <td data-label="Email">{u.email}</td>
            <td data-label="Role">
              <SearchSelect value={u.role} disabled={self} label={`Role ${u.email}`} onchange={value => { if (value !== u.role) { access = { id: u.id, email: u.email, role: value }; accessError = ''; reviewing = true } }} options={roles.map(([value, label]) => ({ value, label }))} />
            </td>
            <td data-label="Status">{#if !u.active}<Badge tone="gray">Nonaktif</Badge>{:else if u.pending}<Badge tone="warn">Menunggu aktivasi</Badge>{:else}<Badge tone="ok">Aktif</Badge>{/if}</td>
            <td data-label="Aksi">
              <div class="actions tight">
                <button class="ghost" disabled={self} onclick={() => { access = { id: u.id, email: u.email, active: !u.active }; accessError = ''; reviewing = true }}>{u.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                <button class="ghost" disabled={self || !u.active} onclick={() => reset(u.id, u.email)}>Reset password</button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
  <section class="panel">
    <h3>Audit akun</h3>
    <ul class="timeline">
      {#each db.staffEvents as e, i (i)}
        <li><b>{e.type}</b><span> · {e.email ?? e.userId}{e.note ? ` · ${e.note}` : ''}</span><small>{fmtTime(e.at)} · {e.actor}</small></li>
      {:else}
        <li class="muted">Belum ada perubahan</li>
      {/each}
    </ul>
  </section>
</div>

<Modal bind:open={creating} title="Tambah akun staff" busy={saving} error={formError}>
    <form class="create-form" onsubmit={submit}>
      <label class="field"><span>Email kantor</span><input type="email" placeholder="nama@perusahaan.com" bind:value={f.email} required disabled={saving} /></label>
      <label class="field"><span>Nama staff</span><input bind:value={f.name} required disabled={saving} /></label>
      <SearchSelect bind:value={f.role} label="Role" required disabled={saving} options={roles.map(([value, label]) => ({ value, label }))} />

      <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { creating = false }}>Batal</button><button disabled={saving}>{saving ? 'Menyimpan…' : 'Buat undangan'}</button></div>
    </form>
</Modal>

<Modal bind:open={reviewing} title="Konfirmasi perubahan akses" busy={accessBusy} error={accessError}>
  {#if access}
    <p>{access.email}</p>
    <p>{access.role ? `Ubah role menjadi ${ROLES[access.role]}?` : access.active ? 'Aktifkan kembali akun ini?' : 'Nonaktifkan akun ini? Pengguna tidak dapat mengakses aplikasi.'}</p>
    <div class="modal-actions"><button class="ghost" disabled={accessBusy} onclick={() => { reviewing = false }}>Batal</button><button disabled={accessBusy} onclick={saveAccess}>{accessBusy ? 'Menyimpan…' : 'Simpan perubahan'}</button></div>
  {/if}
</Modal>

</DataState>
