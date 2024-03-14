// SOCKET /////////////////////////////////////////////////////////////////
let socket = new ReconnectingWebSocket("ws://" + location.host + "/ws");
socket.onopen = () => {
    console.log("Successfully Connected");
};
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => {
    console.log("Socket Error: ", error);
};

const mods = {
    NM: 0,
    HD: 8,
    HR: 16,
    DT: 64,
    FM: 0,
    FL: 1024,
    TB: 0
};

// BEATMAP DATA /////////////////////////////////////////////////////////////////
let beatmapSet = [];
let beatmaps = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../data/beatmaps.json");
        jsonData.map((beatmap) => {
            beatmapSet.push(beatmap);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
    for (index = 0; index < beatmapSet.length; index++) {
        beatmaps.push(beatmapSet[index]["beatmapId"]);
    }
})();
console.log(beatmapSet);

// API /////////////////////////////////////////////////////////////////
const file = [];
let api;
(async () => {
    try {
        const jsonData = await $.getJSON("../data/api.json");
        jsonData.map((num) => {
            file.push(num);
        });
        api = file[0].api;
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();

// HTML VARS /////////////////////////////////////////////////////////////////
let beatmapTitle = document.getElementById("beatmapTitle");
let beatmapTitleDelay = document.getElementById("beatmapTitleDelay");
let beatmapArtist = document.getElementById("beatmapArtist");
let beatmapArtistDelay = document.getElementById("beatmapArtistDelay");
let beatmapDifficulty = document.getElementById("beatmapDifficulty");
let beatmapDifficultyDelay = document.getElementById("beatmapDifficultyDelay");
let beatmapMapper = document.getElementById("beatmapMapper");
let mapPick = document.getElementById("mapPick");
let mapOD = document.getElementById("mapOD");
let mapSR = document.getElementById("mapSR");
let mapBPM = document.getElementById("mapBPM");
let mapLength = document.getElementById("mapLength");
let beatmapImage = document.getElementById("beatmapImage");
let bgVideo = document.getElementById("bgVideo");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentId = 0;

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    let beatmapId = data.menu.bm.id;
    if (currentId != beatmapId) {
        currentId = beatmapId;
        updateDetails(data);
    }
}

async function updateDetails(data) {
	let { id } = data.menu.bm;
	let { memoryOD, fullSR, BPM: { min, max } } = data.menu.bm.stats;
	let { full } = data.menu.bm.time;
    let { difficulty, mapper, artist, title } = data.menu.bm.metadata;
    let bg = `http://127.0.0.1:24050/Songs/${data.menu.bm.path.full.replace(/#/g,'%23').replace(/%/g,'%25').replace(/\\/g, '/')}?a=${Math.random(10000)}`;
    let pick;

    // CHECKER FOR MAPPICK & MODS (TO RECALCULATE STATS)
    if (beatmaps.includes(id)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["pick"];
        let mod = pick.substring(0,2).toUpperCase();
        if (mod == "HR") {
            memoryOD = Math.min(memoryOD*1.4, 10).toFixed(2);
        } else if (mod == "DT") {
            memoryOD = Math.min((79.5 - (Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * memoryOD))) / 1.5)) / 6, 1.5 > 1.5 ? 12 : 11).toFixed(2);
            full = full/1.5;
            min = Math.round(min*1.5);
            max = Math.round(max*1.5);
            let dtSR = await getDTSR(id);
            fullSR = parseFloat(dtSR.difficultyrating).toFixed(2);
        }
    }

    mapPick.innerHTML = pick == null ? "" : pick;

    beatmapTitle.innerHTML = title;
    beatmapArtist.innerHTML = artist;
    beatmapDifficulty.innerHTML = `[${difficulty}]`;
    makeScrollingText(beatmapTitle,beatmapTitleDelay,24,840);
    makeScrollingText(beatmapArtist,beatmapArtistDelay,20,840);
    makeScrollingText(beatmapDifficulty,beatmapDifficultyDelay,10,270);

    beatmapMapper.innerHTML = mapper;
    mapOD.innerHTML = `OD: ${memoryOD}`;
    mapSR.innerHTML = `SR: ${fullSR}*`;
    mapBPM.innerHTML = `BPM: ${min === max ? min : `${min}-${max}`}`;
    mapLength.innerHTML = `Length: ${parseTime(full)}`;

    beatmapImage.setAttribute('src', bg)
    beatmapImage.onerror = function() {
        beatmapImage.setAttribute('src',`https://cdn.discordapp.com/attachments/793324125723820086/1204380886213337158/bwc_mainbanner_2.png?ex=65d4861b&is=65c2111b&hm=1fe2aefa6667cedebf4908a692d87cf36962b4ab344f1e4a98a1a5cfc0b6d4de&`);
    };
}

async function getDTSR(beatmapID) {
    try {
        const data = (
            await axios.get("/get_beatmaps", {
                baseURL: "https://osu.ppy.sh/api",
                params: {
                    k: api,
                    b: beatmapID,
                    m: 1,
                    mods: 64,
                },
            })
        )["data"];
        return data.length !== 0 ? data[0] : null;
    } catch (error) {
        console.error(error);
    }
};

async function makeScrollingText(title, titleDelay, rate, boundaryWidth) {
    if (title.scrollWidth > boundaryWidth) {
		if (title.innerHTML != titleDelay.innerHTML) {
			title.innerHTML += " ";
			titleDelay.innerHTML = title.innerHTML;
			titleDelay.style.opacity = "1";
		}
		let ratio = (title.scrollWidth/boundaryWidth)*rate
		title.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animationDelay = `${-ratio/2}s`;
    } else {
		title.style.animation = "none";
		titleDelay.style.animation = "none";
		titleDelay.style.opacity = "0";
	}
}

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
}

document.addEventListener("DOMContentLoaded", function () {
    // Add an event listener to detect when the video has ended
    bgVideo.addEventListener("ended", function () {
        // Reset the video to the beginning and play again
        video.currentTime = 0;
        video.play();
    });
});