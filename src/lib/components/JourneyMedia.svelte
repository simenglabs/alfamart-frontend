<script lang="ts">
  import { onMount } from 'svelte'

  let video = $state<HTMLVideoElement>()
  let reducedMotion = $state(true)
  let hidden = $state(false)
  let failed = $state(false)

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => { reducedMotion = preference.matches }
    const updateVisibility = () => { hidden = document.hidden }
    updateMotion()
    updateVisibility()
    preference.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      preference.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  })

  $effect(() => {
    const player = video
    if (!player) return
    if (reducedMotion || hidden || failed) player.pause()
    else {
      player.muted = true
      void player.play().catch((error: DOMException) => {
        if (error.name !== 'AbortError') failed = true
      })
    }
  })
</script>

<section class="retail-hero" aria-labelledby="hero-title">
  <div class="hero-media" aria-hidden="true">
    <video bind:this={video} class:poster-only={reducedMotion || failed}
      src="/images/alfamart/gemini_generated_video_936eb5c6.mp4"
      poster="/images/alfamart/hero-poster.jpg"
      muted loop playsinline preload="metadata" disablepictureinpicture
      onerror={() => { failed = true }}></video>
  </div>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="hero-inner">
    <div class="hero-copy">
      <p class="eyebrow"><span></span> ALFAMART RETAIL WORKSPACE</p>
      <h1 id="hero-title">Setiap gerai.<br />Satu arah.<br /><em>Tumbuh bersama.</em></h1>
      <p class="description">Hubungkan tenant, layanan gerai, dan aktivitas komersial. Bantu Direksi melihat prioritas dan tim menuntaskan tindak lanjut dalam satu ruang kerja.</p>
      <div class="actions"><a class="primary" href="#solusi">Jelajahi solusi <span aria-hidden="true">↗</span></a><a class="secondary" href="#tentang">Kenali platform <span aria-hidden="true">↓</span></a></div>
    </div>
    <div class="hero-footer">
      <div class="pillars"><span>Visibilitas operasional</span><span>Koordinasi tim</span><span>Informasi terpusat</span></div>
      <p>Dari gerai hingga Direksi.</p>
    </div>
  </div>
</section>

<style>
  .retail-hero { position: relative; isolation: isolate; overflow: hidden; background: #17232d; color: white; }
  .hero-media, .hero-shade { position: absolute; inset: 0; pointer-events: none; }
  .hero-media { background: url('/images/alfamart/hero-poster.jpg') 58% center / cover no-repeat; }
  video { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 58% center; }
  video.poster-only { opacity: 0; }
  .hero-shade { background: linear-gradient(90deg, #101c29ed 0%, #101c29c7 30%, #101c2950 65%, #101c2926 100%), linear-gradient(0deg, #101c29b3, transparent 38%); }
  .hero-inner { position: relative; max-width: 1536px; min-height: clamp(680px, 83svh, 960px); padding: 80px clamp(24px, 6vw, 100px) 32px; margin: auto; display: flex; flex-direction: column; justify-content: center; }
  .hero-copy { max-width: 680px; padding-block: 12px 64px; }
  .eyebrow { display: flex; align-items: center; gap: 12px; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: .14em; }
  .eyebrow span { width: 28px; height: 3px; background: #ffc604; flex-shrink: 0; }
  h1 { margin: 24px 0; font-size: clamp(44px, 5.2vw, 76px); font-weight: 800; letter-spacing: -.05em; line-height: 1.08; color: white; }
  h1 em { font-style: normal; color: #ffdb59; }
  .description { max-width: 500px; font-size: 17px; line-height: 1.85; color: #f2f3f5; }
  .actions { display: flex; flex-wrap: wrap; gap: 20px 28px; align-items: center; margin-top: 32px; }
  .actions a { display: inline-flex; align-items: center; gap: 28px; min-height: 48px; text-decoration: none; font-size: 13px; font-weight: 800; }
  .primary { padding: 15px 24px; background: var(--brand); border: 1px solid #ffffff33; border-radius: 5px; color: white; }
  .primary:hover { background: #971220; }
  .secondary { color: white; border-bottom: 1px solid #ffffff66; }
  .secondary:hover { border-bottom-color: white; }
  a:focus-visible { outline: 3px solid #ffc604; outline-offset: 5px; }
  .hero-footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; border-top: 1px solid #ffffff40; padding-top: 24px; margin-top: auto; }
  .pillars { display: flex; flex-wrap: wrap; gap: 12px 24px; font-size: 11px; color: #f2f3f5; }
  .pillars span::before { content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #ffc604; margin: 0 9px 2px 0; }
  .hero-footer p { margin: 0; color: #f2f3f5; font-size: 11px; }
  @media(max-width: 760px) {
    .hero-inner { min-height: 720px; padding: 52px 24px 28px; }
    .hero-copy { padding-bottom: 44px; }
    h1 { font-size: clamp(40px, 8.5vw, 60px); }
    .description { font-size: 16px; }
    .eyebrow { font-size: 9px; letter-spacing: .1em; gap: 8px; }
    .hero-shade { background: linear-gradient(90deg, #101c29d9, #101c298a), linear-gradient(0deg, #101c29b3, transparent 60%); }
    .hero-footer { gap: 20px; }
    .pillars { gap: 12px 18px; }
  }
</style>
