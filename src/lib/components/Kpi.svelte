<script lang="ts">
  let { label, value, sub = '', tone = '' }: { label: string; value: string | number; sub?: string; tone?: string } = $props()
</script>

<div class="kpi"><small>{label}</small><b class={tone}>{value}</b>{#if sub}<span>{sub}</span>{/if}</div>
