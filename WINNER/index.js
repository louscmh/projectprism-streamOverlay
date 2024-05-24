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

let playerTwoPic = document.getElementById("playerTwoPic");
let playerTwo = document.getElementById("playerTwoName");

let playerOneColumn = document.getElementById("playerOne");
let playerTwoColumn = document.getElementById("playerTwo");

let pointOne = document.getElementById("pointOne");
let pointTwo = document.getElementById("pointTwo");

let finalText = document.getElementById("finalText");
let winnerText = document.getElementById("winnerText");

let versusAsset = document.getElementById("versusAsset");

let button = document.getElementById("button");

// PLACEHOLDER VARS //////////////////////////////////////////////
let tempLeft;
let tempRight;
let leftScore;
let rightScore;
let leftWin;
let hasPressed = false;
let scoreUpdated = false;

// MAIN LOOP ////////////////////////////////////////////////////////////////
socket.onmessage = async event => {
    let data = JSON.parse(event.data);

    if (tempLeft != data.tourney.manager.teamName.left || tempRight != data.tourney.manager.teamName.right) {
        tempLeft = data.tourney.manager.teamName.left;
        tempRight = data.tourney.manager.teamName.right;
    }

    if (tempLeft != playerOne.innerHTML) {
        setPlayerDetails(playerOne, playerOnePic, tempLeft);
    }
    if (tempRight != playerTwo.innerHTML) {
        setPlayerDetails(playerTwo, playerTwoPic, tempRight);
    }

    leftScore = data.tourney.manager.stars.left;
    rightScore = data.tourney.manager.stars.right;

    if (pointOne.innerHTML != leftScore || pointTwo.innerHTML != rightScore) {
        pointOne.innerHTML = leftScore;
        pointTwo.innerHTML = rightScore;
        if (pointOne.innerHTML == Math.ceil(data.tourney.manager.bestOF / 2)) {
            leftWin = true;
            pointTwo.style.transform = "scale(0.8)";
            pointTwo.style.color = "#b2b2b2";
            pointOne.style.transform = "scale(1)";
            pointOne.style.color = "white";
            playerOneColumn.style.transform = "translateX(615px)";
            playerTwoColumn.style.transform = "translateX(-615px)";
            playerTwoColumn.style.opacity = 0;
            finalPoint.style.transform = "translateY(800px)";
            finalText.style.opacity = 0;
            winnerText.style.opacity = 1;
            versusAsset.style.transform = "translateY(800px)";
            finalPoint.style.opacity = 0;
            versusAsset.style.opacity = 0;
            button.style.display = "";
        } else if (pointTwo.innerHTML == Math.ceil(data.tourney.manager.bestOF / 2)) {
            leftWin = false;
            pointOne.style.transform = "scale(0.8)";
            pointOne.style.color = "#b2b2b2";
            pointTwo.style.transform = "scale(1)";
            pointTwo.style.color = "white";
            playerOneColumn.style.transform = "translateX(615px)";
            playerTwoColumn.style.transform = "translateX(-615px)";
            playerOneColumn.style.opacity = 0;
            finalPoint.style.transform = "translateY(800px)";
            finalText.style.opacity = 0;
            winnerText.style.opacity = 1;
            versusAsset.style.transform = "translateY(800px)";
            finalPoint.style.opacity = 0;
            versusAsset.style.opacity = 0;
            button.style.display = "";
        } else {
            pointOne.style.transform = "scale(1)";
            pointOne.style.color = "white";
            pointTwo.style.transform = "scale(1)";
            pointTwo.style.color = "white";
            playerOneColumn.style.transform = "translateX(0)";
            playerTwoColumn.style.transform = "translateX(-0)";
            finalPoint.style.transform = "translateY(0)";
            playerOneColumn.style.opacity = 1;
            playerTwoColumn.style.opacity = 1;
            finalText.style.opacity = 1;
            winnerText.style.opacity = 0;
            versusAsset.style.transform = "translateY(0)";
            finalPoint.style.opacity = 1;
            versusAsset.style.opacity = 1;
            button.style.display = "none";
        }
    }
}

button.addEventListener("click", function(event) {
    if (hasPressed) {
        hasPressed=false;
        button.style.backgroundColor = "purple";
        button.innerHTML = "ACTIVATE FINAL SCORE";
        finalText.style.animation = "textOut 1s ease-in-out"
        finalText.style.opacity = 0;
        winnerText.style.animation = "textIn 1s ease-in-out"
        winnerText.style.opacity = 1;
        playerOneColumn.style.transform = "translateX(615px)";
        playerTwoColumn.style.transform = "translateX(-615px)";
        playerOneColumn.style.opacity = leftWin ? 1 : 0;
        playerTwoColumn.style.opacity = leftWin ? 0 : 1;
        finalPoint.style.transform = "translateY(800px)";
        versusAsset.style.transform = "translateY(800px)";
        finalPoint.style.opacity = 0;
        versusAsset.style.opacity = 0;
    } else {
        hasPressed=true;
        button.style.backgroundColor = "green";
        button.innerHTML = "RETURN TO WINNER";
        winnerText.style.animation = "textOut 1s ease-in-out"
        winnerText.style.opacity = 0;
        finalText.style.animation = "textIn 1s ease-in-out"
        finalText.style.opacity = 1;
        playerOneColumn.style.transform = "translateX(0)";
        playerTwoColumn.style.transform = "translateX(-0)";
        playerOneColumn.style.opacity = 1;
        playerTwoColumn.style.opacity = 1;
        versusAsset.style.transform = "translateY(0)";
        finalPoint.style.transform = "translateY(0)";
        finalPoint.style.opacity = 1;
        versusAsset.style.opacity = 1;
    }
})

// FUNCTIONS ////////////////////////////////////////////////////////////////

async function setPlayerDetails(name, element, username) {
    if (username === "") {
        return false;
    }

    name.innerHTML = username;

    const data = await getUserDataSet(username);
    if (data !== null) {
        source = `http://s.ppy.sh/a/${data.user_id}`
        element.setAttribute('src',source);
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