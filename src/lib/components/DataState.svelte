<script lang="ts">
  import type { Snippet } from 'svelte'
  import { dataState, load, type Key } from '$lib/store.svelte'
  let { keys, children }: { keys: Key[]; children: Snippet } = $props()
  const failed = $derived(keys.filter(key => dataState[key]?.error))
  const ready = $derived(keys.every(key => dataState[key]?.ready))
  const pending = $derived(keys.some(key => dataState[key]?.pending))
</script>

{#if failed.length}
  <div class="data-message" role="alert"><p>{ready ? 'Pembaruan gagal. Data terakhir masih ditampilkan.' : 'Data belum berhasil dimuat.'}</p><button class="ghost" disabled={pending} onclick={() => load(...failed)}>{pending ? 'Memuat…' : 'Coba lagi'}</button></div>
{/if}
{#if ready}
  {@render children()}
{:else if !failed.length}
  <p class="data-message" role="status">Memuat data…</p>
{/if}

<style>
  .data-message { padding: 20px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); margin: 0 0 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  p { margin: 0; }
</style>
