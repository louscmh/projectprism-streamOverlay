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

// SEED & SCHEDULE DATA /////////////////////////////////////////////////////////////////
let seeds = [];
let schedules = [];
let convertedSchedules = [];
let sortedSchedules = [];
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
        schedules.map((schedule) => {
            if (schedule["Time"] != "") {
                convertedSchedules.push([schedule["Match ID"],schedule["Time"]]);
            }
        });
        sortedSchedules = sortArrayByDate(convertedSchedules);
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();
console.log(schedules);
console.log(convertedSchedules);
console.log(sortedSchedules);

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
let currentTime = document.getElementById('currentTime');
let nextTime = document.getElementById('nextTime');
let matchBar = document.getElementById('matchBar');
let songName = document.getElementById('songName');

// PLACEHOLDER VARS //////////////////////////////////////////////
let nextMatch;
let matchLineup;
let matchToDisplay;

// MAIN LOOP //////////////////////////////////////////////
setInterval(displayTime, 1000);
setInterval(updateMatches, 1000);

socket.onmessage = async event => {
    let data = JSON.parse(event.data);
    songName.innerHTML = data.menu.bm.metadata.title;
}

// FUNCTIONS /////////////////////////////////////////////////////////////////

async function updateMatchBar() {
    matchBar.textContent = '';
    for (let match of matchLineup) {
        matchData = schedules.find(schedule => schedule["Match ID"] == match[0]);
        playerOneData = await getUserDataSet(matchData["playerOneID"]);
        playerTwoData = await getUserDataSet(matchData["playerTwoID"]);
        matchFrame = new Match(match, playerOneData, playerTwoData);
        matchFrame.generate(matchBar);
    }
}

async function updateMatches() {
    if (sortedSchedules.length > 0) {
        if (nextMatch == null) {
            nextMatch = checkNextMatch(sortedSchedules);
            matchToDisplay = nextMatch;
            matchLineup = getNextMatch(sortedSchedules);
            updateMatchBar();
        } else if (nextMatch != checkNextMatch(sortedSchedules)) {
            nextMatch = checkNextMatch(sortedSchedules);
            setTimeout(function () {
                matchToDisplay = nextMatch;
                matchLineup = getNextMatch(sortedSchedules);
                updateMatchBar();
            },300000);
        }
        displayCountdown();
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

async function displayCountdown() {
    var time = new Date();
    var timeDifference = parseDateTime(matchToDisplay[1]) - time;

    // console.log(timeDifference);

    if (timeDifference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 }; // Target date is in the past or now
    }

    var hours = Math.floor(timeDifference / (1000 * 60 * 60));
    var minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    var hoursString = hours < 10 ? "0" + hours : hours;
    var minutesString = minutes < 10 ? "0" + minutes : minutes;
    var secondsString = seconds < 10 ? "0" + seconds : seconds;

    nextTime.innerHTML = hours > 24 ? "24:00:00" : `${hoursString}:${minutesString}:${secondsString}`;
    // nextTime.innerHTML = `${minutes}:${seconds}`;
}

async function displayTime() {
    var time = new Date();
    var hours = time.getUTCHours();
    var minutes = time.getUTCMinutes();

    var hoursString = hours < 10 ? "0" + hours : hours;
    var minutesString = minutes < 10 ? "0" + minutes : minutes;

    var timeString = hoursString + ":" + minutesString;
    currentTime.innerHTML = timeString;
}
  
function parseDateTime(dateTimeString) {
    // console.log(dateTimeString);
    if (dateTimeString == "") return null;

    var [datePart, timePart] = dateTimeString.split(' ');
    var [day, month] = datePart.split('/').map(Number);
    var [hours, minutes] = timePart.split(':').map(Number);

    var date = new Date();
    var currentYear = date.getFullYear();

    date.setUTCFullYear(currentYear);
    date.setUTCMonth(month - 1);
    date.setUTCDate(day);
    date.setUTCHours(hours);
    date.setUTCMinutes(minutes);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);

    return date;
}

function sortArrayByDate(arr) {
    return arr.sort((a, b) => {
        var dateA = parseDateTime(a[1]);
        var dateB = parseDateTime(b[1]);
        return dateA - dateB;
    });
}

function checkNextMatch(sorted) {
    var time = new Date();
    for (let match of sorted) {
        if (parseDateTime(match[1]) > time) {
            return match;
        }
    }
}

function getNextMatch(sorted) {
    var time = new Date();
    let foundNext = false;
    let counter = 0;
    let matches = []
    for (let match of sorted) {
        if (parseDateTime(match[1]) > time && !foundNext) {
            foundNext = true;
            matches.push(match);
            counter++;
        } else if (foundNext && counter < 4) {
            matches.push(match);
            counter++;
        } else if (foundNext && counter >= 4) {
            return matches;
        }
    }
    return matches;
}

function checkWin(userid) {
    temp = schedules.find(schedule => schedule["playerOneID"] == userid && schedule["resultOne"] < schedule["resultTwo"]);
    tempTwo = schedules.find(schedule => schedule["playerTwoID"] == userid && schedule["resultOne"] > schedule["resultTwo"]);
    // console.log(temp);
    // console.log(tempTwo);
    return temp == null && tempTwo == null;
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
    constructor(match, playerOneData, playerTwoData) {
        this.match = match;
        this.playerOneData = playerOneData;
        this.playerTwoData = playerTwoData;
        this.isWinners = checkWin(playerOneData.user_id);
    }

    generate(matchBar) {
        this.container = document.createElement("div");
        this.container.classList.add("matchContainer");
        this.container.id = `match${this.match[0]}`;

        this.matchTime = document.createElement("div");
        this.matchTime.classList.add("matchTime");

        this.timeText = document.createElement("div");
        this.timeText.classList.add("timeText");
        this.timeText.innerHTML = `${this.match[1].split(' ')[1]} - ${this.isWinners ? "WINNERS BRACKET" : "LOSERS BRACKET"}`

        this.bracket = document.createElement("bracket");
        this.bracket.classList.add("bracket");

        this.matchDetails = document.createElement("div");
        this.matchDetails.classList.add("matchDetails");

        this.playerOne = document.createElement("div");
        this.playerOne.classList.add("playerOne");

        this.picOne = document.createElement("img");
        this.picOne.classList.add("picOne");
        this.picOne.setAttribute("src",`http://s.ppy.sh/a/${this.playerOneData.user_id}`)

        this.playerNameOne = document.createElement("div");
        this.playerNameOne.classList.add("playerNameOne");
        this.playerOneText = document.createElement("div");
        this.playerOneText.classList.add("playerText");
        this.playerOneText.innerHTML = this.playerOneData.username;
        this.playerNameOne.appendChild(this.playerOneText);

        this.playerTwo = document.createElement("div");
        this.playerTwo.classList.add("playerTwo");

        this.picTwo = document.createElement("img");
        this.picTwo.classList.add("picTwo");
        this.picTwo.setAttribute("src",`http://s.ppy.sh/a/${this.playerTwoData.user_id}`)

        this.playerNameTwo = document.createElement("div");
        this.playerNameTwo.classList.add("playerNameTwo");
        this.playerTwoText = document.createElement("div");
        this.playerTwoText.classList.add("playerText");
        this.playerTwoText.innerHTML = this.playerTwoData.username;
        this.playerNameTwo.appendChild(this.playerTwoText);

        this.versus = document.createElement("versus");
        this.versus.classList.add("versus");
        this.versus.innerHTML = "VS";

        this.matchTime.appendChild(this.timeText);
        this.matchTime.appendChild(this.bracket);

        this.playerOne.appendChild(this.picOne);
        this.playerOne.appendChild(this.playerNameOne);

        this.playerTwo.appendChild(this.picTwo);
        this.playerTwo.appendChild(this.playerNameTwo);

        this.matchDetails.appendChild(this.playerOne);
        this.matchDetails.appendChild(this.versus);
        this.matchDetails.appendChild(this.playerTwo);

        this.container.appendChild(this.matchTime);
        this.container.appendChild(this.matchDetails);

        matchBar.appendChild(this.container);
        adjustFont(this.playerOneText, 280, 46);
        adjustFont(this.playerTwoText, 280, 46);
    }
}