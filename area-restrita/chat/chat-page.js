import Chat from '../../componentes/Chat.js';

let chatManager;

document.addEventListener("DOMContentLoaded", async () => {
    
    chatManager = new Chat();
    chatManager._init(document.getElementById("chat-canvas"));

    window.dispatchEvent(new Event("carregou-chat"));
})

