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

// SEED DATA /////////////////////////////////////////////////////////////////
let seeds = [];
let schedules = [];
(async () => {
    try {
        const seedData = await $.getJSON("../_data/prism_seed.json");
        seedData.map((seed) => {
            seeds.push(seed);
        });
        const scheduleData = await $.getJSON("../_data/schedule.json");
        scheduleData.map((schedule) => {
            schedules.push(schedule);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();
console.log(schedules);

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
let playerOnePic = document.getElementById("playerOnePic");
let playerOne = document.getElementById("playerOneName");
let playerOneSeed = document.getElementById("playerOneSeed");
let playerOneRank = document.getElementById("playerOneRank");
let oneFlag = document.getElementById("oneFlag");
let oneFlagAcronym = document.getElementById("oneFlagAcronym");

let playerTwoPic = document.getElementById("playerTwoPic");
let playerTwo = document.getElementById("playerTwoName");
let playerTwoSeed = document.getElementById("playerTwoSeed");
let playerTwoRank = document.getElementById("playerTwoRank");
let twoFlag = document.getElementById("twoFlag");
let twoFlagAcronym = document.getElementById("twoFlagAcronym");

let playerOneMatch = document.getElementById("playerOneMatch");
let playerTwoMatch = document.getElementById("playerTwoMatch");

// PLACEHOLDER VARS //////////////////////////////////////////////
let tempLeft;
let tempRight;

// MAIN LOOP ////////////////////////////////////////////////////////////////
socket.onmessage = async event => {
    let data = JSON.parse(event.data);

    if (tempLeft != data.tourney.manager.teamName.left || tempRight != data.tourney.manager.teamName.right) {
        tempLeft = data.tourney.manager.teamName.left;
        tempRight = data.tourney.manager.teamName.right;
    }

    if (tempLeft != playerOne.innerHTML || tempRight != playerTwo.innerHTML) {
        playerOneMatch.textContent = '';
        playerTwoMatch.textContent = '';
        playerOne.innerHTML = tempLeft;
        adjustFont(playerOne, 402.5,72);
        playerTwo.innerHTML = tempRight;
        adjustFont(playerTwo, 402.5,72);
        await setPlayerDetails(playerOnePic, playerOneSeed, playerOneRank, oneFlag, oneFlagAcronym, tempLeft);
        await setPlayerDetails(playerTwoPic, playerTwoSeed, playerTwoRank, twoFlag, twoFlagAcronym, tempRight);
    }
}

// FUNCTIONS ////////////////////////////////////////////////////////////////

async function setPlayerDetails(element, seed, rank, flag, flagText, username) {
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
        flagText.innerHTML = data.country;
        flag.setAttribute('src',`https://assets.ppy.sh/old-flags/${data.country}.png`);
        await setMatchHistory(data.user_id, username);
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

async function setMatchHistory(user_id, user_name) {
    let matchContainer;

    if (playerOne.innerHTML === user_name) {
        matchContainer = playerOneMatch;
    } else if (playerTwo.innerHTML === user_name) {
        matchContainer = playerTwoMatch;
    } else {
        return false;
    }
    
    matches = getPlayerMatch(user_id);

    for (let i = 0; i<matches.length; i++) {
        match = matches[i];
        if (match["playerOneID"] == user_id) {
            console.log("happened1");
            opponentData = await getUserDataSet(match["playerTwoID"]);
            matchFrame = new Match(match["Match ID"],match["resultOne"],match["resultTwo"],true,opponentData);
            matchFrame.generate(matchContainer);
        } else {
            console.log("happened2");
            opponentData = await getUserDataSet(match["playerOneID"]);
            matchFrame = new Match(match["Match ID"],match["resultOne"],match["resultTwo"],false,opponentData);
            matchFrame.generate(matchContainer);
        }
    }
}

function getPlayerMatch(user_id) {
    matches = schedules
        .filter(schedule => schedule["playerOneID"] == user_id || schedule["playerTwoID"] == user_id)
        // .map(schedule => schedule["Match ID"]);
    console.log(matches);
    return matches;
}

function getStageText(match_id) {
    const stages = [
        { max: 33, text: "RO64" },
        { max: 65, text: "RO32" },
        { max: 97, text: "RO16" },
        { max: 113, text: "QF" },
        { max: 121, text: "SF" },
        { max: 125, text: "F" },
        { max: Infinity, text: "GF" }
    ];

    for (let stage of stages) {
        if (match_id < stage.max) {
            return stage.text;
        }
    }

    return "XX";
}

async function adjustFont(title, boundaryWidth, originalFontSize) {
    if (title.scrollWidth > boundaryWidth) {
		let ratio = (title.scrollWidth/boundaryWidth);
        title.style.fontSize = `${originalFontSize/ratio}px`;
    } else {
		title.style.fontSize = `${originalFontSize}px`;
	}
}

class Match {
    constructor(matchID,scoreOne,scoreTwo,isPlayerOne, opponentData) {
        this.matchID = matchID;
        this.scoreOne = scoreOne;
        this.scoreTwo = scoreTwo;
        this.isPlayerOne = isPlayerOne;
        this.opponentPlayerData = opponentData;
        console.log(this.scoreOne);
        console.log(this.scoreTwo);
    }

    generate(matchContainer) {
        this.container = document.createElement("div");
        this.container.classList.add("matchContainer");
        this.container.id = `matchID${this.matchID}`;
        
        this.matchText = document.createElement("div");
        this.matchText.classList.add("matchText");
        this.matchText.innerHTML = `${getStageText(this.matchID)} - VS ${this.opponentPlayerData.username}`;

        this.oppPic = document.createElement("img");
        this.oppPic.classList.add("oppPic");
        this.oppPic.setAttribute("src",`http://s.ppy.sh/a/${this.opponentPlayerData.user_id}`)

        this.result = document.createElement("div");
        if (this.isPlayerOne) {
            console.log("happened3");
            this.result.classList.add(this.scoreOne > this.scoreTwo ? "resultTextWin" : "resultTextLose");
            this.result.innerHTML = this.scoreOne > this.scoreTwo ? 
                `WIN ${this.scoreOne}-${this.scoreTwo}` : `LOSE ${this.scoreOne}-${this.scoreTwo}`;
        } else {
            console.log("happened4");
            this.result.classList.add(this.scoreOne < this.scoreTwo ? "resultTextWin" : "resultTextLose");
            this.result.innerHTML = this.scoreOne < this.scoreTwo ? 
                `WIN ${this.scoreOne}-${this.scoreTwo}` : `LOSE ${this.scoreOne}-${this.scoreTwo}`;
        }

        this.container.appendChild(this.matchText);
        this.container.appendChild(this.oppPic);
        this.container.appendChild(this.result);

        matchContainer.appendChild(this.container);
    }
}

