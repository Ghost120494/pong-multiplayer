# Puppy Pals discovery progression

The expanded campaign has 180 levels in 18 chapters and 12 puppy faces. New games use campaign rules 2. Existing saved runs retain the original rules 1, original 100 level definitions, seeded boards, and action replay. New runs move into rules 2; completing the old level 100 opens the expanded trail. Existing stars, coins, boosters and best scores carry forward.

## The first three days

The design budget is about 2.5 minutes per level, six levels per discovery beat, and 24 levels per day of play. That gives approximately one fresh idea every 15 active minutes and three acts of 60 minutes across the first 72 levels. Players can split an act into shorter visits. These are estimates, not measured retention results: quick players will discover things sooner, and difficult levels can take longer. Nothing waits for a real-world day or a countdown.

| Level | Approximate active time | Discovery | Follow-up |
| --- | --- | --- | --- |
|2|Early welcome|Paw pop; two free uses|Level 8 introduces grass clearing.|
|14|~30 minutes|Shuffle; two free uses, plus the Dalmatian|Level 20 asks for two different breeds.|
|26|~60 minutes|Lucky Start; two extra opening moves on picnic/tutorial levels, plus the Golden Retriever|Level 32 introduces grass with two layers.|
|38|~90 minutes|Rainbow; one free use|Level 44 asks players to create a special with a four, five, or L/T match.|
|50|~120 minutes|Treat Trail; 25 extra coins on first wins at picnic/tutorial levels, plus the Boston Terrier|Level 56 introduces extra cascade-clear goals.|
|62|~150 minutes|Trail Charm; an opening striped puppy on picnic/tutorial levels|Level 68 combines collection, garden clearing and score goals.|

The bonus and challenge beats are six levels apart: 2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68. A new bonus first appears in a gentle welcome level before the next challenge asks the player to practice. Normal matches can still create specials earlier; the special-creation objective is introduced later. Hints remain free from the beginning.

Paw pop, Shuffle and Rainbow are not all shown or sold on the first screen. Their unlock levels are 2, 14 and 38. The app records discovery gifts so replaying an earlier level does not repeatedly award them. Existing players keep previously owned boosters.

## The longer trail

The Shiba Inu arrives at 74, Dachshund at 98, Samoyed at 122 and Border Collie at 146. Subsequent beats continue at six-level intervals through 176, alternating welcomes/picnics with garden, special-making and cascade challenges. Eight additional regions extend the journey through Golden Grove, Terrier Terrace, Marshmallow Mountain, Ribbon River, Collie Coast, Starflower Vale, Festival Fields and Homecoming Hollow.

Only five or six breeds are active on a board, even after all 12 have been discovered. The latest puppy remains in the active palette while familiar breeds rotate by chapter. This adds recognizable new faces without making matches scarce by putting 12 breeds on one board.

Gentle chapter openings and positive discovery tutorials are picnic levels. Starting at 26 they receive two extra moves; from 50 their first win earns 25 extra coins; from 62 they also begin with one striped puppy. These effects are defined by the campaign, remain deterministic on reload, and do not alter old saved runs. The extra coins are awarded only for a first completion, never for repeating the same level.

## Rules and validation

- A special goal counts newly **created** specials, including those created by falling matches. Activating an existing special does not count as creating another.
- A cascade goal counts every extra clearing stage after the first in a chain, accumulating across moves. The initial clear does not count as a cascade.
- Garden targets equal the number of grass squares multiplied by their layers. Every collection target names a breed present in that level's active palette.
- Campaign tests verify the original 100 level metadata hash, discovery spacing, unlock order, active palettes, goal consistency and picnic bonus boundaries. Engine tests independently verify legacy replay hashes and real play through the expanded campaign.

This release keeps progress on the device and does not add engagement analytics, notifications, real-time gates, or account tracking. The estimated pacing can be tuned after observing ordinary playtests; it does not guarantee a particular session length or retention rate.
