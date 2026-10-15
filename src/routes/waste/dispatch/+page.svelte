<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import Sla from '$lib/components/Sla.svelte'
  import Kpi from '$lib/components/Kpi.svelte'
  import Bar from '$lib/components/Bar.svelte'
  import ReadOnly from '$lib/components/ReadOnly.svelte'
  import { db, actions, can, load, type WasteRequest } from '$lib/store.svelte'

  onMount(() => load('waste', 'officers'))
  const edit = $derived(can('dispatch'))
  let pick = $state<Record<string, string>>({})
  // server sudah mengurutkan: express di atas, lalu yang paling lama
  const queue = $derived(db.waste.filter((w) => w.status === 'requested'))
  const running = $derived(db.waste.filter((w) => w.status === 'assigned' || w.status === 'in_progress'))
</script>
{#snippet row(w: WasteRequest)}
  <div class="item-top"><b>{w.id}</b>{#if w.service === 'express'}<Badge v="express">Express</Badge>{:else}<Badge tone="gray">Regular</Badge>{/if}</div>
  <div>{w.place} · {w.type} · {w.estimate}</div>
  {#if w.note}<small>{w.note}</small>{/if}
  <Sla deadline={w.deadline} done={w.doneAt} />
{/snippet}
<DataState keys={['waste', 'officers']}>




<div class="stack">
  {#if !edit}<ReadOnly who="Dispatcher waste" />{/if}
  <div class="kpis">
    <Kpi label="Antrean" value={queue.length} />
    <Kpi label="Express" value={queue.filter((w) => w.service === 'express').length} />
    <Kpi label="Lewat SLA" value={[...queue, ...running].filter((w) => w.late).length} tone="bad" />
    <Kpi label="Berjalan" value={running.length} />
  </div>
  <div class="board three">
    <section class="panel">
      <h3>Antrean pickup</h3>
      {#each queue as w (w.id)}
        <div class="item">
          {@render row(w)}
          <div class="inline">
            <SearchSelect value={pick[w.id] ?? ''} onchange={value => { pick[w.id] = value }} label="Petugas" placeholder="Pilih petugas" disabled={!edit} options={db.officers.map(o => ({ value: o.id, label: `${o.name} · ${o.activeTasks} tugas` }))} />
            <button disabled={!edit || !pick[w.id]} onclick={() => actions.assignWaste(w.id, pick[w.id] ?? '')}>Assign</button>
          </div>
        </div>
      {:else}
        <p class="empty">Antrean kosong</p>
      {/each}
    </section>
    <section class="panel">
      <h3>Beban petugas</h3>
      {#each db.officers as o (o.id)}
        <Bar label={o.name} value={o.activeTasks} max={3} text="{o.activeTasks} tugas" tone={o.activeTasks >= 3 ? 'bad' : ''} />
      {/each}
    </section>
    <section class="panel">
      <h3>Pickup berjalan</h3>
      {#each running as w (w.id)}
        <div class="item">{@render row(w)}<small>{w.officer} · <Badge v={w.status} /></small></div>
      {:else}
        <p class="empty">Tidak ada</p>
      {/each}
    </section>
  </div>
</div>

</DataState>
