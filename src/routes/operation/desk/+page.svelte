<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import Sla from '$lib/components/Sla.svelte'
  import Kpi from '$lib/components/Kpi.svelte'
  import ReadOnly from '$lib/components/ReadOnly.svelte'
  import AuthImg from '$lib/components/AuthImg.svelte'
  import { db, actions, can, load, STATUS_LABEL, type Priority, type TicketStatus } from '$lib/store.svelte'
  import { pct } from '$lib/format'

  onMount(() => load('tickets', 'vendors', 'outlets'))
  const edit = $derived(can('ops'))
  let f = $state({ outletId: '', category: 'AC', title: '', priority: 'medium' as Priority })
  let pick = $state<Record<string, string>>({})
  const done = $derived(db.tickets.filter((t) => t.status === 'resolved'))
  const active = $derived(db.tickets.filter((t) => t.status !== 'resolved'))
  const defaultVendor = (cat: string) => db.meta?.ticketCategories.find((c) => c.code === cat)?.defaultVendorId ?? ''
  const COLS: TicketStatus[] = ['open', 'assigned', 'in_progress', 'resolved']

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
      if (await actions.createTicket(f)) { f.title = ''; creating = false }
      else formError = 'Request belum berhasil dibuat. Periksa isian lalu coba lagi.'
    } finally { saving = false }
  }
</script>

<DataState keys={['tickets', 'vendors', 'outlets']}>


<div class="stack">
  {#if !edit}<ReadOnly who="Operations" />{/if}
  <div class="kpis">
    <Kpi label="Ticket aktif" value={active.length} />
    <Kpi label="Aktif lewat SLA" value={active.filter((t) => t.late).length} tone="bad" />
    <Kpi label="Kepatuhan SLA" value={pct(done.filter((t) => !t.late).length, done.length)} sub="target ≥ 90%" />
    <Kpi label="Selesai" value={done.length} />
  </div>
  <div class="create-toolbar"><p class="muted">Kelola laporan dan permintaan layanan internal.</p><button disabled={!edit} onclick={() => { formError = ''; creating = true }}>+ Buat request internal</button></div>

  <div class="board">
    {#each COLS as st (st)}
      {@const items = db.tickets.filter((t) => t.status === st)}
      <section class="panel">
        <h3>{STATUS_LABEL[st]} <span class="count">{items.length}</span></h3>
        {#each st === 'resolved' ? items.slice(0, 8) : items as t (t.id)}
          <div class="item">
            <div class="item-top"><b>{t.id}</b><Badge v={t.priority} /></div>
            <div>{t.title}</div>
            <small>{t.place} · {t.category}{t.source === 'pm' ? ' · PM' : ''}</small>
            <small>{t.vendorName ?? 'Belum ada vendor'}</small>
            <Sla deadline={t.deadline} done={t.resolvedAt} />
            {#if t.photoId}<AuthImg id={t.photoId} alt="Foto laporan" />{/if}
            {#if t.note}<small>Catatan: {t.note}</small>{/if}
            {#if t.resolvePhotoId}<AuthImg id={t.resolvePhotoId} alt="Foto penyelesaian" />{/if}
            {#if st === 'open'}
              {@const vid = pick[t.id] ?? defaultVendor(t.category)}
              <div class="inline">
                <SearchSelect value={vid} onchange={value => { pick[t.id] = value }} label="Vendor" disabled={!edit} options={db.vendors.map(v => ({ value: v.id, label: v.name }))} />
                <button disabled={!edit || !vid} onclick={() => actions.assignTicket(t.id, vid)}>Assign</button>
              </div>
            {/if}
          </div>
        {:else}
          <p class="empty">Kosong</p>
        {/each}
      </section>
    {/each}
  </div>
</div>

<Modal bind:open={creating} title="Request internal" busy={saving} error={formError}>
    <form class="create-form" onsubmit={submit}>
      <SearchSelect bind:value={f.outletId} label="Lokasi" disabled={saving} options={[{ value: '', label: 'Internal / area umum' }, ...db.outlets.filter(o => o.status === 'active').map(o => ({ value: o.id, label: `${o.brand} · ${o.unit}` }))]} />
      <SearchSelect bind:value={f.category} label="Kategori" required disabled={saving} options={(db.meta?.ticketCategories ?? []).map(c => ({ value: c.code, label: c.code }))} />
      <label class="field"><span>Judul masalah</span><input placeholder="Jelaskan masalah secara singkat" bind:value={f.title} required disabled={saving} /></label>
      <SearchSelect bind:value={f.priority} label="Prioritas" required disabled={saving} options={(db.meta?.sla ?? []).map(s => ({ value: s.priority, label: `${s.priority} · SLA ${s.hours} jam` }))} />
      <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { creating = false }}>Batal</button><button disabled={saving || !edit}>{saving ? 'Menyimpan…' : 'Buat ticket'}</button></div>
    </form>
</Modal>

</DataState>
