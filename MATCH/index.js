// SOCKET
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

// JSON DATA /////////////////////////////////////////////////////////////////
let beatmapSet = [];
let beatmaps = [];
let seeds = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/beatmaps.json");
        jsonData.map((beatmap) => {
            beatmapSet.push(beatmap);
        });
        const seedData = await $.getJSON("../_data/prism_seed.json");
        seedData.map((seed) => {
            seeds.push(seed);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
    for (index = 0; index < beatmapSet.length; index++) {
        beatmaps.push(beatmapSet[index]["beatmapId"]);
    }
})();
console.log(beatmapSet);
console.log(beatmaps);
console.log(seeds);

// API /////////////////////////////////////////////////////////////////
const file = [];
let api;
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/api.json");
        jsonData.map((num) => {
            file.push(num);
        });
        api = file[0].api;
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();

// HTML VARS /////////////////////////////////////////////////////////////////
let playerOne = document.getElementById("playerOneName");
let playerOneSeed = document.getElementById("playerOneSeed");
let playerOneRank = document.getElementById("playerOneRank");
let playerTwo = document.getElementById("playerTwoName");
let playerTwoSeed = document.getElementById("playerTwoSeed");
let playerTwoRank = document.getElementById("playerTwoRank");
let playerOnePic = document.getElementById("playerOnePic");
let playerTwoPic = document.getElementById("playerTwoPic");

let beatmapTitle = document.getElementById("song");
let beatmapTitleDelay = document.getElementById("songDelay");
let beatmapMapper = document.getElementById("mapper");
let mapText = document.getElementById("pickID");
let mapOD = document.getElementById("mapOD");
let mapSR = document.getElementById("mapSR");
let mapBPM = document.getElementById("mapBPM");
let mapLength = document.getElementById("mapLength");
let mapBG = document.getElementById("bg");

let scoreBlue = document.getElementById("scoreBlue");
let scoreRed = document.getElementById("scoreRed");

let fill = document.getElementById("fill");

let score = document.getElementById("score");
let playerOneScore = document.getElementById("playerOneScore");
let playerTwoScore = document.getElementById("playerTwoScore");
let scoreDifference = document.getElementById("scoreDifference");

let leftContent = document.getElementById("leftContent");
let rightContent = document.getElementById("rightContent");

let goodOne = document.getElementById("goodOne");
let missOne = document.getElementById("missOne");
let urOne = document.getElementById("urOne");
let goodTwo = document.getElementById("goodTwo");
let missTwo = document.getElementById("missTwo");
let urTwo = document.getElementById("urTwo");

let winScreen = document.getElementById("winScreen");
let winnerName = document.getElementById("winnerName");
let playerOneFinal = document.getElementById("playerOneFinal");
let playerTwoFinal = document.getElementById("playerTwoFinal");
let percentage = document.getElementById("percentage");

// PLACEHOLDER VARS //////////////////////////////////////////////
let tempLeft;
let tempRight;
let bestOfTemp;
let scoreBlueTemp;
let scoreRedTemp;
let scoreEvent;
let tempBG;
let previousState;
let cachedPlayerOneScore;
let cachedPlayerTwoScore;
let cachedDifference;
let currentFile = "";
let barThreshold = 100000;

// FOR ANIMATION //////////////////////////////////////////////////
let animationScore = {
	playerOneScore: new CountUp('playerOneScore', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
	playerTwoScore: new CountUp('playerTwoScore', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    scoreDifference: new CountUp('scoreDifference', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    urOne: new CountUp('urOne', 0, 0, 2, { useEasing: true, useGrouping: true, separator: "", decimal: ".", decimalPlaces:2}),
    urTwo: new CountUp('urTwo', 0, 0, 2, { useEasing: true, useGrouping: true, separator: "", decimal: ".", decimalPlaces:2 })
}

// MAIN LOOP ////////////////////////////////////////////////////////////////
socket.onmessage = async event => {
    let data = JSON.parse(event.data);

    fill.style.width = `${(data.menu.bm.time.current/data.menu.bm.time.full > 1 ? 1 : data.menu.bm.time.current/data.menu.bm.time.full)*700}px`;
    tempLeft = data.tourney.manager.teamName.left;
    tempRight = data.tourney.manager.teamName.right;

    if (previousState != data.tourney.manager.ipcState) {
        checkState(data.tourney.manager.ipcState);
        previousState = data.tourney.manager.ipcState;
    }

    // BG
    if(tempBG !== data.menu.bm.path.full){
        tempBG = data.menu.bm.path.full;
        data.menu.bm.path.full = data.menu.bm.path.full.replace(/#/g,'%23').replace(/%/g,'%25');
		bg.setAttribute('src',`http://` + location.host + `/Songs/${data.menu.bm.path.full}?a=${Math.random(10000)}`);
		bg.onerror = function() {
			bg.setAttribute('src',`../_shared_assets/design/temporary_bg.png`);
		};
		
    }

    // Player Names
    if (tempLeft != playerOne.innerHTML) {
        playerOne.innerHTML = tempLeft;
        setPlayerDetails(playerOnePic, playerOneSeed, playerOneRank, tempLeft);
    }
    if (tempRight != playerTwo.innerHTML) {
        playerTwo.innerHTML = tempRight;
        setPlayerDetails(playerTwoPic, playerTwoSeed, playerTwoRank, tempRight);
    }

    let file = data.menu.bm.path.file;
    if (currentFile != file) {
        currentFile = file;
        updateDetails(data);
    }
    makeScrollingText(beatmapTitle, beatmapTitleDelay,16,630,40);

    if (data.tourney.manager.bools.scoreVisible) {
        updateScore(data.tourney.manager.gameplay.score.left, data.tourney.manager.gameplay.score.right);
        updateClientStats(data.tourney.ipcClients);
    }

    if (bestOfTemp !== Math.ceil(data.tourney.manager.bestOF / 2) || scoreBlueTemp !== data.tourney.manager.stars.left || scoreRedTemp !== data.tourney.manager.stars.right) {

		// Courtesy of Victim-Crasher
		bestOfTemp = Math.ceil(data.tourney.manager.bestOF / 2);

		// To know where to blow or pop score
		if (scoreBlueTemp < data.tourney.manager.stars.left) {
			scoreEvent = "blue-add";
		} else if (scoreBlueTemp > data.tourney.manager.stars.left) {
			scoreEvent = "blue-remove";
		} else if (scoreRedTemp < data.tourney.manager.stars.right) {
			scoreEvent = "red-add";
		} else if (scoreRedTemp > data.tourney.manager.stars.right) {
			scoreEvent = "red-remove";
		}

		scoreBlueTemp = data.tourney.manager.stars.left;
		scoreBlue.innerHTML = "";
		for (var i = 0; i < scoreBlueTemp; i++) {
			if (scoreEvent === "blue-add" && i === scoreBlueTemp - 1) {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFillAnimate");
				scoreBlue.appendChild(scoreFill);
			} else {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFill");
				scoreBlue.appendChild(scoreFill);
			}
		}
		for (var i = 0; i < bestOfTemp - scoreBlueTemp; i++) {
			if (scoreEvent === "blue-remove" && i === 0) {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score scoreNoneAnimate");
				scoreBlue.appendChild(scoreNone);
			} else {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
				scoreBlue.appendChild(scoreNone);
			}
		}

		scoreRedTemp = data.tourney.manager.stars.right;
		scoreRed.innerHTML = "";
		for (var i = 0; i < bestOfTemp - scoreRedTemp; i++) {
			if (scoreEvent === "red-remove" && i === bestOfTemp - scoreRedTemp - 1) {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score scoreNoneAnimate");
				scoreRed.appendChild(scoreNone);
			} else {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
				scoreRed.appendChild(scoreNone);
			}
		}
		for (var i = 0; i < scoreRedTemp; i++) {
			if (scoreEvent === "red-add" && i === 0) {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFillAnimate");
				scoreRed.appendChild(scoreFill);
			} else {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFill");
				scoreRed.appendChild(scoreFill);
			}
		}
	}
}

// FUNCTIONS ////////////////////////////////////////////////////////////////
async function updateDetails(data) {
	let { id } = data.menu.bm;
	let { memoryOD, fullSR, BPM: { min, max } } = data.menu.bm.stats;
	let { full } = data.menu.bm.time;
    let { difficulty, mapper, artist, title } = data.menu.bm.metadata;
    let file = data.menu.bm.path.file;
    let pick;
    let customMapper = "";

    // CHECKER FOR MAPPICK & MODS (TO RECALCULATE STATS)
    if (beatmaps.includes(id)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["pick"];
        customMapper = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["mappers"];
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
    } else if (beatmaps.includes(file)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === file)["pick"];
        customMapper = beatmapSet.find(beatmap => beatmap["beatmapId"] === file)["mappers"];
        let mod = pick.substring(0,2).toUpperCase();
        if (mod == "HR") {
            memoryOD = Math.min(memoryOD*1.4, 10).toFixed(2);
        } else if (mod == "DT") {
            memoryOD = Math.min((79.5 - (Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * memoryOD))) / 1.5)) / 6, 1.5 > 1.5 ? 12 : 11).toFixed(2);
            full = full/1.5;
            min = Math.round(min*1.5);
            max = Math.round(max*1.5);
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === file)["modSR"];
        }
    }
    
    mapText.innerHTML = pick == null ? "XX1" : pick;
    // paintMod(pick);

    beatmapTitle.innerHTML = `${artist} - ${title}`;
    beatmapMapper.innerHTML = customMapper != "" ? `Mapped by ${customMapper}`:`Mapset by ${mapper}`;
    mapOD.innerHTML = `OD ${memoryOD}`;
    mapSR.innerHTML = `SR ${fullSR}*`;
    mapBPM.innerHTML = `BPM ${min === max ? min : `${min}-${max}`}`;
    mapLength.innerHTML = `Length ${parseTime(full)}`;
}

async function setPlayerDetails(element, seed, rank, username) {
    if (username === "") {
        return false;
    }

    const data = await getUserDataSet(username);
    if (data !== null) {
        source = `http://s.ppy.sh/a/${data.user_id}`
        element.setAttribute('src',source);
        playerSeed = seeds.find(seed => seed["playerID"] == data.user_id)["Seed"];
        seed.innerHTML = `SEED ${playerSeed}`;
        rank.innerHTML = `RANK #${data.pp_rank}`;
        return true;
    } else {
        return false;
    }
}

async function getUserDataSet(name) {
    try {
        const data = (
            await axios.get("/get_user", {
                baseURL: "https://osu.ppy.sh/api",
                params: {
                    k: api,
                    u: name,
                    m: 1,
                },
            })
        )["data"];
        return data.length !== 0 ? data[0] : null;
    } catch (error) {
        console.error(error);
    }
}

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
}

async function updateScore(playScoreOne, playScoreTwo) {
    difference = Math.abs(playScoreOne-playScoreTwo);
    animationScore.playerOneScore.update(playScoreOne);
    animationScore.playerTwoScore.update(playScoreTwo);
    animationScore.scoreDifference.update(difference);
    cachedPlayerOneScore = playScoreOne;
    cachedPlayerTwoScore = playScoreTwo;
    cachedDifference = difference;
    if (playScoreOne > playScoreTwo) {
        leftContent.style.width = `${(difference/barThreshold > 1 ? 1 : difference/barThreshold)*710}px`;
        rightContent.style.width = "0px";
    } else if (playScoreOne < playScoreTwo) {
        rightContent.style.width = `${(difference/barThreshold > 1 ? 1 : difference/barThreshold)*710}px`;
        leftContent.style.width = "0px";
    } else {
        leftContent.style.width = "0px";
        rightContent.style.width = "0px";
    }
}

async function updateClientStats(data) {
    playerOneData = data[0].gameplay.hits;
    playerTwoData = data[1].gameplay.hits;

    animationScore.urOne.update(playerOneData.unstableRate);
    animationScore.urTwo.update(playerTwoData.unstableRate);

    goodOne.innerHTML = playerOneData["100"];
    missOne.innerHTML = playerOneData["0"];
    goodTwo.innerHTML = playerTwoData["100"];
    missTwo.innerHTML = playerTwoData["0"];
}

async function makeScrollingText(title, titleDelay, rate, boundaryWidth, padding) {
    if (title.scrollWidth > boundaryWidth) {
        titleDelay.innerHTML = title.innerHTML;
        titleDelay.style.opacity = "1";
		let ratio = (title.scrollWidth/boundaryWidth)*rate
		title.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animationDelay = `${-ratio/2}s`;
		titleDelay.style.paddingRight = `${padding}px`;
		title.style.paddingRight = `${padding}px`;
        titleDelay.style.display = "initial";
    } else {
        titleDelay.style.display = "none";
		title.style.animation = "none";
		titleDelay.style.animation = "none";
		titleDelay.style.opacity = "0";
		titleDelay.style.paddingRight = "0px";
		title.style.paddingRight = "0px";
	}
}

async function checkState(ipcState) {
    if (ipcState == 4 & previousState == 3 & cachedPlayerOneScore != cachedPlayerTwoScore) {
        console.log("happened1");
        playerOneFinal.innerHTML = cachedPlayerOneScore;
        playerTwoFinal.innerHTML = cachedPlayerTwoScore;
        let ratio = cachedDifference/cachedPlayerOneScore>cachedPlayerTwoScore?cachedPlayerOneScore:cachedPlayerTwoScore;
        winnerName.innerHTML = cachedPlayerOneScore > cachedPlayerTwoScore ? playerOne.innerHTML : playerTwo.innerHTML;
        winnerName.color = cachedPlayerOneScore > cachedPlayerTwoScore ? "#900f93" : "#377a17";
        percentage = `${ratio*100}%`
        score.style.opacity = 0;
        winScreen.style.animation = "moveUp 1s ease-in-out";
        winScreen.style.transform = "translateY(-300px)";
    } else if (ipcState == 3 & previousState == 1) {
        console.log("happened2");
        winScreen.style.animation = "moveDown 1s ease-in-out";
        winScreen.style.transform = "translateY(0px)";
    } else if (ipcState == 1 & previousState == 4) {
        console.log("happened3");
        score.style.opacity = 1;
    }
}