<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import ReadOnly from '$lib/components/ReadOnly.svelte'
  import { session } from '$lib/api.svelte'
  import { db, actions, can, load } from '$lib/store.svelte'

  onMount(() => load('users', 'vendors'))
  const edit = $derived(can('partners'))
  // operations mengelola akun vendor, dispatcher mengelola akun petugas (sama dengan aturan server)
  const myRole = $derived(session.user?.role === 'dispatcher' ? 'officer' : 'vendor')
  let f = $state({ email: '', name: '', vendorId: '' })
  let code = $state<{ email: string; code: string } | null>(null)

  let creating = $state(false)
  let saving = $state(false)
  let formError = $state('')

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (saving) return
    if (!edit) return
    formError = ''
    saving = true
    try {
      const c = await actions.invite({ ...f, role: myRole })
      if (c) {
        creating = false
        code = { email: f.email, code: c }
        f = { email: '', name: '', vendorId: '' }
      } else { formError = 'Undangan belum berhasil dibuat. Periksa email dan pilihan akun lalu coba lagi.' }
    } finally { saving = false }
  }
</script>

<DataState keys={['users', 'vendors']}>


<div class="stack">
  {#if !edit}<ReadOnly who="Operations (akun vendor) atau Dispatcher (akun petugas)" />{/if}
  <div class="create-toolbar"><p class="muted">Kelola akses akun vendor dan petugas.</p><button disabled={!edit} onclick={() => { formError = ''; creating = true }}>+ Buat undangan</button></div>
    {#if code}
      <p class="note">Kode undangan untuk {code.email}: <span class="code">{code.code}</span><br />
        Minta pengguna membuka app mobile → "Punya kode undangan" lalu membuat password. Kode hanya berlaku sekali.</p>
    {/if}

  <section class="panel scroll-x">
    <h3>Akun vendor & petugas</h3>
    <table class="mobile-records">
      <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Vendor</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {#each db.users as u (u.id)}
          <tr>
            <td data-label="Nama"><b>{u.name}</b></td><td data-label="Email">{u.email}</td><td data-label="Role">{u.role === 'vendor' ? 'Vendor' : 'Petugas'}</td><td data-label="Vendor">{u.vendor ?? '—'}</td>
            <td data-label="Status">
              {#if !u.active}<Badge tone="gray">Nonaktif</Badge>{:else if u.pending}<Badge tone="warn">Undangan belum dipakai</Badge>{:else}<Badge tone="ok">Aktif</Badge>{/if}
            </td>
            <td data-label="Aksi">
              <button class="ghost" disabled={!edit || u.role !== myRole} onclick={() => actions.setActive(u.id, !u.active)}>{u.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</div>

<Modal bind:open={creating} title="Undang mitra" busy={saving} error={formError}>
    <form class="create-form" onsubmit={submit}>
      <label class="field"><span>Email</span><input type="email" placeholder="nama@perusahaan.com" bind:value={f.email} required disabled={saving} /></label>
      <label class="field"><span>{myRole === 'vendor' ? 'Nama PIC vendor' : 'Nama petugas'}</span><input bind:value={f.name} required disabled={saving} /></label>
      {#if myRole === 'vendor'}
        <SearchSelect bind:value={f.vendorId} label="Perusahaan vendor" placeholder="Pilih vendor" required disabled={saving} options={db.vendors.map(v => ({ value: v.id, label: v.name }))} />
      {/if}

      <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { creating = false }}>Batal</button><button disabled={saving || !edit}>{saving ? 'Menyimpan…' : 'Buat undangan'}</button></div>
    </form>
</Modal>

</DataState>
