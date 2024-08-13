let SURFACE = null;
let NUMBER_LABEL = null;
let NUMBER_BUTTON = null;
let MODE_BUTTON = null;
let MODE_LABEL = null;

const COLORS = [
    "#FF0000",
    "#FF8700",
    "#FFD300",
    "#DEFF0A",
    "#A1FF0A",
    "#0AFF99",
    "#0AEFFF",
    "#147DF5",
    "#580AFF",
    "#BE0AFF",
];
const USED_COLOR = [false, false, false, false, false, false, false, false, false, false];
const COUNDOWN_MAX = 3000;
const COUNDOWN_STEP = 100;
let COUNTDOWN_MS = COUNDOWN_MAX;
let FINISHED = false;


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function pickColorIndex() {
    let index = null;
    do {
        index = Math.floor(Math.random() * COLORS.length);
    } while (USED_COLOR[index]);
    USED_COLOR[index] = true;
    return index;
}

function newCircle(touch) {
    const circleContainer = document.createElement("div");
    circleContainer.classList.add("circle");
    circleContainer.id = `circle-${touch.identifier}`;
    circleContainer.style.left = `${touch.clientX}px`;
    circleContainer.style.top = `${touch.clientY}px`;
    const colorIndex = pickColorIndex();
    circleContainer.classList.add(`color-index-${colorIndex}`);
    circleContainer.style.backgroundColor = COLORS[colorIndex];
    circleContainer.style.borderColor = COLORS[colorIndex];

    const circleInner = document.createElement("div");
    circleInner.classList.add("decoration", "circle-inner");

    const border = document.createElement("div");
    border.classList.add("decoration", "border");

    circleContainer.appendChild(circleInner);
    circleContainer.appendChild(border);
    return circleContainer;
}

function onTouchAdd(event) {
    event.preventDefault();
    NUMBER_BUTTON.checked = false;
    if (event.touches.length > 10) {
        return;
    }
    if (FINISHED) {
        FINISHED = false;
        USED_COLOR.fill(false);
        Array.from(document.getElementsByClassName("circle")).forEach(c => c.remove());
    }
    for (const touch of event.changedTouches) {
        const c = newCircle(touch);
        SURFACE.appendChild(c);
    }
    if (event.touches.length >= 2) {
        COUNTDOWN_MS = COUNDOWN_MAX;
    }
}

function onTouchMove(event) {
    event.preventDefault();
    NUMBER_BUTTON.checked = false;
    if (FINISHED) {
        return;
    }
    for (const touch of event.changedTouches) {
        const circle = document.getElementById(`circle-${touch.identifier}`);
        if (circle !== null && circle !== undefined) {
            circle.style.left = `${touch.clientX}px`;
            circle.style.top = `${touch.clientY}px`;
        }
    }
}

function onTouchEnd(event) {
    NUMBER_BUTTON.checked = false;
    if (FINISHED) {
        return;
    }
    const active = Array.from(event.touches).map(t => t.identifier);
    for (const touch of event.changedTouches) {
        const circle = document.getElementById(`circle-${touch.identifier}`);
        if (active.includes(touch.identifier)) {
            continue;
        }
        if (circle !== null && circle !== undefined) {
            const colorIndex = circle.className.match(/color-index-(\d+)/)[1];
            USED_COLOR[colorIndex] = false;
            circle.remove();
        }
    }
    COUNTDOWN_MS = COUNDOWN_MAX;
}

function countdown() {
    if (FINISHED) {
        return;
    }
    const players = Array.from(document.getElementsByClassName("circle"));
    if (players.length >= 2) {
        COUNTDOWN_MS -= COUNDOWN_STEP;
    }
    if (COUNTDOWN_MS <= 0) {
        FINISHED = true;
        COUNTDOWN_MS = COUNDOWN_MAX;
        shuffle(players);
        switch (MODE_BUTTON.className) {
            case "mode-finger":
                fingerExtraction(players);
                break;
            case "mode-group":
                groupExtraction(players);
                break;
            case "mode-order":
                orderExtraction(players);
                break;
        }
        window?.navigator?.vibrate?.(200);
    }
}

function fingerExtraction(players) {
    const winnersCount = parseInt(NUMBER_LABEL.innerText);
    for (const loser of players.slice(winnersCount)) {
        loser.remove();
    }
    if (winnersCount === 1) {
        players[0].classList.add("winner");
    }
}


function assignGroup(player, groupIndex) {
    player.style.backgroundColor = COLORS[groupIndex];
    player.style.borderColor = COLORS[groupIndex];
    const group = document.createElement("div");
    group.classList.add("decoration", "group");
    group.innerText = `${groupIndex + 1}`;
    player.appendChild(group);
}

function groupExtraction(players) {
    const groups = parseInt(NUMBER_LABEL.innerText)
    const perGroup = Math.floor(players.length / groups);
    for (let group = 0; group < groups; group++) {
        for (let p = 0; p < perGroup; p++) {
            const player = players[group * perGroup + p];
            assignGroup(player, group);
        }
    }
    for (let p = 0; p < players.length % groups; p++) {
        const player = players[groups * perGroup + p];
        assignGroup(player, p);
    }
}

function orderExtraction(players) {
    for (const [p, player] of players.entries()) {
        const order = document.createElement("div");
        order.classList.add("decoration", "order");
        order.innerText = `${p + 1}`;
        player.appendChild(order);
        player.classList.add("ordered");
        player.getElementsByClassName("border")[0].style.animationDelay = `${(p + 1) / 3}s`;
    }
}

window.addEventListener(
    "load",
    () => {
        SURFACE = document.getElementById("surface");
        SURFACE.ontouchstart = onTouchAdd;
        SURFACE.ontouchmove = onTouchMove;
        SURFACE.ontouchcancel = onTouchEnd;
        SURFACE.ontouchend = onTouchEnd;
        setInterval(countdown, COUNDOWN_STEP);

        NUMBER_LABEL = document.getElementById("number-label");
        NUMBER_BUTTON = document.getElementById("number-button");

        MODE_BUTTON = document.getElementById("mode-checkbox");
        MODE_LABEL = document.getElementById("mode-label");
        MODE_LABEL.innerText = "finger";
        MODE_BUTTON.addEventListener(
            "click",
            (_event) => {
                switch (MODE_BUTTON.className) {
                    case "mode-finger":
                        MODE_BUTTON.className = "mode-group";
                        MODE_LABEL.innerText = "group";
                        if (NUMBER_LABEL.innerText === "1") {
                            NUMBER_LABEL.innerText = "2";
                        }
                        break;
                    case "mode-group":
                        MODE_BUTTON.className = "mode-order";
                        MODE_LABEL.innerText = "order";
                        break;
                    case "mode-order":
                        MODE_BUTTON.className = "mode-finger";
                        MODE_LABEL.innerText = "finger";
                        break;
                }
            }
        );

        for (const [i, li] of Array.from(document.getElementById("number-list").children).entries()) {
            li.style.transitionDelay = `${i / 15}s`
            li.addEventListener(
                "click",
                (event) => {
                    if (MODE_BUTTON.className !== "mode-group" || event.target.innerText !== "1") {
                        NUMBER_LABEL.innerText = event.target.innerText;
                        NUMBER_BUTTON.click();
                    }
                }
            )
        }

        const overlay = document.getElementById("overlay");
        overlay.addEventListener("click", (_event) => {
            overlay.remove();
        })
    }
);
