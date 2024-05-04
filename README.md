# projectprism-streamOverlay
The main repository for the overlay of Project Prism, meant to run on tosu
___
## Setup

If you have any questions after reading all of below, do not hesitate to contact me for clarification! The following is required to successfully run this project:
- OBS
- Tosu/Gosumemory (if warrented)
- osu! stable/cutting Edge client and osu! tournament client

### OBS Scene
The scene file is located in otmt2024-streamOverlay/_data/
The json file will be named **projectprism_vX.X** in the directory.

### Tosu & Stream Directory
**[Project link for tosu](https://github.com/KotRikD/tosu#readme)**

To install the application, just download the latest release and export tosu.exe in whatever directory you want. Then in that same directory, create a static file and run tosu.

To properly import all overlays, download the latest release of this project and import it into the static folder. If you have an osu! client open the OBS scenes should be properly reflecting the scenes. If theres any issue on projecting the overlay on obs, you can try finding the url link of the individual overlays by scrolling down to the target overlay and click on the URL parameter.
![Troubleshooting 1](https://cdn.discordapp.com/attachments/793324125723820086/1236153225892069376/image.png?ex=6636f8e7&is=6635a767&hm=c40919ab0206d5c8f31594228ee5c7dbd23d6d8a98e95b8fc0fc0b9e035e4a38&)

If you open the link in the browser and it doesn't project anything, contact louscmh immedietely. If not, then OBS should be able to project the browser source.

### Mappool Showcase
Example scene for reference
![Example of Showcase Scene](https://cdn.discordapp.com/attachments/793324125723820086/1236058474224423083/image.png?ex=6636a0a9&is=66354f29&hm=3dbf545782e0985d38cac4563afcccf32368444eebcad2206afc5222230551c1&)

The showcase ovelay uses the following JSON to function:
- beatmaps.json

the json file contains 4 variables:
- beatmapId: the id of your beatmap, as displayed in the url of the beatmap link (beatmapsets/2019194#taiko/***4204844***)
- pick: the pick name of your beatmap (NM1, HR2, TB, etc.). This overlay supports the following mods: NM, HD, HR, DT, FM, FL, TB
- modSR: the star rating value of DT maps, inputted manually (float)
- mapper: custom string used if you want to list down more than 1 mappers

This must be updated **every week** to reflect the changes in-stream and must be distributed to the person streaming the showcase overlay.

A sample example of the json is included as follows:
```[
    { "beatmapId": 4067283, "pick": "NM1", "modSR":5.64, "mappers":""},
    { "beatmapId": 4069079, "pick": "NM2", "modSR":5.12, "mappers":""},
    { "beatmapId": 4069278, "pick": "NM3", "modSR":5.92, "mappers":""},
    { "beatmapId": 4069245, "pick": "HD1", "modSR":4.49, "mappers":""},
    { "beatmapId": 4082666, "pick": "HD2", "modSR":4.02, "mappers":""},
    { "beatmapId": 4069215, "pick": "HR1", "modSR":4.91, "mappers":""},
    { "beatmapId": 4082668, "pick": "HR2", "modSR":4.72, "mappers":""},
    { "beatmapId": 4069232, "pick": "DT1", "modSR":5.62, "mappers":""},
    { "beatmapId": 2590170, "pick": "DT2", "modSR":6.67, "mappers":""},
    { "beatmapId": 4069219, "pick": "FM1", "modSR":4.7, "mappers":"me, my mother, and your dad"}
]
```
___
## To-do List

### Drafting
- [ ] Draft Layout of Match Scene
- [ ] Draft Layout of Mappool Scene
- [X] Draft Layout of Showcase Scene
- [ ] Draft Layout of Winner Scene
- [ ] Draft Layout of Schedule Scene
- [ ] Draft Layout of Player Intro Scene
### Implementation (Design + Functionality)
- [ ] Implementation of Match Scene
- [ ] Implementation of Mappool Scene
- [x] Implementation of Showcase Scene
- [ ] Implementation of Winner Scene
- [ ] Implementation of Schedule Scene
- [ ] Implementation of Player Intro Scene

## Scene Features

### Match
- Live display of BG, SR, OD, BPM, Length, adjusted to the map's mods
- Player's pick
- Mappick
- Player's match point
- Player's PFP
- Player's Seed
- Scorebar, Scorevalue & Score difference meter
- Chat
- Commentator Section
- Stage Indicator

### Mappool
- Live display of SR, OD, BPM, Length, adjusted to the map's mods
- Player's pick
- Mappick
- Player's match point
- Player's PFP
- Player's Seed
- Chat
- Maps, grouped by their mods (mod icon, song title, difficulty & mapper displayed)
- Commentator Section
- Stage Indicator

### Showcase
- Live display of BG, SR, OD, BPM, Length, adjusted to the map's mods
- Map progress bar
- Mappick
- Commentator Section
- Stage Indicator

### Winner
- Display of the final score point between both players w/ their pfp & name

### Schedule
- Displays upcoming matches from system time, indicated by the player's pfp & their names

### Player Intro
- Name
- PFP
- Seed
- Rank
- Topplays (TENTATIVE)
- Past Match Result (VERY TENTATIVE)