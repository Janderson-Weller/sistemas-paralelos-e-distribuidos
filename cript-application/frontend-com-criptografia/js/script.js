// login elements
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// chat elements
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "" }
const secretKey = 'minha-chave-secreta'

let websocket

const createMessageSelfElement = (content) => {
    const div = document.createElement("div")

    div.classList.add("message--self")
    div.innerHTML = content

    return div
}

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--other")

    span.classList.add("message--sender")
    span.style.color = senderColor

    div.appendChild(span)

    span.innerHTML = sender
    div.innerHTML += content

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const processMessage = ({ data }) => {
    console.log("Mensagem recebida:", data); // Log para verificar a recepção da mensagem
    try {
        const bytes = CryptoJS.AES.decrypt(data, secretKey);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        console.log("Mensagem descriptografada:", decryptedData); // Log para verificar a descriptografia

        const { userId, userName, userColor, content } = JSON.parse(decryptedData);

        const message =
            userId === user.id
                ? createMessageSelfElement(content)
                : createMessageOtherElement(content, userName, userColor);

        chatMessages.appendChild(message);
        scrollScreen();
    } catch (e) {
        console.error('Erro ao processar a mensagem:', e);
    }
};

const handleLogin = (event) => {
    event.preventDefault();

    user.id = crypto.randomUUID();
    user.name = loginInput.value;
    user.color = getRandomColor();

    login.style.display = "none";
    chat.style.display = "flex";

    websocket = new WebSocket("ws://localhost:8080");
    websocket.onmessage = processMessage;
    websocket.onopen = () => {
        console.log("Conexão WebSocket aberta");
    };
    websocket.onerror = (error) => {
        console.error("Erro no WebSocket:", error);
    };
};

const handleRepeatMsg = (msg) => {
    let encryptedMessage = []
    for (let i = 0; i < 1000; i++) {
        encryptedMessage.push(CryptoJS.AES.encrypt(JSON.stringify({ ...msg, content: `${msg.content}-${i}` }), secretKey).toString());
    }
    for (let i = 0; i < encryptedMessage.length; i++) {
        console.log(i)
        websocket.send(encryptedMessage[i]);
    }
}

const sendMessage = (event) => {
    event.preventDefault();

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: chatInput.value
    };

    handleRepeatMsg(message)
    // let encryptedMessage = CryptoJS.AES.encrypt(JSON.stringify(message), secretKey).toString()
    // websocket.send(encryptedMessage)

    chatInput.value = "";
};

loginForm.addEventListener("submit", handleLogin);
chatForm.addEventListener("submit", sendMessage);