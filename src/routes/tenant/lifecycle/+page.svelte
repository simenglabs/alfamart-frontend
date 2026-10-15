<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import { onMount } from 'svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import Badge from '$lib/components/Badge.svelte'
  import ReadOnly from '$lib/components/ReadOnly.svelte'
  import OutletDetail from '$lib/web/OutletDetail.svelte'
  import { db, can, load, STAGES, STATUS_LABEL, daysLeft, type Outlet } from '$lib/store.svelte'
  import { fmtDate } from '$lib/format'

  onMount(() => load('outlets', 'units'))
  let sel = $state<string | null>(null)
  let stage = $state('')
  let query = $state('')
  const edit = $derived(can('tenant'))
  const cols: [string, string, (o: Outlet) => boolean][] = [
    ...STAGES.map((k): [string, string, (o: Outlet) => boolean] => [k, STATUS_LABEL[k], (o) => o.status === k]),
    ['other', 'Revisi / ditolak / berakhir', (o) => !STAGES.includes(o.status)],
  ]
  const radar = $derived(db.outlets.filter((o) => o.status === 'active' && daysLeft(o) <= 120).sort((a, b) => daysLeft(a) - daysLeft(b)))
  const selected = $derived(db.outlets.find((x) => x.id === sel))
</script>

<DataState keys={['outlets', 'units']}>


<div class="with-panel">
  <div class="stack">
    {#if !edit}<ReadOnly who="Tenant relations" />{/if}
    <div class="toolbar"><input type="search" bind:value={query} placeholder="Cari tenant atau unit" aria-label="Cari tenant atau unit" /><SearchSelect bind:value={stage} label="Tahap tenant" options={[{ value: '', label: 'Semua tahap' }, ...cols.map(([value, label]) => ({ value, label }))]} /></div>
    <div class="kanban">
      {#each cols.filter(([k]) => !stage || stage === k) as [k, label, fn] (k)}
        {@const list = db.outlets.filter(fn).filter(o => `${o.brand} ${o.company} ${o.unit}`.toLowerCase().includes(query.trim().toLowerCase()))}
        <div class="col">
          <h4>{label} <span>{list.length}</span></h4>
          {#each list as x (x.id)}
            <button class="card" class:on={sel === x.id} onclick={() => (sel = x.id)}>
              <b>{x.brand}</b>
              <small>{x.company}</small>
              <small>{x.unit} · {x.category}</small>
              {#if k === 'other'}<Badge v={x.status} />{/if}
              {#if x.status === 'active' && daysLeft(x) <= 120}
                <Badge tone={daysLeft(x) < 0 ? 'bad' : 'warn'}>{daysLeft(x) < 0 ? 'Kontrak lewat' : `Renewal · ${daysLeft(x)} hari`}</Badge>
              {/if}
            </button>
          {:else}
            <p class="empty">Kosong</p>
          {/each}
        </div>
      {/each}
    </div>
    <section class="panel">
      <h3>Radar renewal · kontrak ≤ 120 hari</h3>
      {#if radar.length}
        <table class="mobile-records">
          <thead><tr><th>Tenant</th><th>Unit</th><th>Berakhir</th><th>Sisa</th></tr></thead>
          <tbody>
            {#each radar as x (x.id)}
              <tr class="click" tabindex="0" onkeydown={(e) => { if (e.key === "Enter") sel = x.id }} onclick={() => (sel = x.id)}>
                <td data-label="Tenant">{x.brand}</td><td data-label="Unit">{x.unit}</td><td data-label="Berakhir">{fmtDate(x.contract!.end)}</td>
                <td data-label="Sisa"><Badge tone={daysLeft(x) <= 30 ? 'bad' : 'warn'}>{daysLeft(x)} hari</Badge></td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="empty">Tidak ada kontrak yang mendekati habis</p>
      {/if}
    </section>
  </div>
  {#if selected}
    {#key selected.id}
      <OutletDetail o={selected} {edit} onclose={() => (sel = null)} />
    {/key}
  {:else}
    <aside class="detail muted">Pilih tenant untuk melihat detail</aside>
  {/if}
</div>

</DataState>
