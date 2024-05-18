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

// BEATMAP DATA /////////////////////////////////////////////////////////////////
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

let beatmapImage = document.getElementById("beatmapImage");
let pickID = document.getElementById("pickID");
let song = document.getElementById("song");
let mapper = document.getElementById("mapper");
let stats = document.getElementById("stats");
let mapOD = document.getElementById("mapOD");
let mapSR = document.getElementById("mapSR");
let mapBPM = document.getElementById("mapBPM");
let mapLength = document.getElementById("mapLength");

let pickOneContainer = document.getElementById("pickOneContainer");
let pickTwoContainer = document.getElementById("pickTwoContainer");
let banOneContainer = document.getElementById("banOneContainer");
let banTwoContainer = document.getElementById("banTwoContainer");

let upcomingText = document.getElementById("upcomingText");
let selectedMapContainer = document.getElementById("selectedMapContainer");
let foregroundMap = document.getElementById("foregroundMap");
let pickingText = document.getElementById("pickingText");
let selectedMap = document.getElementById("selectedMap");
let mapFrame = document.getElementById("map");

let banButton = document.getElementById("banButton");
let pickButton = document.getElementById("pickButton");
let playerOneButton = document.getElementById("playerOneButton");
let playerTwoButton = document.getElementById("playerTwoButton");
let nextButton = document.getElementById("nextButton");

let scoreBlue = document.getElementById("scoreBlue");
let scoreRed = document.getElementById("scoreRed");

let leftPickMatch = document.getElementById("leftPickMatch");
let rightPickMatch = document.getElementById("rightPickMatch");

let pickOne = document.getElementById("pickOne");
let pickTwo = document.getElementById("pickTwo");

let chatContainer = document.getElementById("chatContainer");
let beatmapOverlay = document.getElementById("overlay");

// PLACEHOLDER VARS //////////////////////////////////////////////
let tempLeft;
let tempRight;
let hasSetup = false;
let banCount = 0;
let currentPlayer;
let turn;
let currentPhase;
let bestOfTemp;
let scoreBlueTemp;
let scoreRedTemp;
let scoreEvent;
let picking = true;
const beatmapData = new Set(); // Store beatmapID;
let cachePlayerOneScore;
let cacbePlayerTwoScore;
let currentPick;
let previousPhase;
let chatLen;

// MAIN LOOP ////////////////////////////////////////////////////////////////
socket.onmessage = async event => {
    let data = JSON.parse(event.data);

    if (previousPhase != data.tourney.manager.ipcState) {
        if (data.tourney.manager.bools.scoreVisible && data.tourney.manager.ipcState != 4) {
            cachedPlayerOneScore = data.tourney.manager.gameplay.score.left;
            cachedPlayerTwoScore = data.tourney.manager.gameplay.score.right;
        } else if (data.tourney.manager.ipcState == 4) {
            if (cachedPlayerOneScore > cachedPlayerTwoScore) {
                console.log("happened win");
                markWin(`pick${currentPick}Clicker`, true);
            } else {
                console.log("happened lose");
                markWin(`pick${currentPick}Clicker`, false);
            }
            nextButton.click();
        }
        previousPhase = data.tourney.manager.ipcState;
    }

    if (tempLeft != data.tourney.manager.teamName.left) {
        tempLeft = data.tourney.manager.teamName.left == "" ? "PLAYER 1":data.tourney.manager.teamName.left;
    }
    if (tempRight != data.tourney.manager.teamName.right) {
        tempRight = data.tourney.manager.teamName.right==""?"PLAYER 2":data.tourney.manager.teamName.right;
    }

    if (chatLen != data.tourney.manager.chat.length) {
        updateChat(data);
    }

    // Player Names
    if (tempLeft != playerOne.innerHTML) {
        playerOne.innerHTML = tempLeft;
        adjustFont(playerOne,270,30);
        tempLeft != "PLAYER 1" ? setPlayerDetails(playerOnePic, playerOneSeed, playerOneRank, tempLeft):null;
    }
    if (tempRight != playerTwo.innerHTML) {
        playerTwo.innerHTML = tempRight;
        adjustFont(playerTwo,270,30);
        tempRight != "PLAYER 2" ? setPlayerDetails(playerTwoPic, playerTwoSeed, playerTwoRank, tempRight):null;
    }

    if (!hasSetup) {
        setupBeatmaps();
        currentPlayer = tempLeft;
        turn = 0;
        overlay.style.backgroundColor = "rgba(86, 38, 122, 0.5)";
        pickOne.style.opacity = 1;
        currentPhase = "banning";
        pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
        pickingText.style.animation = `pickingIn 0.75s ease-in-out`;
        updateElipsis();
    };

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

// SETTING UP CONTROL PANEL
banButton.addEventListener("click", function(event) {
    currentPhase = "banning";
    pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
})

pickButton.addEventListener("click", function(event) {
    currentPhase = "picking";
    pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
})

playerOneButton.addEventListener("click", function(event) {
    currentPlayer = tempLeft;
    pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
    if (picking) {
        overlay.style.backgroundColor = "rgba(86, 38, 122, 0.5)";
    }
})

playerTwoButton.addEventListener("click", function(event) {
    currentPlayer = tempRight;
    pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
    if (picking) {
        overlay.style.backgroundColor = "rgba(25, 103, 25, 0.5)";
    }
})

nextButton.addEventListener("click", function(event) {
    console.log("happened");
    picking = true;
    if (currentPlayer == tempRight) {
        currentPlayer = tempLeft;
        turn = 0;
        overlay.style.backgroundColor = "rgba(86, 38, 122, 0.5)";
        pickOne.style.opacity = 1;
        pickTwo.style.opacity = 0;
    } else {
        currentPlayer = tempRight;
        turn = 1;
        overlay.style.backgroundColor = "rgba(25, 103, 25, 0.5)";
        pickOne.style.opacity = 0;
        pickTwo.style.opacity = 1;
    }
    foregroundMap.style.animation = "pickingOut 0.75s ease-in-out";
    selectedMapContainer.style.transform = "translateY(0px)";
    mappoolContainer.style.transform = "translateY(0px)";
    chatContainer.style.transform = "translateY(0px)";
    selectedMapContainer.style.animation = "unHighlightMap 1s ease-in-out";
    mappoolContainer.style.animation = "raiseMappool 1s ease-in-out";
    chatContainer.style.animation = "lowerChat 1s ease-in-out";
    upcomingText.style.animation = "pickingOut 1s ease-in-out";
    upcomingText.style.opacity = 0;
    setTimeout(function() {
        beatmapImage.style.opacity = 0;
        selectedMap.style.display = `none`;
        mapFrame.style.display = `none`;
        foregroundMap.style.animation = "";
        pickingText.style.display = "initial";
        pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`;
        pickingText.style.animation = `pickingIn 0.75s ease-in-out`;
    }, 700);
})

// CLASS
class Beatmap {
    constructor(pick, beatmapID, layerName, mapData) {
        this.pick = pick;
        this.mods = pick.substring(0,2);
        this.beatmapID = beatmapID;
        this.layerName = layerName;
        this.mapData = mapData;
    }
    generate() {
        let mappoolContainer = document.getElementById(`${this.mods}`);

        this.clicker = document.createElement("div");
        this.clicker.id = `${this.layerName}Clicker`;

        mappoolContainer.appendChild(this.clicker);
        let clickerObj = document.getElementById(this.clicker.id);

        this.bg = document.createElement("div");
        this.map = document.createElement("div");
        this.overlay = document.createElement("div");
        this.metadata = document.createElement("div");
        this.modIcon = document.createElement("div");
        this.pickedStatus = document.createElement("div");

        this.bg.id = this.layerName;
        this.map.id = `${this.layerName}BG`;
        this.overlay.id = `${this.layerName}Overlay`;
        this.metadata.id = `${this.layerName}META`;
        this.modIcon.id = `${this.layerName}ModIcon`;
        this.pickedStatus.id = `${this.layerName}STATUS`;

        this.metadata.setAttribute("class", "mapInfo");
        this.map.setAttribute("class", "map");
        this.pickedStatus.setAttribute("class", "pickingStatus");
        this.overlay.setAttribute("class", "overlay");
        this.modIcon.setAttribute("class", "modIcon");
        this.modIcon.style.backgroundImage = `url("../_shared_assets/mods/${this.mods}.png")`;
        this.clicker.setAttribute("class", "clicker");

        if (this.mods == "TB") {
            this.clicker.setAttribute("class", "clicker tb");
            this.map.setAttribute("class", "map tb");
        }

        clickerObj.appendChild(this.map);
        document.getElementById(this.map.id).appendChild(this.overlay);
        document.getElementById(this.map.id).appendChild(this.metadata);
        clickerObj.appendChild(this.pickedStatus);
        clickerObj.appendChild(this.bg);
        clickerObj.appendChild(this.modIcon);

        this.clicker.style.transform = "translateY(0)";
    }
    grayedOut() {
        this.overlay.style.opacity = '1';
    }
}

class Pick {
    constructor(pick, layerName) {
        this.pick = pick;
        this.layerName = layerName;
    }
    generateLeft() {
        this.clicker = document.createElement("div");
        this.clicker.id = `${this.layerName}Clicker`;

        this.pickName = document.createElement("div");
        this.status = document.createElement("div");

        this.pickName.id = `${this.layerName}PICK`;
        this.status.id = `${this.layerName}STATUS`;

        this.pickName.setAttribute("class", "pickName");
        this.pickName.innerHTML = this.pick;
        this.status.setAttribute("class", "status");
        this.clicker.setAttribute("class", "leftPick");
        paintMod(this.pick,this.clicker)

        this.clicker.appendChild(this.pickName);
        this.clicker.appendChild(this.status);

        this.clicker.style.animation = "translateInLeft 0.5s ease-out"
        
        pickOneContainer.appendChild(this.clicker);
    }
    generateRight() {
        this.clicker = document.createElement("div");
        this.clicker.id = `${this.layerName}Clicker`;

        this.pickName = document.createElement("div");
        this.status = document.createElement("div");

        this.pickName.id = `${this.layerName}PICK`;
        this.status.id = `${this.layerName}STATUS`;

        this.pickName.setAttribute("class", "pickName");
        this.pickName.innerHTML = this.pick;
        this.status.setAttribute("class", "status");
        this.clicker.setAttribute("class", "rightPick");
        paintMod(this.pick,this.clicker)

        this.clicker.appendChild(this.pickName);
        this.clicker.appendChild(this.status);

        this.clicker.style.animation = "translateInRight 0.5s ease-out"
        
        pickTwoContainer.appendChild(this.clicker);
    }
}

// FUNCTIONS ////////////////////////////////////////////////////////////////
async function setupBeatmaps() {
    hasSetup = true;

    const modsCount = {
        NM: 0,
        HD: 0,
        HR: 0,
        DT: 0,
        FM: 0,
        FL: 0,
        TB: 0,
    };

    (function countMods() {
        beatmapSet.map((beatmap) => {
            modsCount[beatmap.pick.substring(0,2)]++;
        });
    })();
    console.log(modsCount);
    beatmapSet.map(async(beatmap, index) => {
        const bm = new Beatmap(beatmap.pick, beatmap.beatmapId, `map${index}`);
        bm.generate();
        bm.clicker.addEventListener("click", function(event) {
            if (event.shiftKey) {
                bm.pickedStatus.style.borderStyle = "hidden";
                bm.pickedStatus.style.color = "rgb(184, 90, 255)";
                bm.pickedStatus.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
                bm.overlay.style.opacity = "0.8";
                bm.bg.style.opacity = "0";
                bm.pickedStatus.innerHTML = `Banned`;
                addBan(bm.pick,true);
                bm.pickedStatus.style.animation = "fadeIn 0.5s ease-in-out"
                setTimeout(function() {
                    bm.pickedStatus.style.opacity = "1";
                }, 500);
            } else if (event.ctrlKey) {
                bm.pickedStatus.innerHTML = "";
                bm.pickedStatus.style.borderStyle = "hidden";
                bm.overlay.style.opacity = "0.5";
                bm.bg.style.opacity = "1";
                bm.pickedStatus.style.backgroundColor = "rgba(0,0,0,0)";
                removePick(`pick${bm.pick}Clicker`);
                cancelPick();
                removeBan(bm.pick,true);
                setTimeout(function() {
                    bm.pickedStatus.style.opacity = "0";
                    bm.pickedStatus.style.animation = ""
                }, 150);
            }  else {
                currentPick = bm.pick;
                if (currentPick.substring(0,2) == "TB") {
                    promptTB(bm.mapData);
                    return;
                } else {
                    paintMatchPick(true);
                    bm.pickedStatus.innerHTML = "";
                    bm.overlay.style.opacity = "0.5";
                    bm.pickedStatus.style.textShadow = "0 0 0 rgba(0,0,0,0)";
                    bm.pickedStatus.style.borderStyle = "solid";
                    bm.pickedStatus.innerHTML = "";
                    bm.pickedStatus.style.animation = "flashPurple 1s ease-out";
                    bm.pickedStatus.style.borderColor = "rgb(184, 90, 255)";
                    adjustSelectedMap(bm.mapData);
                    addLeftPick(bm.mapData);
                    pickingText.style.animation = `pickingOut 0.75s ease-in-out`;
                    setTimeout(function() {
                        bm.pickedStatus.style.opacity = "1";
                    }, 25);
                    setTimeout(function() {
                        pickingText.style.display = `none`;
                        showMap(false);
                    }, 700);
                }
            }
        });
        bm.clicker.addEventListener("contextmenu", function(event) {
            if (event.shiftKey) {
                bm.pickedStatus.style.borderStyle = "hidden";
                bm.pickedStatus.style.color = "rgb(94, 255, 94)";
                bm.pickedStatus.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
                bm.overlay.style.opacity = "0.8";
                bm.bg.style.opacity = "0";
                bm.pickedStatus.style.textShadow = "0 0 10px black";
                bm.pickedStatus.innerHTML = `Banned`;
                addBan(bm.pick,false);
                bm.pickedStatus.style.animation = "fadeIn 0.5s ease-in-out"
                setTimeout(function() {
                    bm.pickedStatus.style.opacity = "1";
                }, 500);
            } else if (event.ctrlKey) {
                bm.pickedStatus.innerHTML = "";
                bm.pickedStatus.style.borderStyle = "hidden";
                bm.overlay.style.opacity = "0.5";
                bm.bg.style.opacity = "1";
                bm.pickedStatus.style.backgroundColor = "rgba(0,0,0,0)";
                removePick(`pick${bm.pick}Clicker`);
                cancelPick();
                removeBan(bm.pick,false);
                setTimeout(function() {
                    bm.pickedStatus.style.opacity = "0";
                    bm.pickedStatus.style.animation = ""
                }, 150);
            } else {
                currentPick = bm.pick;
                if (currentPick.substring(0,2) == "TB") {
                    promptTB(bm.mapData);
                } else {
                    paintMatchPick(false);
                    bm.pickedStatus.innerHTML = "";
                    bm.overlay.style.opacity = "0.5";
                    bm.pickedStatus.style.textShadow = "0 0 0 rgba(0,0,0,0)";
                    bm.pickedStatus.style.borderStyle = "solid";
                    bm.pickedStatus.style.animation = "flashGreen 1s ease-out";
                    bm.pickedStatus.style.borderColor = "rgb(94, 255, 94)";
                    adjustSelectedMap(bm.mapData);
                    addRightPick(bm.mapData);
                    pickingText.style.animation = `pickingOut 0.75s ease-in-out`;
                    setTimeout(function() {
                        bm.pickedStatus.style.opacity = "1";
                    }, 25);
                    setTimeout(function() {
                        pickingText.style.display = `none`;
                        showMap(false);
                    }, 700);
                }
            }
        });
        const mapData = await getDataSet(beatmap.beatmapId);
        bm.mapData = mapData;
        bm.map.style.backgroundImage = `url('https://assets.ppy.sh/beatmaps/${mapData.beatmapset_id}/covers/cover.jpg')`;
        bm.metadata.innerHTML = mapData.title;
        beatmapData.add(bm);
    });
}

async function paintMod(modText, element) {
    if (modText != null) {
        switch (modText.substring(0,2)) {
            case "NM":
                element.style.backgroundColor = "rgb(147, 165, 202)";
                break;
            case "HD":
                element.style.backgroundColor = "rgb(202, 194, 147)";
                break;
            case "HR":
                element.style.backgroundColor = "rgb(202, 147, 147)";
                break;
            case "DT":
                element.style.backgroundColor = "rgb(185, 147, 202)";
                break;
            case "FM":
                element.style.backgroundColor = "rgb(147, 202, 147)";
                break;
            case "FL":
                element.style.backgroundColor = "rgb(201, 201, 201)";
                break;
            default:
                break;
        }
    } else {
        element.style.backgroundColor = "grey";
    }
}

async function removePick(string) {
    let clicker = document.getElementById(string);
    clicker.style.animation = "translateOut 0.25s ease-in"
    setTimeout(function() {
        clicker.remove();
    }, 250);
}

async function addLeftPick(data) {
    let id = parseInt(data.beatmap_id);
    let tempPick = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["pick"];
    let pick = new Pick(tempPick, `pick${tempPick}`)
    pick.generateLeft();

    pick.clicker.addEventListener("click", function(event) {
            if (event.ctrlKey) {
                pick.status.innerHTML = ""
            }  else {
                pick.status.innerHTML = "W"
                pick.status.style.color = "green"
            }
        });
    pick.clicker.addEventListener("contextmenu", function(event) {
        if (event.ctrlKey) {
            pick.status.innerHTML = ""
        }  else {
            pick.status.innerHTML = "L"
            pick.status.style.color = "red"
        }
    });
}

async function addRightPick(data) {
    let id = parseInt(data.beatmap_id);
    let tempPick = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["pick"];
    let pick = new Pick(tempPick, `pick${tempPick}`)
    pick.generateRight();

    pick.clicker.addEventListener("click", function(event) {
            if (event.ctrlKey) {
                pick.status.innerHTML = ""
            }  else {
                pick.status.innerHTML = "W"
                pick.status.style.color = "green"
            }
        });
    pick.clicker.addEventListener("contextmenu", function(event) {
        if (event.ctrlKey) {
            pick.status.innerHTML = ""
        }  else {
            pick.status.innerHTML = "L"
            pick.status.style.color = "red"
        }
    });
}

async function adjustSelectedMap(data) {
    let id = parseInt(data.beatmap_id);
    let memoryOD = data.diff_overall;
    let fullSR = data.difficultyrating;
    let BPM = parseInt(data.bpm);
	let full = data.total_length;
    let difficulty = data.version;
    let mapperName = data.creator;
    let artist = data.artist;
    let title = data.title;
    let bg = `url('https://assets.ppy.sh/beatmaps/${data.beatmapset_id}/covers/cover.jpg')`;
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
            full = parseInt(full/1.5);
            BPM = parseInt(BPM*1.5);
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        }
    }
    
    pickID.innerHTML = pick == null ? "XX1" : pick;
    // paintMod(pick)

    song.innerHTML = title;
    beatmapImage.style.backgroundImage = bg;
    mapper.innerHTML = customMapper != "" ? `Mapped by ${customMapper}`:`Mapset by ${mapperName}`;
    mapOD.innerHTML = `OD ${memoryOD}`;
    mapSR.innerHTML = `SR ${parseFloat(fullSR).toFixed(2)}*`;
    mapBPM.innerHTML = `BPM ${BPM}`;
    mapLength.innerHTML = `Length ${await formatTime(full)}`;
}

async function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    // Add leading zero if necessary
    minutes = String(minutes).padStart(2, '0');
    remainingSeconds = String(remainingSeconds).padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
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

async function getDataSet(beatmapID) {
    try {
        const data = (
            await axios.get("/get_beatmaps", {
                baseURL: "https://osu.ppy.sh/api",
                params: {
                    k: api,
                    b: beatmapID,
                },
            })
        )["data"];
        return data.length !== 0 ? data[0] : null;
    } catch (error) {
        console.error(error);
    }
};

function showMap(tb) {
    picking = false;
    if (mapFrame.style.display != "flex") {
        selectedMap.innerHTML = tb == false ? `SELECTED MAP - ${currentPlayer}` : "FINAL MAP";
        selectedMap.style.transform = "translateY(100px) scale(2)";
        selectedMap.style.display = "initial";
        selectedMap.style.animation = "pickingInSelected 0.5s ease-out";
        setTimeout(function() {
            selectedMap.style.animation = "pickingUp 0.75s ease-in-out";
            selectedMap.style.transform = "translateY(0) scale(1)";
        },1000);
    }
    setTimeout(function() {
        mapFrame.style.display = "flex";
        mapFrame.style.animation = "pickingIn 0.75s ease-in-out";
        beatmapOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
        beatmapImage.style.opacity = 1;
    }, 1000);
    setTimeout(function() {
        if (!picking) {
            selectedMapContainer.style.transform = "translateY(360px)";
            mappoolContainer.style.transform = "translateY(720px)";
            chatContainer.style.transform = "translateY(-380px)";
            selectedMapContainer.style.animation = "highlightMap 1s ease-in-out";
            mappoolContainer.style.animation = "lowerMappool 1s ease-in-out";
            chatContainer.style.animation = "raiseChat 1s ease-in-out";
            upcomingText.style.animation = "pickingIn 1s ease-in-out";
            upcomingText.style.opacity = 1;
        }
    }, 5000);
}

function updateElipsis() {
    let temporaryString = ".";
    setInterval(function () {
        pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}${temporaryString}`
        if (temporaryString.length == 3) {
            temporaryString = "";
        } else {
            temporaryString += ".";
        }
    },1000);
}

function cancelPick() {
    picking = true;
    foregroundMap.style.animation = "pickingOut 0.75s ease-in-out";
    selectedMapContainer.style.transform = "translateY(0px)";
    mappoolContainer.style.transform = "translateY(0px)";
    chatContainer.style.transform = "translateY(0px)";
    selectedMapContainer.style.animation = "unHighlightMap 1s ease-in-out";
    mappoolContainer.style.animation = "raiseMappool 1s ease-in-out";
    chatContainer.style.animation = "lowerChat 1s ease-in-out";
    upcomingText.style.animation = "pickingOut 1s ease-in-out";
    upcomingText.style.opacity = 0;
    beatmapImage.style.opacity = 0;
    setTimeout(function() {
        selectedMap.style.display = `none`;
        mapFrame.style.display = `none`;
        foregroundMap.style.animation = "";
        pickingText.style.display = "initial";
        pickingText.innerHTML = `${currentPlayer} is currently picking`;
        pickingText.style.animation = `pickingIn 0.75s ease-in-out`;
    }, 750);
}

function addBan(pick,left) {
    if (left) {
        banOneContainer.innerHTML = pick;
        banOneContainer.style.animation = "translateInLeft 0.5s ease-out";
        banOneContainer.style.opacity = 1;
    } else {
        banTwoContainer.innerHTML = pick;
        banTwoContainer.style.animation = "translateInRight 0.5s ease-out";
        banTwoContainer.style.opacity = 1;
    }
    banCount++;
    if (currentPlayer == tempRight) {
        currentPlayer = tempLeft;
        turn = 0;
        pickOne.style.opacity = 1;
        pickTwo.style.opacity = 0;
        overlay.style.backgroundColor = "rgba(86, 38, 122, 0.5)";
    } else {
        currentPlayer = tempRight;
        turn = 1;
        pickOne.style.opacity = 0;
        pickTwo.style.opacity = 1;
        overlay.style.backgroundColor = "rgba(25, 103, 25, 0.5)";
    }
    if (banCount >= 2) {
        currentPhase = "picking";
    } else {
        currentPhase = "banning";
    }
    pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
}

function removeBan(pick,left) {
    if (left && banOneContainer.innerHTML == pick) {
        banOneContainer.style.animation = "translateOut 0.25s ease-in";
        banOneContainer.style.opacity = 0;
        banCount--;
        if (banCount >= 2) {
            currentPhase = "picking";
        } else {
            currentPhase = "banning";
        }
        pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
    } else if (banTwoContainer.innerHTML == pick){
        banTwoContainer.style.animation = "translateOut 0.25s ease-in";
        banTwoContainer.style.opacity = 0;
        banCount--;
        if (banCount >= 2) {
            currentPhase = "picking";
        } else {
            currentPhase = "banning";
        }
        pickingText.innerHTML = `${currentPlayer} is currently ${currentPhase}`
    }
}

function markWin(string,win) {
    let clicker = document.getElementById(string);
    if (turn == 0) {
        if (win) {
            console.log("left pick win");
            clicker.click();
        } else {
            console.log("left pick lose");
            clicker.dispatchEvent(rightClick);
        }
    } else if (turn == 1) {
        if (!win) {
            console.log("right pick win");
            clicker.click();
        } else {
            console.log("right pick lose");
            clicker.dispatchEvent(rightClick);
        }
    }
}

var rightClick = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2, // Indicates a right-click
    buttons: 2 // Indicates the right mouse button is pressed
});

function paintMatchPick(left) {
    if (left) {
        leftPickMatch.style.color = "white";
        leftPickMatch.style.background = "#b152d8";
        rightPickMatch.style.color = "rgb(150,150,150)";
        rightPickMatch.style.background = "#212121";
    } else {
        rightPickMatch.style.color = "white";
        rightPickMatch.style.background = "#56c51b";
        leftPickMatch.style.color = "rgb(150,150,150)";
        leftPickMatch.style.background = "#212121";
    }
}

function updateChat(data) {
    if (chatLen == 0 || (chatLen > 0 && chatLen > data.tourney.manager.chat.length)) {
        // Starts from bottom
        chats.innerHTML = "";
        chatLen = 0;
    }

    // Add the chats
    for (var i = chatLen; i < data.tourney.manager.chat.length; i++) {
        tempClass = data.tourney.manager.chat[i].team;

        // Chat variables
        let chatParent = document.createElement('div');
        chatParent.setAttribute('class', 'chat');

        let chatTime = document.createElement('div');
        chatTime.setAttribute('class', 'chatTime');

        let chatName = document.createElement('div');
        chatName.setAttribute('class', 'chatName');

        let chatText = document.createElement('div');
        chatText.setAttribute('class', 'chatText');

        chatTime.innerText = data.tourney.manager.chat[i].time;
        chatName.innerText = data.tourney.manager.chat[i].name + ":\xa0";
        chatText.innerText = data.tourney.manager.chat[i].messageBody;

        chatName.classList.add(tempClass);

        chatParent.append(chatTime);
        chatParent.append(chatName);
        chatParent.append(chatText);
        chats.append(chatParent);
    }

    // Update the Length of chat
    chatLen = data.tourney.manager.chat.length;

    // Update the scroll so it's sticks at the bottom by default
    chats.scrollTop = chats.scrollHeight;
}

function promptTB(mapData) {
    adjustSelectedMap(mapData);
    pickingText.style.animation = `pickingOut 0.75s ease-in-out`;
    beatmapOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    pickOne.style.opacity = 0;
    pickTwo.style.opacity = 0;
    rightPickMatch.style.color = "rgb(150,150,150)";
    rightPickMatch.style.background = "#212121";
    leftPickMatch.style.color = "rgb(150,150,150)";
    leftPickMatch.style.background = "#212121";
    setTimeout(function() {
        pickingText.style.display = `none`;
        showMap(true);
    }, 700);
}

async function adjustFont(title, boundaryWidth, originalFontSize) {
    if (title.scrollWidth > boundaryWidth) {
		let ratio = (title.scrollWidth/boundaryWidth);
        title.style.fontSize = `${originalFontSize/ratio}px`;
    } else {
		title.style.fontSize = `${originalFontSize}px`;
	}
}