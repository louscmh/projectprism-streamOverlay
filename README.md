# projectprism-streamOverlay

The main repository for the overlay of Project Prism, meant to run on tosu
___

## Setup

If you have any questions after reading all of the below, do not hesitate to contact me for clarification! The following is required to successfully run this project:
- OBS
- Tosu/Gosumemory (if warranted)
- osu! stable/cutting Edge client and osu! tournament client

### OBS Scene
The scene file is located in `projectprism-streamOverlay/_data/`. The JSON file will be named **projectprism_vX.X** in the directory.

After importing the scene file, you should be prompted with a Missing Files tab.
![obs setup 1](_shared_assets/design/setup/image.png)

Click on "Search Directory..." and select the `_shared_assets` folder in the project files. If it doesn't fully link all the missing files, try selecting the subfolders in the `_shared_assets` folder. After that, just click on Apply and the assets should be displayed.

### Tosu & Stream Directory
**[Project link for tosu](https://github.com/KotRikD/tosu#readme)**

To install the application, just download the latest release and export `tosu.exe` in whatever directory you want. Then in that same directory, create a static file and run `tosu.exe`.

To properly import all overlays, download the latest release of this project and import it into the static folder. If you have an osu! client open, the OBS scenes should properly reflect the scenes. If there's any issue projecting the overlay on OBS, you can try finding the URL link of the individual overlays by scrolling down to the target overlay and clicking on the URL parameter.
![Troubleshooting 1](https://cdn.discordapp.com/attachments/793324125723820086/1236153225892069376/image.png?ex=6636f8e7&is=6635a767&hm=c40919ab0206d5c8f31594228ee5c7dbd23d6d8a98e95b8fc0fc0b9e035e4a38&)

If you open the link in the browser and it doesn't project anything, contact louscmh immediately. If not, then OBS should be able to project the browser source.

### Commentator Overlay
In numerous scenes, there will be an overlay for the commentators in their own scene respectively. Click on the commentator overlay, and add the voice channel id that you are streaming in into the URL. (This requires you to turn on Developer Mode in Discord!)

![commentator setup 1](_shared_assets/design/setup/image2.png)

![commentator setup 2](_shared_assets/design/setup/image3.png)

### Mappool Showcase
Example scene for reference
![Example of Showcase Scene](https://cdn.discordapp.com/attachments/793324125723820086/1236058474224423083/image.png?ex=6636a0a9&is=66354f29&hm=3dbf545782e0985d38cac4563afcccf32368444eebcad2206afc5222230551c1&)

The showcase overlay uses the following JSON to function:
- `beatmaps.json`

The JSON file contains 4 variables:
- `beatmapId`: the id of your beatmap, as displayed in the URL of the beatmap link (beatmapsets/2019194#taiko/***4204844***)
- `pick`: the pick name of your beatmap (NM1, HR2, TB, etc.). This overlay supports the following mods: NM, HD, HR, DT, FM, FL, TB
- `modSR`: the star rating value of DT maps, inputted manually (float)
- `mapper`: custom string used if you want to list down more than 1 mapper

***(NOTE FOR CUSTOM MAPS)*** As unreleased maps have no beatmapId, the beatmapId will be substituted with the map's file name instead. Replace the `beatmapId` parameter with a string following this format: `Arist - Song Title (Mapper Name) [Difficulty].osu`

- `Artist`: The **ROMANIZED** name of the Artist of the song (ex: `Null Specification`)
- `Song Title`: The **ROMANIZED** name of the song (ex: `Aletheia (fake love, fake summer)`)
- `Mapper Name`: The name of the mapper associated with the beatmap (ex: `Rinze`)
- `Difficulty`: The difficulty name of the beatmap (ex: `fake promise`)

Combining all examples of the arguments, you will get `Null Specification - Aletheia (fake lover, fake summer) (Rinze) [fake promise].osu`. The string is **Case** and **Space** sensitive.

This must be updated **every week** to reflect the changes in-stream and must be distributed to the person streaming the showcase overlay.

A sample example of the JSON is included as follows:

```json
[
    { "beatmapId": 4067283, "pick": "NM1", "modSR":5.64, "mappers":""},
    { "beatmapId": 4069079, "pick": "NM2", "modSR":5.12, "mappers":""},
    { "beatmapId": 4069278, "pick": "NM3", "modSR":5.92, "mappers":""},
    { "beatmapId": 4069245, "pick": "HD1", "modSR":4.49, "mappers":""},
    { "beatmapId": 4082666, "pick": "HD2", "modSR":4.02, "mappers":""},
    { "beatmapId": "takehirotei as Infinite Limit - I.R.I.S (Jerry) [Trials of IRIS].osu", "pick": "HR1", "modSR":4.91, "mappers":""},
    { "beatmapId": "Null Specification - Aletheia (fake lover, fake summer) (Rinze) [fake promise].osu", "pick": "HR2", "modSR":4.72, "mappers":""},
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