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
(async () => {
    try {
        const seedData = await $.getJSON("../_data/prism_seed.json");
        seedData.map((seed) => {
            seeds.push(seed);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();

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

    if (tempLeft != playerOne.innerHTML) {
        setPlayerDetails(playerOne, playerOnePic, playerOneSeed, playerOneRank, oneFlag, oneFlagAcronym, tempLeft);
    }
    if (tempRight != playerTwo.innerHTML) {
        setPlayerDetails(playerTwo, playerTwoPic, playerTwoSeed, playerTwoRank, twoFlag, twoFlagAcronym, tempRight);
    }
}

// FUNCTIONS ////////////////////////////////////////////////////////////////

async function setPlayerDetails(name, element, seed, rank, flag, flagText, username) {
    if (username === "") {
        return false;
    }

    name.innerHTML = username;

    const data = await getUserDataSet(username);
    if (data !== null) {
        source = `http://s.ppy.sh/a/${data.user_id}`
        element.setAttribute('src',source);
        playerSeed = seeds.find(seed => seed["playerID"] == data.user_id)["Seed"];
        seed.innerHTML = `SEED ${playerSeed}`;
        rank.innerHTML = `RANK #${data.pp_rank}`;
        flagText.innerHTML = data.country;
        flag.setAttribute('src',`https://assets.ppy.sh/old-flags/${data.country}.png`);
        setMatchHistory(data.user_id, username);
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
        atchContainer = playerTwoMatch;
    } else {
        return false;
    }

    
}