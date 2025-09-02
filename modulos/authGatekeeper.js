import { endpoint } from '../modulos/variaveisGlobais.js';
import { fetchComAutoRefresh } from '../modulos/fetchComAutoRefresh.js';
import { customAlert } from '../modulos/modals.js';

const CACHE_DURATION_MINUTES = 1440;

export async function checkAuthStatus(path = "../..") {

    const authCache = sessionStorage.getItem('authStatus');
    const cacheTimestamp = sessionStorage.getItem('authTimestamp');
    const isCacheValid = authCache && cacheTimestamp && (new Date().getTime() - cacheTimestamp < CACHE_DURATION_MINUTES * 60 * 1000);

    if (isCacheValid) {
        console.log("Autenticado")
        document.querySelector('.conteudo-restrito').classList.remove("d-none");
        return; 
    }
    
    try {
        const response = await fetchComAutoRefresh(endpoint + '/api/oab/auth/status', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log("Autenticado apos verificação")

            sessionStorage.setItem('authStatus', 'authenticated');
            sessionStorage.setItem('authTimestamp', new Date().getTime());

            document.querySelector('.conteudo-restrito').classList.remove("d-none");

        } else {
            throw new Error("Sessão inválida ou expirada.");
        }

    } catch (error) {
        console.error("Falha na autenticação:", error.message);

        localStorage.removeItem('usuarioInfo');
        sessionStorage.removeItem('authStatus');
        sessionStorage.removeItem('authTimestamp');

        await customAlert("Sua sessão expirou. Você será redirecionado para a tela de login.", () => { 
            window.location.href  = `${path}/login/login-page.html`; 
        });
    } finally {
        document.querySelector('.conteudo-restrito').classList.remove("d-none");
        return;
    }
}
