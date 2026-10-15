<script lang="ts">
  import DataState from '$lib/components/DataState.svelte'
  import SearchSelect from '$lib/components/SearchSelect.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import { onMount } from 'svelte'
  import Badge from '$lib/components/Badge.svelte'
  import Kpi from '$lib/components/Kpi.svelte'
  import ReadOnly from '$lib/components/ReadOnly.svelte'
  import { db, actions, can, load, period } from '$lib/store.svelte'
  import { rp, pct, sum, fmtDate, fmtTime } from '$lib/format'

  onMount(() => load('invoices'))
  const edit = $derived(can('billing'))
  const periods = $derived([...new Set([period(1), period(0), period(-1), ...db.invoices.map((i) => i.period)])].sort().reverse())
  let per = $state(period(0))
  let creating = $state(false)
  let saving = $state(false)
  let formError = $state('')
  let generatePeriod = $state(period(0))
  async function generate(e: SubmitEvent) {
    e.preventDefault()
    if (saving || !edit) return
    formError = ''
    saving = true
    try { if (await actions.generateInvoices(generatePeriod)) { per = generatePeriod; creating = false } else formError = 'Invoice belum berhasil dibuat. Silakan coba lagi.' }
    finally { saving = false }
  }
  const inv = $derived(db.invoices.filter((i) => i.period === per))
  const billed = $derived(sum(inv, 'total'))
  const collected = $derived(sum(inv.filter((i) => i.status === 'paid'), 'total'))
</script>

<DataState keys={['invoices']}>


<div class="stack">
  {#if !edit}<ReadOnly who="Commercial / finance" />{/if}
  <div class="toolbar">
    <SearchSelect bind:value={per} label="Periode" options={periods.map(value => ({ value, label: value }))} />
    <button disabled={!edit} onclick={() => { generatePeriod = per; formError = ''; creating = true }}>Generate invoice {per}</button>
    <small class="muted">Tenant baru ditagih prorata sejak tanggal mulai kontrak. Aman dijalankan ulang.</small>
  </div>
  <div class="kpis">
    <Kpi label="Billed" value={rp(billed)} />
    <Kpi label="Collected" value={rp(collected)} />
    <Kpi label="Collection rate" value={pct(collected, billed)} sub="target 98%" tone={billed && collected / billed < 0.98 ? 'warn' : ''} />
    <Kpi label="Outstanding" value={rp(billed - collected)} tone="bad" />
  </div>
  <section class="panel scroll-x">
    <table class="mobile-records">
      <thead><tr><th>Invoice</th><th>Tenant</th><th>Rincian</th><th>Total</th><th>Jatuh tempo</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>
        {#each inv as i (i.id)}
          <tr>
            <td data-label="Invoice"><b>{i.id}</b></td>
            <td data-label="Tenant">{i.brand}</td>
            <td data-label="Rincian">{#each i.items as it (it.label)}<div><small>{it.label}: {rp(it.amount)}</small></div>{/each}</td>
            <td data-label="Total"><b>{rp(i.total)}</b></td>
            <td data-label="Jatuh tempo">{fmtDate(i.due)}{#if i.overdue}<br /><Badge tone="bad">Lewat jatuh tempo</Badge>{/if}</td>
            <td data-label="Status"><Badge v={i.status} />{#if i.ref}<br /><small>{i.ref}</small>{/if}</td>
            <td data-label="Aksi">
              {#if i.status !== 'paid'}
                <div class="actions tight">
                  <button class="ghost" disabled={!edit} onclick={() => actions.sendPayLink(i.id)}>{i.linkSentAt ? 'Kirim ulang link' : 'Kirim link bayar'}</button>
                  <button class="ghost" disabled={!edit} onclick={() => actions.mockCallback(i.id, true)} title="Gateway mock">Simulasi bayar</button>
                  <button class="ghost" disabled={!edit} onclick={() => actions.mockCallback(i.id, false)} title="Gateway mock">Simulasi gagal</button>
                </div>
              {:else}
                <small>Dibayar {fmtTime(i.paidAt!)}</small>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if !inv.length}<p class="empty">Belum ada invoice untuk {per}</p>{/if}
  </section>
</div>

<Modal bind:open={creating} title="Generate invoice" busy={saving} error={formError}>
  <form onsubmit={generate}>
    <p class="muted">Buat invoice untuk tenant sesuai periode. Tenant baru ditagih prorata sejak tanggal mulai kontrak.</p>
    <SearchSelect bind:value={generatePeriod} label="Periode invoice" required disabled={saving} options={periods.map(value => ({ value, label: value }))} />
    <div class="modal-actions"><button type="button" class="ghost" disabled={saving} onclick={() => { creating = false }}>Batal</button><button disabled={saving || !edit}>{saving ? 'Memproses…' : 'Generate invoice'}</button></div>
  </form>
</Modal>

</DataState>
