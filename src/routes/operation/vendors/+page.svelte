<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import ReadOnly from '$lib/components/ReadOnly.svelte'
  import { db, actions, can, load } from '$lib/store.svelte'
  import { pct, fmtDate } from '$lib/format'

  onMount(() => load('scores', 'pm', 'vendors'))
  const edit = $derived(can('ops'))
  let creating = $state(false)
  let selectedId = $state('')
  let saving = $state(false)
  let formError = $state('')
  const selectedPM = $derived(db.pm.find(p => p.id === selectedId))
  async function createWorkOrder(e: SubmitEvent) {
    e.preventDefault()
    if (saving || !edit || !selectedPM) return
    formError = ''
    saving = true
    try { if (await actions.runPM(selectedId)) creating = false; else formError = 'Work order belum berhasil dibuat. Silakan coba lagi.' }
    finally { saving = false }
  }
  const category = (id: string) => db.vendors.find((v) => v.id === id)?.category ?? ''
</script>

<DataState keys={['scores', 'pm', 'vendors']}>


<div class="stack">
  {#if !edit}<ReadOnly who="Operations" />{/if}
  <section class="panel">
    <h3>Skor vendor · kuartal ini</h3>
    <table class="mobile-records">
      <thead><tr><th>Vendor</th><th>Kategori</th><th>WO aktif</th><th>Selesai</th><th>Dalam SLA</th><th>Skor</th></tr></thead>
      <tbody>
        {#each db.scores as s (s.id)}
          <tr>
            <td data-label="Vendor"><b>{s.name}</b></td><td data-label="Kategori">{category(s.id)}</td><td data-label="WO aktif">{s.active}</td><td data-label="Selesai">{s.resolved}</td><td data-label="Dalam SLA">{s.inSla}</td>
            <td data-label="Skor"><Badge tone={!s.resolved ? 'gray' : s.inSla / s.resolved >= 0.9 ? 'ok' : 'warn'}>{pct(s.inSla, s.resolved)}</Badge></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
  <section class="panel">
    <h3>Jadwal preventive maintenance</h3>
    <table class="mobile-records">
      <thead><tr><th>Aset</th><th>Vendor</th><th>Interval</th><th>Jatuh tempo</th><th></th></tr></thead>
      <tbody>
        {#each db.pm as p (p.id)}
          <tr>
            <td data-label="Aset"><b>{p.asset}</b></td><td data-label="Vendor">{p.vendor}</td><td data-label="Interval">{p.everyDays} hari</td>
            <td data-label="Jatuh tempo"><Badge tone={p.overdue ? 'bad' : 'info'}>{fmtDate(p.due)}</Badge></td>
            <td data-label="Aksi"><button disabled={!edit} onclick={() => { selectedId = p.id; formError = ''; creating = true }}>Buat work order</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</div>

<Modal bind:open={creating} title="Buat work order" busy={saving} error={formError}>
  <form onsubmit={createWorkOrder}>
    {#if selectedPM}<dl class="dl"><dt>Aset</dt><dd>{selectedPM.asset}</dd><dt>Vendor</dt><dd>{selectedPM.vendor}</dd><dt>Jatuh tempo</dt><dd>{fmtDate(selectedPM.due)}</dd></dl>{/if}
    <p class="muted">Buat work order berdasarkan jadwal preventive maintenance ini.</p>
    <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { creating = false }}>Batal</button><button disabled={saving || !edit || !selectedPM}>{saving ? 'Memproses…' : 'Buat work order'}</button></div>
  </form>
</Modal>

</DataState>
