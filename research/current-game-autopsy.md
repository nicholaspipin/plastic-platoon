# Current Game Autopsy — why v1 doesn't retain

Honest analysis of the shipped v1 loop, written before the rework. The art and
feel pass; the *game* underneath is hollow. Specific failures:

## 1. Nothing can be lost, so nothing matters
Tans stop at a line and can't hurt anything permanent. Waves are infinite and
unlabeled beyond a counter. There is no battle you can WIN and no wall you can
LOSE against — which means no tension, no victory dopamine, no "one more try".
The wave counter is a number, not a goal.

## 2. The only verb is "buy the same 4 numbers"
FASTER / BIGGER / RIFLES / SCOUTS is the entire decision space, and none of them
change *how* the game plays — they scale the same rifleman. After 3 minutes the
player has seen 100% of the game's mechanics. Nothing new ever arrives except a
palette swap at wave 15.

## 3. The snowball erases the sim
Green army growth outpaces tan HP scaling; by wave ~10 waves melt on contact at
the screen edge. The battlefield becomes a wall of green idling at the clamp
line. The battalion multiplier makes the count meaningless (×N applied
invisibly). The player's army getting stronger *removes* visible combat — the
game literally plays itself out of being interesting.

## 4. Prestige is a math checkbox, not a fantasy
"Back in the Box" gives +10% scrap per medal — a flat multiplier with no
choices, no tree, no new content unlocked. Resetting loses the only thing that
felt like progress (the wave number) and buys nothing you can *see*.

## 5. Zero reasons to return tomorrow
No daily anything. No quests. No unlock you're waiting on. No "almost there"
state that persists overnight. Offline earnings pay scrap into a system whose
only sink is 4 buttons the player has already maxed mentally.

## 6. Economy pacing is untuned
FASTER×1.8 and BIGGER×2.2 cost growth against roughly-linear income → purchase
cadence collapses from seconds to tens of minutes within one session, with
nothing to bridge the gap. No short/medium/long goal ladder.

## What must survive the rework (validated by v1)
- The Molder stamp beat + spawn hop (the game's heartbeat, feels great)
- The plastic-toy material read, tilt-shift diorama, toy-packaging UI
- The band snap active + juice/audio layer
- 60fps at 200+ units, save robustness, offline pipeline (mechanics are sound —
  the *numbers and structure* around them are what's hollow)
