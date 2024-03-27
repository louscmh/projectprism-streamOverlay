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
let topContainer = document.getElementById("topContainer");
let bottomContainer = document.getElementById("bottomContainer");
let beatmapTitle = document.getElementById("beatmapTitle");
let beatmapArtist = document.getElementById("beatmapArtist");
let beatmapMapper = document.getElementById("beatmapMapper");
let mapPick = document.getElementById("mapPick");
let mapOD = document.getElementById("mapOD");
let mapSR = document.getElementById("mapSR");
let mapBPM = document.getElementById("mapBPM");
let mapLength = document.getElementById("mapLength");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentId = 0;

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    let beatmapId = data.menu.bm.id;
    if (currentId != beatmapId) {
        currentId = beatmapId;
        topContainer.style.transform = "translateX(1820px)";
        bottomContainer.style.transform = "translateX(-1820px)";
        setTimeout(function() {
            updateDetails(data);
            topContainer.style.transform = "translateX(0)";
            bottomContainer.style.transform = "translateX(0)";
        }, 2000);
    } else {
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
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        }
    }

    mapPick.innerHTML = pick == null ? "XX1" : pick;

    beatmapTitle.innerHTML = title;
    beatmapArtist.innerHTML = artist;
    adjustFont(beatmapTitle,1500,70);

    beatmapMapper.innerHTML = `Mapset by ${mapper}`;
    mapOD.innerHTML = `OD ${memoryOD}`;
    mapSR.innerHTML = `SR ${fullSR}*`;
    mapBPM.innerHTML = `BPM ${min === max ? min : `${min}-${max}`}`;
    mapLength.innerHTML = `Length ${parseTime(full)}`;
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

async function adjustFont(title, boundaryWidth, originalFontSize) {
    if (title.scrollWidth > boundaryWidth) {
		let ratio = (title.scrollWidth/boundaryWidth);
        title.style.fontSize = `${originalFontSize/ratio}px`;
    } else {
		title.style.fontSize = `${originalFontSize}px`;
	}
}

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
}