<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import { db, load, STAGES, STATUS_LABEL } from '$lib/store.svelte'
  import { fmtDate } from '$lib/format'

  onMount(() => load('outlets', 'units'))

  let q = $state('')
  let st = $state('')
  let cat = $state('')
  const rows = $derived(db.outlets.filter((o) => (!st || o.status === st) && (!cat || o.category === cat)
    && `${o.brand} ${o.company} ${o.unit} ${o.pic}`.toLowerCase().includes(q.toLowerCase())))

  function exportCsv() {
    const head = ['Brand', 'Perusahaan', 'Kategori', 'Unit', 'PIC', 'Email', 'Status', 'Mulai', 'Berakhir']
    const lines = [head, ...rows.map((o) => [o.brand, o.company, o.category, o.unit, o.pic, o.email, STATUS_LABEL[o.status], o.contract?.start ?? '', o.contract?.end ?? ''])]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    a.download = 'tenant-directory.csv'
    a.click()
  }
</script>

<DataState keys={['outlets', 'units']}>


<div class="stack">
  <section class="panel">
    <div class="toolbar">
      <input placeholder="Cari brand, perusahaan, unit, PIC" bind:value={q} aria-label="Cari" />
      <SearchSelect bind:value={st} label="Filter status" options={[{ value: '', label: 'Semua status' }, ...[...STAGES, 'revision', 'rejected', 'terminated'].map(value => ({ value, label: STATUS_LABEL[value] }))]} />
      <SearchSelect bind:value={cat} label="Filter kategori" options={[{ value: '', label: 'Semua kategori' }, ...(db.meta?.outletCategories ?? []).map(value => ({ value, label: value }))]} />
      <button class="ghost" onclick={exportCsv}>Ekspor CSV</button>
    </div>
    <div class="scroll-x">
      <table class="mobile-records">
        <thead><tr><th>Brand</th><th>Perusahaan</th><th>Kategori</th><th>Unit</th><th>PIC</th><th>Status</th><th>Kontrak</th></tr></thead>
        <tbody>
          {#each rows as o (o.id)}
            <tr>
              <td data-label="Brand"><b>{o.brand}</b></td><td data-label="Perusahaan">{o.company}</td><td data-label="Kategori">{o.category}</td><td data-label="Unit">{o.unit}</td>
              <td data-label="PIC">{o.pic}<br /><small>{o.email}</small></td><td data-label="Status"><Badge v={o.status} /></td>
              <td data-label="Kontrak">{o.contract ? `${fmtDate(o.contract.start)} – ${fmtDate(o.contract.end)}` : '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if !rows.length}<p class="empty">Tidak ada hasil</p>{/if}
  </section>
  <section class="panel">
    <h3>Okupansi unit</h3>
    <div class="units">
      {#each db.units as u (u.code)}
        <div class="unit {u.status.replace(' ', '-')}"><b>{u.code}</b><small>{u.terminal}</small><small>{u.status}</small></div>
      {/each}
    </div>
  </section>
</div>

</DataState>
