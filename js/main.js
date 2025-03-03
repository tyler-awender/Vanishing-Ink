// Define corruption character set (block Unicode characters)
const corruptionCharacters = ["▒", "▓", "░", "█", "▀", "▄", "▌", "▐", "▞", "▟", "■", "▛", "▏", "▆"];

let userText = []; // array of dicts
let textField; // output

function DisplayDate()
{
    const dateId = document.getElementById("date");
    const currentDate = new Date().toLocaleDateString("en-US");
    dateId.innerText = currentDate;
}

// run these on window load
window.onload = function ()
{
    DisplayDate();
    textField = document.getElementById("userInput");
    setInterval(checkCorruption, 3000); // check corruption every 3 seconds
};

function CaptureInput(event)
{
    if (!textField) return;

    let currentTime = Date.now(); // get timestamp for corruption check

    // space
    if (event.key === " ")
    {
        userText.push({ char: " ", timestamp: currentTime }); // push dict to userText
    } 

    // newline
    else if (event.key === "Enter")
    {
        userText.push({ char: "\n", timestamp: currentTime });
    } 

    // other chars
    else if (event.key.length === 1) 
    {
        userText.push({ char: event.key, timestamp: currentTime });
    }

    updateDisplay();
}
// run CaptureInput() on every keystroke
document.addEventListener("keydown", CaptureInput);

// update displayed text
function updateDisplay()
{
    // only continue if textfield is not null
    if (textField) 
    {
        // extract chars and add to map
        textField.textContent = userText.map(obj => obj.char).join(""); // .join -> convert into string??
    }
}

// check corruption every second
function checkCorruption()
{
    let currentTime = Date.now();

    userText = userText.map
    (
        obj =>
    {
        let timeElapsed = (currentTime - obj.timestamp) / 1000; // check in seconds
        if
        (
            // if char age > 10 seconds
            timeElapsed >= 10 &&
            Math.random() < 0.05 && // 5% chance per second
            obj.char.trim() !== "" && // ignore spaces and newline
            !corruptionCharacters.includes(obj.char) // dont corrupt corrupted chars
        )

        // set random corrupted char to current char and replace
        {
            obj.char = corruptionCharacters[Math.floor(Math.random() * corruptionCharacters.length)];
        }

        return obj;
    });

    updateDisplay();
}
