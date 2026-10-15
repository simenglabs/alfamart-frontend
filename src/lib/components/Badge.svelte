<script lang="ts">
  import type { Snippet } from 'svelte'
  import { STATUS_LABEL } from '$lib/store.svelte'

  const TONE: Record<string, string> = {
    active: 'ok', resolved: 'ok', paid: 'ok', settled: 'ok', done: 'ok',
    rejected: 'bad', failed: 'bad', high: 'bad', terminated: 'gray', low: 'gray',
    revision: 'warn', open: 'warn', requested: 'warn', unpaid: 'warn', medium: 'warn', express: 'brand',
  }
  let { v = '', tone, children }: { v?: string; tone?: string; children?: Snippet } = $props()
</script>

<span class="badge {tone ?? TONE[v] ?? 'info'}">{#if children}{@render children()}{:else}{STATUS_LABEL[v] ?? v}{/if}</span>
