# fal-awesome-prompts — Design Reference & Notes

## Proje Amacı
AI Video Prompt Bank SaaS — kullanıcılar video prompt keşfedebilir, AI video üretebilir, community galeri gezebilir, geçmişlerini görebilir.

## Ana Sayfa Referansı: Artify AI
Referans görseller: `docs/refs/` klasöründe.

- `artify-hero.png` — Hero section closeup
- `artify-full-page.png` — Full page layout

### Artify AI Ana Sayfa Yapısı (video için uyarlanacak)
1. **Header**: Logo sol, nav ortada (Home, Explore, Gallery, Pricing, Tutorials), sağda CTA buton
2. **Hero Section**: 
   - Koyu arkaplan
   - Büyük bold başlık: "No More Boring Stock Images" (bizde: video versiyonu)
   - Alt yazı: kısa açıklama
   - Sarı/amber CTA buton: "Join the Beta Waitlist" 
   - Sağ tarafta/altta: masonry grid tarzı görsel kolajı (bizde video thumbnail kolajı)
3. **Trusted Partners**: Logo bar — partnerler/desteklenen modeller
4. **Feature Section**: "One Platform to Create Anything. No Limits." — feature kartları/açıklamalar
5. **Gallery Section**: "Explore Artify Gallery" — grid view, filtreli
6. **CTA Section**: "Ready to Bring Your Ideas to Life?" — son CTA
7. **Footer**: Büyük tipografi ile marka adı, linkler

### Tasarım Detayları
- Koyu tema dominant (siyah/çok koyu gri arkaplan)
- Amber/sarı accent renk (CTA butonlar, vurgular)
- Masonry/bento grid tarzı thumbnail düzeni hero'da
- Temiz tipografi, bold başlıklar
- Minimal border, subtle card'lar
- Video thumbnail'ları gradient placeholder yerine gerçek görseller gibi görünmeli

## Teknik Notlar
- Next.js 15, HeroUI v3, Tailwind CSS v4
- Design system: design-ui-fal-demos'tan fork
- Amber accent: oklch(0.7058 0.191 52.15)
- Dark mode daha koyu: --background oklch(0.12)

## Ek Referanslar (Ilham)

### Video Editor Panel (`video-editor-panel.png`)
- Koyu arkaplan, sol tarafta video preview (mavi seçim çerçevesi)
- Sag panelde ayarlar: Audio (Soundboard, WAVs, Enhancements), Video (AI Face Center toggle, Aspect Ratio, Captions, Background, Watermark, Layouts), Bumpers
- Toggle/switch'ler, chevron ile expandable section'lar
- Mavi accent renk (bizde amber olacak)
- **Ilham**: Generate sayfasindaki settings paneli bu tarza yakinlasmali — toggle'lar, section basliklar, temiz hiyerarsi

### Session Dashboard (`session-dashboard.png`)
- Sol sidebar: Sessions, Episodes, Clips, Analytics, Flights, Monetize nav
- Ortada session listesi (active, by date sort)
- Sag tarafta detay paneli: baslik, tarih, Recordings/Postproductions tab'lari, list/grid toggle
- Mor/pembe gradient arkaplan (dekoratif)
- CTA buton: "+ Create New Recording Session"
- **Ilham**: History sayfasi bu tarza yakinlasmali — sidebar olmasa da, session/recording listesi UX patterni, tab'lar, detay goruntuleme

### Workflow Builder (`workflow-builder.png`)
- Inkelog.io — koyu arkaplan
- Sol sidebar: Action Blocks (Requests, Code, Email, Data Map, Trigger, Save to, Webhook, Terminal)
- Ortada node-based workflow grafik (sari/mor/kirmizi node'lar, baglantilar)
- Sag panelde: Status, Name, Sequence, Encryption, Builder (code editor), "Publish block changes" buton
- **Ilham**: Gelecekte workflow/pipeline builder eklenmesi durumunda referans. Ayrica koyu tema, sari accent, sidebar pattern ornegi

## TODO
- [ ] Ana sayfayı Artify referansına göre yeniden tasarla
- [ ] Hero'ya masonry video thumbnail grid ekle
- [ ] Partner/model logo bar
- [ ] Feature section
- [ ] Footer redesign
- [ ] Daha fazla referans görsel gelecek
