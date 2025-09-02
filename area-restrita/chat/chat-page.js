import Chat from '../../componentes/Chat.js';
import { customAlert } from '../../modulos/modals.js';

let chatManager;
let chatId = JSON.parse(localStorage.getItem("usuarioInfo")).ChatId;

async function hasChatID(chatId) {
    if(!chatId) {
        await customAlert("Você não tem acesso ao chat...");
        window.location.href = "../perfil/perfil-page.html";
        return;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await hasChatID(chatId);
    
    chatManager = new Chat();
    chatManager._init(document.getElementById("chat-canvas"));

    window.dispatchEvent(new Event("carregou-chat"));
})

