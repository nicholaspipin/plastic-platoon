# Plastic Platoon Art Notes

Research pass completed before art implementation.

## Classic Green Army Men

Sources reviewed:

- eBay image result: close-up glossy green soldier with oval base and rifle, `https://i.ebayimg.com/images/g/3pkAAOSwNgZhkDdz/s-l1200.jpg`
- eBay image result: rear view on carpet with bright hard highlight across helmet/back/base, `https://i.ebayimg.com/images/g/bZMAAOSwn29jozH~/s-l1200.jpg`
- Public Domain Pictures: clustered green plastic soldiers with shallow focus, `https://www.publicdomainpictures.net/en/view-image.php?image=334718&picture=green-plastic-toy-soldiers`
- Product/reference image result: multiple soldier poses on oval bases, `https://www.mightytoy.com/products/giant-27-inch-battleship-with-6-modern-planes`

Rendering takeaways:

- The toy read comes from monochrome pigment plus sculpted form, not multicolor costume detail.
- Hard white/specular streaks belong on helmet, shoulder, back, rifle, and the raised rim of the oval base.
- Occlusion should be a darker same-hue tone under the helmet brim, inside elbows, between legs, under rifle arms, and at the base/feet contact.
- A soft contact ellipse beneath the oval base is essential at phone scale.
- Molded clothing folds can be simple ridge marks; avoid thin linework that will shimmer.
- Green and tan armies should share the same material rules so they read as two batches of molded toys.

## Tilt-Shift / Miniature Faking

Sources reviewed:

- Digital Photography School tilt-shift overview, `https://digital-photography-school.com/an-introduction-to-tilt-shift-photography/`
- Wikipedia miniature faking, `https://en.wikipedia.org/wiki/Miniature_faking`
- Photo StackExchange discussion of why tilt-shift sells miniature scale, `https://photo.stackexchange.com/questions/20990/why-does-using-a-tilt-shift-lens-make-things-look-miniature`
- iPhotography tilt-shift tutorial snippet, `https://www.iphotography.com/blog/tilt-shift-photography-tutorial/`

Rendering takeaways:

- Keep the combat lane sharp and make top/bottom strips feel optically softened.
- Add a slight dark vignette and boosted contrast/saturation so the scene reads photographed, not merely drawn.
- High-angle stage cues matter: floor texture, shadows, and oversized props need to imply looking down at toys.
- Use pre-baked strip overlays instead of per-frame canvas blur. Cheap implementation: translucent top/bottom gradient layers with repeated offset copies/noise, plus a crisp center band.
- Props should be large and recognizable: pencil, brick block, coin stack, sock hill, ruler bridge, cereal/cardboard walls.

## Juice It or Lose It

Sources reviewed:

- GDC Vault summary for Martin Jonasson and Petri Purho's "Juice It or Lose It", `https://www.gdcvault.com/play/1016487/juice-it-or-lose`
- YouTube talk page, `https://www.youtube.com/watch?v=Fy0aCDmgnxg`
- GameJuice resource summary, `https://gamejuice.co.uk/resources/juice-it-or-lose-it`
- Matt Hackett resource note, `https://www.richtaur.com/GameDevTreasure/post/juice-it-or-lose-it/`

Implementation takeaways:

- Every meaningful event should stack several tiny confirmations: scale, particles, sound, number, flash, and motion.
- Use squash/stretch on stamp and buttons.
- Use easing on pickups and UI counters; never snap currency.
- Floaters and particles should be short, readable, and pooled.
- The molder stamp is the heartbeat. It needs a flash, compression pose, chunk sound, ejected-hop timing, and small camera kick.

## The Art of Screenshake

Sources reviewed:

- YouTube talk page for Jan Willem Nijman, `https://www.youtube.com/watch?v=AJdEqssNZ-U`
- Alternate YouTube listing, `https://www.youtube.com/watch?v=SkgkIXZ_13Y`
- Reddit notes listing techniques including camera lerp, camera position, screen shake, and recoil/knockback, `https://www.reddit.com/r/gamedev/comments/1t0jlc/vlambeers_jan_willem_nijman_the_art_of_screenshake/`
- Recreation repository, `https://github.com/colinbellino/screenshake`

Implementation takeaways:

- Shake should be directional and decaying, with a strict maximum budget.
- Overlapping shakes should choose the strongest current shake, not sum into unreadable motion.
- Hit-stop should be used sparingly for boss death and high-impact moments.
- Camera feedback must clarify cause: rubber band snaps shove along the snap direction; robot death uses a heavy centered thump.
- Reduced-motion should replace shake/hit-stop with flashes and larger particles.

## Hybrid-Casual / Idle UI

Sources reviewed:

- AppMagic hybrid-casual Q1 2025 overview, `https://appmagic.rocks/blog/hybridcasual-q1-2025`
- CAS.AI hybrid monetization article, `https://cas.ai/blog/hybrid-monetization-in-mobile-games-a-practical-guide/`
- Dribbble casual game UI index, `https://dribbble.com/tags/casual-game-ui`
- Shutterstock mobile game UI search preview, `https://www.shutterstock.com/search/mobile-game-ui-design`

UI takeaways:

- Put upgrade actions in the bottom thumb zone with chunky physical buttons.
- Use large counters, animated affordability states, and obvious reward moments.
- Avoid generic dark panels. Plastic Platoon should use cardboard, blister-pack stickers, starbursts, and price tags.
- Reward cards should pop in with bounce, show the source of value, and include one obvious claim action.
- Buttons need pressed states with a physical vertical offset and readable labels at mobile size.

## Art Checklist Additions For Self-Review

- At 390x844, green/tan/boss silhouettes must remain readable with the phone at arm's length.
- The molder must visually outweigh the first wave of soldiers on the left side.
- Any default-looking flat fill should receive either a hard highlight, occlusion edge, contact shadow, texture, or packaging treatment.
- Bottom UI must not cover the main read of the molder stamp or the rubber-band cooldown.
