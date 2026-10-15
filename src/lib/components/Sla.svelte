<script lang="ts">
  import Badge from './Badge.svelte'
  import { clock } from '$lib/store.svelte'

  let { deadline, done = null }: { deadline: string; done?: string | null } = $props()
  const dur = (ms: number) => {
    const m = Math.round(ms / 60e3)
    return m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}j ${m % 60}m` : `${Math.floor(m / 1440)} hari`
  }
  const diff = $derived(Date.parse(deadline) - (done ? Date.parse(done) : clock.now))
</script>

{#if done}
  <Badge tone={diff >= 0 ? 'ok' : 'bad'}>{diff >= 0 ? 'Dalam SLA' : 'Lewat SLA'}</Badge>
{:else}
  <Badge tone={diff >= 0 ? 'info' : 'bad'}>{diff >= 0 ? `SLA sisa ${dur(diff)}` : `Lewat SLA ${dur(-diff)}`}</Badge>
{/if}
