import { endpoint } from '../modulos/variaveisGlobais.js';
import { customAlert } from '../modulos/modals.js';

localStorage.removeItem("usuarioInfo");
sessionStorage.removeItem('authStatus');
sessionStorage.removeItem('authTimestamp');

async function enviarEmailDeRedefinicao(){
    const usuario = document.getElementById("usuario").value;

    if(!usuario) {
        await customAlert("Preencha o usuario!");
        return;
    }

    try {
        document.getElementById("div-carregando-fundo").style.display = "flex";

        const response = await fetch(endpoint + '/api/auth/requestResetPassword', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                usuario: usuario,
             })
        });

        document.getElementById("div-carregando-fundo").style.display = "none";
    
        const data = await response.json();

        if (!response.ok || data.status !== "SUCCESS") {
          await customAlert(data.message || "Erro ao enviar o link para redefinir sua senha.");
          return;
        } else {
            await customAlert(data.message || "Enviamos no seu email o link para redefinir sua senha.");
            window.location.href = "../login/login-page.html";
        }
        
    } catch (err) {
        console.log('Erro ao verificar usuario: ', err);
    }
}

document.getElementById('redefinir-btn').addEventListener('click', (event) => {
    event.preventDefault();
    enviarEmailDeRedefinicao();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        enviarEmailDeRedefinicao();
    }
});