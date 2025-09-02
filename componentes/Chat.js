import { customAlert, customToast } from '../modulos/modals.js';
import { endpoint } from '../modulos/variaveisGlobais.js';
import { fetchComAutoRefresh } from '../modulos/fetchComAutoRefresh.js';
import { v4 as uuidv4 } from 'https://cdn.skypack.dev/uuid';

class Chat {
    constructor() {
        this.telaCarregamento = document.getElementById("div-carregando-fundo");

        this.socket = io(`${endpoint}/oz-chat`, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 40,
            reconnectionDelay: 1500,
            reconnectionDelayMax: 3000,
            timeout: 30000
        });

        this.contatoAberto = null;

        this.dadosUsuario;
        
        this.dadosContatos = {};
        this.dadosConversas = {};

        this.mensagensPorContato = {};

        // Paginação por contato (infinite scroll)
        this.paginacao = {}; // { [idContato]: { oldestDateLoaded: Date, reachedStart: boolean, isLoading: boolean, pageSize: number } }

        // Garantia de envio com socket
        this.pendingOutbox = []; // fila de mensagens quando offline
        this.isSocketConnected = false;

        // Garanta que o estado de conexão esteja correto mesmo antes de registrar handlers completos
        this.isSocketConnected = !!this.socket.connected;
        this.socket.on('connect', () => {
            this.isSocketConnected = true;
            // Reenvia pendências imediatamente
            const fila = [...this.pendingOutbox];
            this.pendingOutbox = [];
            fila.forEach(p => this.socket.emit('mensagemEnviada', p));
        });
        this.socket.on('disconnect', () => {
            this.isSocketConnected = false;
        });
    }

    // Cria o front do chat no canvas
    async _renderCanvas(canvas) {
        canvas.innerHTML = `
            <div class="app-chat card overflow-hidden">
                <div class="row g-0">
                <!-- Sidebar Left -->
                <div class="col app-chat-sidebar-left app-sidebar overflow-hidden" id="app-chat-sidebar-left">
                    <div
                    class="chat-sidebar-left-user sidebar-header d-flex flex-column justify-content-center align-items-center flex-wrap px-6 pt-12">
                    <div class="avatar avatar-xl avatar-online chat-sidebar-avatar" id="user-chat-sidebar-edit-avatar">
                        <img src="../../assets/images/foto-perfil-light.png" alt="Avatar" class="rounded-circle" style="object-fit: contain;" id="user-chat-sidebar-edit-foto"/>
                    </div>
                    <h5 class="mt-4 mb-0" id="user-chat-sidebar-edit-nome">Nome Completo</h5>
                    <span id="user-chat-sidebar-edit-usuario">usuario.usuario</span>
                    <i
                        class="icon-base bx bx-x icon-lg cursor-pointer close-sidebar"
                        data-bs-toggle="sidebar"
                        data-overlay
                        data-target="#app-chat-sidebar-left"></i>
                    </div>
                    <div class="sidebar-body px-6 pb-6">
                    <div class="my-6">
                        <div class="maxLength-wrapper">
                        <label for="chat-sidebar-left-user-about" class="text-uppercase text-body-secondary mb-1"
                            >Sobre</label
                        >
                        <textarea
                            class="form-control chat-sidebar-left-user-about maxLength-example"
                            rows="3"
                            maxlength="120" id="user-chat-sidebar-edit-sobre">Digite aqui alguma informação sobre você</textarea
                        >
                        <small id="textarea-maxlength-info"></small>
                        </div>
                    </div>
                    <div class="my-6">
                        <p class="text-uppercase text-body-secondary mb-1">Status</p>
                        <div class="d-grid gap-2 pt-2 text-heading ms-2">
                        <div class="form-check form-check-success">
                            <input
                            name="chat-user-status"
                            class="form-check-input"
                            type="radio"
                            value="active"
                            id="user-active" />
                            <label class="form-check-label" for="user-active">Online</label>
                        </div>
                        <div class="form-check form-check-warning">
                            <input
                            name="chat-user-status"
                            class="form-check-input"
                            type="radio"
                            value="away"
                            id="user-away" />
                            <label class="form-check-label" for="user-away">Ausente</label>
                        </div>
                        <div class="form-check form-check-danger">
                            <input
                            name="chat-user-status"
                            class="form-check-input"
                            type="radio"
                            value="busy"
                            id="user-busy" />
                            <label class="form-check-label" for="user-busy">Não Perturbe</label>
                        </div>
                        <div class="form-check form-check-secondary">
                            <input
                            name="chat-user-status"
                            class="form-check-input"
                            type="radio"
                            value="offline"
                            id="user-offline" />
                            <label class="form-check-label" for="user-offline">Offline</label>
                        </div>
                        </div>
                    </div>  

                    <div class="d-flex mt-6">
                        <button
                        class="btn btn-primary w-100" id="btn-editar-perfil">
                        Salvar<i class="icon-base bx bx-save icon-sm ms-2"></i>
                        </button>
                    </div>
                    </div>
                </div>
                <!-- /Sidebar Left-->

                <!-- Chat & Contacts -->
                <div
                    class="col app-chat-contacts app-sidebar flex-grow-0 overflow-hidden border-end"
                    id="app-chat-contacts">
                    <div class="sidebar-header px-6 border-bottom d-flex align-items-center">
                    <div class="d-flex align-items-center me-6 me-lg-0">
                        <div
                        class="flex-shrink-0 avatar avatar-online me-4"
                        id="user-chat-sidebar-avatar"
                        data-bs-toggle="sidebar"
                        data-overlay="app-overlay-ex"
                        data-target="#app-chat-sidebar-left">
                        <img
                            id="user-chat-sidebar-foto"
                            class="user-avatar rounded-circle"
                            src="../../assets/images/foto-perfil-light.png"
                            alt="Avatar"
                            style="object-fit: contain;" />
                        </div>
                        <div class="flex-grow-1 input-group input-group-merge rounded-pill">
                        <span class="input-group-text" id="basic-addon-search31"
                            ><i class="icon-base bx bx-search icon-sm"></i
                        ></span>
                        <input
                            type="text"
                            class="form-control chat-search-input"
                            placeholder="Pesquisar..."
                            aria-label="Pesquisar..."
                            aria-describedby="basic-addon-search31" />
                        </div>
                    </div>
                    <i
                        class="icon-base bx bx-x icon-lg cursor-pointer position-absolute top-50 end-0 translate-middle d-lg-none d-block"
                        data-overlay
                        data-bs-toggle="sidebar"
                        data-target="#app-chat-contacts"></i>
                    </div>
                    <div class="sidebar-body" style="overflow-y: auto;">
                    <!-- Grupos -->
                    <ul class="list-unstyled chat-contact-list py-2 mb-0" id="group-list">
                        <li class="chat-contact-list-item chat-contact-list-item-title mt-0">
                        <h5 class="text-primary mb-0">Grupos</h5>
                        </li>
                        <!-- Lista de Chats -->
                        <li class="chat-contact-list-item chat-list-item-0 d-block">
                        <h6 class="text-body-secondary mb-0">Nenhum Grupo Encontrado</h6>
                        </li>

                    </ul>

                    <!-- Chats -->
                    <ul class="list-unstyled chat-contact-list py-2 mb-0" id="chat-list">
                        <li class="chat-contact-list-item chat-contact-list-item-title mt-0" id="title-conversa">
                        <h5 class="text-primary mb-0">Conversas</h5>
                        </li>
                        <!-- Lista de Chats -->
                        <li class="chat-contact-list-item chat-list-item-0 d-none">
                        <h6 class="text-body-secondary mb-0">Nenhuma Conversa Encontrada</h6>
                        </li>

                    </ul>

                    <!-- Contacts -->
                    <ul class="list-unstyled chat-contact-list mb-0 py-2" id="contact-list">
                        <li class="chat-contact-list-item chat-contact-list-item-title mt-0">
                        <h5 class="text-primary mb-0">Contatos</h5>
                        </li>
                        <!-- Lista de Contatos -->
                        <li class="chat-contact-list-item contact-list-item-0 d-none">
                        <h6 class="text-body-secondary mb-0">Nenhum Contato Encontrado</h6>
                        </li>

                    </ul>
                    </div>
                </div>
                <!-- /Chat contacts -->

                <!-- Chat conversation -->
                <div
                    class="col app-chat-conversation d-flex align-items-center justify-content-center flex-column"
                    id="app-chat-conversation">
                    <div class="bg-label-primary p-8 rounded-circle">
                    <i class="icon-base bx bx-message-alt-detail icon-48px"></i>
                    </div>
                    <p class="my-4" style="text-align: center;">Selecione um contato para iniciar uma conversa.</p>
                    <button class="btn btn-primary app-chat-conversation-btn" id="app-chat-conversation-btn">
                    Selecione um contato
                    </button>
                </div>
                <!-- /Chat conversation -->

                <!-- Chat History -->
                <div class="col app-chat-history d-none" id="app-chat-history">
                    <div class="chat-history-wrapper">
                    <div class="chat-history-header border-bottom">
                        <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex overflow-hidden align-items-center">
                            <i
                            class="icon-base bx bx-menu icon-lg cursor-pointer d-lg-none d-block me-4"
                            data-bs-toggle="sidebar"
                            data-overlay
                            data-target="#app-chat-contacts"></i>
                            <div class="flex-shrink-0 avatar avatar-online" id="contato-chat-history-avatar">
                            <img
                                src="../../assets/images/foto-perfil-light.png"
                                alt="Avatar" id="contato-chat-history-foto"
                                class="rounded-circle"
                                data-bs-toggle="sidebar"
                                data-overlay style="object-fit: contain;"
                                data-target="#app-chat-sidebar-right" />
                            </div>
                            <div class="chat-contact-info flex-grow-1 ms-4">
                            <h6 class="m-0 fw-normal" id="contato-chat-history-nome">Nome Completo</h6>
                            <small class="user-status text-body" id="contato-chat-history-username">usuario.usuario</small>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <span
                            class="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill disabled">
                            <i class="icon-base bx bx-phone icon-md"></i>
                            </span>
                            <span
                            class="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill disabled">
                            <i class="icon-base bx bx-video icon-md"></i>
                            </span>
                            <span
                            class="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill disabled">
                            <i class="icon-base bx bx-search icon-md"></i>
                            </span>
                        </div>
                        </div>
                    </div>
                    <div class="chat-history-body" style="flex: 1; overflow-y: auto;">
                        <ul class="list-unstyled chat-history d-flex flex-column justify-content-end mb-0" style="min-height: 100%;">
                        <!-- Mensagens aqui -->
                        </ul>
                    </div>

                    <!-- Chat message form -->
                    <div class="chat-history-footer shadow-xs">
                        <form class="form-send-message d-flex justify-content-between align-items-center w-100">
                           <textarea
                                class="form-control message-input border-0 me-4 shadow-none custom-scroll"
                                placeholder="Mensagem"
                                rows="4"
                                style="height: 20px; max-height: 50px; resize: none; background-color: inherit; border-radius: 20px;"
                            ></textarea>

                            <div class="message-actions d-flex align-items-center">

                            <span class="btn btn-text-secondary btn-icon rounded-pill cursor-pointer">
                                <i class="speech-to-text icon-base bx bx-microphone icon-md text-heading"></i>
                            </span>
                            
                            <label for="attach-doc" class="form-label mb-0" disabled>
                                <span class="btn btn-text-secondary btn-icon rounded-pill cursor-pointer mx-1 disabled">
                                    <i class="icon-base bx bx-paperclip icon-md text-heading"></i>
                                </span>
                                <!-- <input type="file" id="attach-doc" hidden /> -->
                            </label>
                            <button class="btn btn-primary d-flex send-msg-btn">
                                <span class="align-middle d-md-inline-block d-none">Enviar</span>
                                <i class="icon-base bx bx-paper-plane icon-sm ms-md-2 ms-0"></i>
                            </button>
                            </div>
                        </form>
                    </div>

                    </div>
                </div>
                <!-- /Chat History -->

                <!-- Sidebar Right -->
                <div class="col app-chat-sidebar-right app-sidebar overflow-hidden" id="app-chat-sidebar-right">
                    <div
                    class="sidebar-header d-flex flex-column justify-content-center align-items-center flex-wrap px-6 pt-12">
                    <div class="avatar avatar-xl avatar-online chat-sidebar-avatar" id="contato-chat-sidebar-avatar">
                        <img src="../../assets/images/foto-perfil-light.png" alt="Avatar" class="rounded-circle" id="contato-chat-sidebar-foto" style="object-fit: contain;"/>
                '    </div>
                    <h5 class="mt-4 mb-0" id="contato-chat-sidebar-nome">Nome Completo</h5>
                    <span id="contato-chat-sidebar-username">usuario.usuario</span>
                    <i
                        class="icon-base bx bx-x icon-lg cursor-pointer close-sidebar d-block"
                        data-bs-toggle="sidebar"
                        data-overlay
                        data-target="#app-chat-sidebar-right"></i>
                    </div>
                    <div class="sidebar-body p-6 pt-0">
                    <div class="my-6">
                        <p class="text-uppercase mb-1 text-body-secondary">Sobre</p>
                        <p class="mb-0" id="contato-chat-sidebar-sobre">
                        É um fato amplamente estabelecido que um leitor será distraído pelo conteúdo legível.
                        </p>
                    </div>
                    <div class="d-flex mt-6">
                        <button
                        class="btn btn-danger w-100"
                        disabled
                        data-bs-toggle="sidebar"
                        data-overlay
                        data-target="#app-chat-sidebar-right">
                        Bloquar Contato<i class="icon-base bx bx-trash icon-sm ms-2"></i>
                        </button>
                    </div>
                    </div>
                </div>
                <!-- /Sidebar Right -->

                </div>
            </div>`;
    }

    // Puxa as infos do usuario 
    async _fetchDadosUsuario() {
        try {
            this.telaCarregamento.style.display = "flex";
    
            const response = await fetchComAutoRefresh(`${endpoint}/api/oz/chat/usuario`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, '../../..');
    
            this.telaCarregamento.style.display = "none";
    
            if (response.status === 500) {
                customAlert("Erro interno no servidor ao buscar o usuario.");
                return;
            }
    
            const dados = await response.json();
    
            if (!dados.payload || !Array.isArray(dados.payload)) {
                await customAlert("Ocorreu um erro no token de acesso.");
                window.location.href = "../../index.html";
            }
    
            this.dadosUsuario = dados.payload[0];
        } catch (err) {
            this.telaCarregamento.style.display = "none";
            customAlert("Erro ao realizar consulta: " + err);
            console.error("Erro ao realizar consulta: ", err);
        }
    }

    // Puxa os contatos do usuario
    async _fetchDadosContatos() {    
        try {
            this.telaCarregamento.style.display = "flex";
    
            const response = await fetchComAutoRefresh(`${endpoint}/api/oz/chat/contatos`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, '../../..');
    
            this.telaCarregamento.style.display = "none";
    
            if (response.status === 500) {
                customAlert("Erro interno no servidor ao buscar os contatos.");
                return;
            }
    
            const dados = await response.json();
    
            if (!dados.payload || !Array.isArray(dados.payload)) {
                await customAlert("Não foi possível carregar os contatos.");
                window.location.reload();
            }

            if(dados.payload.length === 0) {
                document.querySelector(".contact-list-item-0").classList.remove("d-none");
            }

            dados.payload.forEach(contato => {
                this.dadosContatos[contato.id] = contato;
                this.mensagensPorContato[contato.id] = {}
            });
        } catch (err) {
            this.telaCarregamento.style.display = "none";
            customAlert("Erro ao realizar consulta: " + err);
            console.error("Erro ao realizar consulta: ", err);
        }
    }

    // Puxa as conversas do usuario 
    async _fetchDadosConversas() {    
        try {
            this.telaCarregamento.style.display = "flex";
    
            const response = await fetchComAutoRefresh(`${endpoint}/api/oz/chat/conversas`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, '../../..');
    
            this.telaCarregamento.style.display = "none";
    
            if (response.status === 500) {
                customAlert("Erro interno no servidor ao buscar as conversas.");
                return;
            }
    
            const dados = await response.json();
    
            if (!dados.payload || !Array.isArray(dados.payload)) {
                await customAlert("Não foi possível carregar as conversas.");
                window.location.reload();
                return;
            }

            if(dados.payload.length === 0) {
                document.querySelector(".chat-list-item-0").classList.remove("d-none");
                document.querySelector(".chat-list-item-0").removeEventListener("click", this._handleConversas);
            }

            dados.payload.forEach(conversa => {
                this.dadosConversas[conversa.id] = conversa; 
            });
        } catch (err) {
            this.telaCarregamento.style.display = "none";
            customAlert("Erro ao realizar consulta: " + err);
            console.error("Erro ao realizar consulta: ", err);
        }
    }

    // Puxa as mensagens do usuario com um contato
    async _fetchDadosMensagens(idContato, { limit = 100, before = null } = {}) {    
        try {
            this.telaCarregamento.style.display = "flex";
    
            const url = new URL(`${endpoint}/api/oz/chat/mensagens`);
            url.searchParams.set('idContato', idContato);
            url.searchParams.set('limit', String(limit));
            if (before) url.searchParams.set('before', new Date(before).toISOString());

            const response = await fetchComAutoRefresh(url.toString(), {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, '../../..');
    
            this.telaCarregamento.style.display = "none";
    
            if (response.status === 500) {
                customAlert("Erro interno no servidor ao buscar as mensagens.");
                return;
            }
    
            const dados = await response.json();
    
            if (!dados.payload || !Array.isArray(dados.payload)) {
                customAlert("Payload não encontrado ou em formato inválido na resposta das mensagens.");
                return;
            }

            if (!this.mensagensPorContato[idContato]) {
                this.mensagensPorContato[idContato] = {};
            }

            if(dados.payload.length === 0) {
                // marca fim da paginação
                if (!this.paginacao[idContato]) this.paginacao[idContato] = { oldestDateLoaded: new Date(), reachedStart: false, isLoading: false, pageSize: limit };
                this.paginacao[idContato].reachedStart = true;
                return;                
            }

            // Merge mensagens
            dados.payload.forEach(mensagem => {
                this.mensagensPorContato[idContato][mensagem.id_element] = mensagem;
            });

            // Atualiza oldestDateLoaded
            const oldest = dados.payload[0]?.data_hora;
            if (!this.paginacao[idContato]) this.paginacao[idContato] = { oldestDateLoaded: new Date(oldest), reachedStart: false, isLoading: false, pageSize: limit };
            else this.paginacao[idContato].oldestDateLoaded = new Date(oldest);

            this._handleMensagens(idContato)
        } catch (err) {
            this.telaCarregamento.style.display = "none";
            customAlert("Erro ao realizar consulta: " + err);
            console.error("Erro ao realizar consulta: ", err);
        }
    }

    async _loadMoreMensagens(idContato) {
        if (!this.paginacao[idContato] || this.paginacao[idContato].reachedStart || this.paginacao[idContato].isLoading) return;
        this.paginacao[idContato].isLoading = true;

        const container = this.elements.chatHistoryBody;
        const prevScrollHeight = container?.scrollHeight || 0;
        const prevScrollTop = container?.scrollTop || 0;

        try {
            await this._fetchDadosMensagens(idContato, {
                limit: this.paginacao[idContato].pageSize || 50,
                before: this.paginacao[idContato].oldestDateLoaded || new Date()
            });

            // Re-render e manter posição
            this._handleMensagens(idContato);
            const newScrollHeight = container?.scrollHeight || 0;
            if (container) container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
        } finally {
            this.paginacao[idContato].isLoading = false;
        }
    }

    // Formata ISO em data e hora (dd/mm/yyyy - mm:hh)
    _formatarDataHoraBrasileira(dataIso) {
        const data = new Date(dataIso);

        const dataFormatada = data.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false 
        });

        return dataFormatada.replace(',', ' -');  
    }

    // Formata ISO em hora (mm:hh)
    _formatarHoraBrasileira(dataIso) {
        const data = new Date(dataIso);

        const horaFormatada = data.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        return horaFormatada; 
    }

    // Formata ISO para hora ou dia, ex: "18:30, ontem, ..."
    _formatarDataConversa(dataStr) {
        const data = new Date(dataStr);
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);

        const mesmoDia = data.toDateString() === hoje.toDateString();
        const eOntem = data.toDateString() === ontem.toDateString();

        const diffEmMilissegundos = hoje - data;
        const diffEmDias = Math.floor(diffEmMilissegundos / (1000 * 60 * 60 * 24));

        if (mesmoDia) {
            return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        } else if (eOntem) {
            return "Ontem";
        } else if (diffEmDias < 7) {
            return data.toLocaleDateString("pt-BR", { weekday: "long" });
        } else {
            return data.toLocaleDateString("pt-BR");
        }
    }


    // Formata ISO para dia, ex: "hoje, ontem, ..."
    _formatarDiaDivisor(dataStr) {
        const data = new Date(dataStr);
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);

        const isHoje = data.toDateString() === hoje.toDateString();
        const isOntem = data.toDateString() === ontem.toDateString();

        if (isHoje) return "Hoje";
        if (isOntem) return "Ontem";

        const diffDias = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
        if (diffDias < 7) {
            return data.toLocaleDateString('pt-BR', { weekday: 'long' });
        }

        return data.toLocaleDateString('pt-BR');
    }

    // Plota as mesangens puxadas com um contato
    _handleMensagens(idContato) {
        const listaDeMensagens = document.querySelector(".chat-history");
        listaDeMensagens.innerHTML = "";

        const mensagens = Object.values(this.mensagensPorContato[idContato])
            .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)); 

        let ultimoDia = null;

        mensagens.forEach(mensagem => {
            const dataMensagem = new Date(mensagem.data_hora);
            const diaAtual = dataMensagem.toDateString();

            if (diaAtual !== ultimoDia) {
                ultimoDia = diaAtual;
                const divisor = document.createElement("div");
                divisor.className = "text-center my-2 text-muted fw-bold small";
                divisor.textContent = this._formatarDiaDivisor(mensagem.data_hora);
                listaDeMensagens.appendChild(divisor);
            }

            const mensagemLI = document.createElement("li");
            mensagemLI.classList = mensagem.from === idContato
                ? "chat-message"
                : "chat-message chat-message-right";
            mensagemLI.style.setProperty('margin-bottom', '5px', 'important');

            mensagemLI.innerHTML = `
                <div class="d-flex overflow-hidden">
                    <div class="chat-message-wrapper flex-grow-1">
                        <div class="chat-message-text">
                            <p class="mb-0">${mensagem.conteudo}</p>
                            <p class="mb-0" style="width: 100%; display: flex; flex-direction: row; justify-content: flex-end; gap: 4px; margin-top: 3px;">
                                <small>${this._formatarHoraBrasileira(mensagem.data_hora)}</small>
                                ${mensagem.from !== idContato
                                    ? `<i id="indicador-mensagem-${mensagem.id_element}" class="icon-base bx ${mensagem.foi_recebido ? "bx-check-double" : mensagem.foi_enviado ? "bx-check" : ""} icon-16px ${mensagem.foi_lido ? "text-success" : ""}"></i>`
                                    : ""}
                            </p>
                        </div>
                    </div>
                </div>
            `;

            listaDeMensagens.appendChild(mensagemLI);

            if (mensagem.from === idContato) {
                this.socket.emit("mensagemEntregue", {
                    contato: mensagem.from,
                    idMensagem: mensagem.id,
                    idElement: mensagem.id_element
                });

                this.socket.emit("mensagemLida", {
                    contato: mensagem.from,
                    idMensagem: mensagem.id,
                    idElement: mensagem.id_element
                });
            }
        });
    }

    // Devolve uma classe com base no status
    _avatarStatus(status) {
        if(status === "Online") return 'avatar-online';
        if(status === "Ausente") return 'avatar-away';
        if(status === "Não Perturbe") return 'avatar-busy';
        if(status === "Offline") return 'avatar-offline';
        
        return 'avatar-online';
    }

    // Preenche as informações do usuario 
    _preencherInformacoesUsuario(dados_usuario) {
        document.getElementById("user-chat-sidebar-edit-avatar").classList = `avatar avatar-xl chat-sidebar-avatar`;
        document.getElementById("user-chat-sidebar-edit-foto").src = dados_usuario.foto || "../../assets/images/foto-perfil-light.png";
        document.getElementById("user-chat-sidebar-edit-nome").textContent = dados_usuario.nome
        document.getElementById("user-chat-sidebar-edit-usuario").textContent = dados_usuario.usuario;
        document.getElementById("user-chat-sidebar-edit-sobre").textContent = dados_usuario.sobre;

        switch(dados_usuario.status) {
            case "Online":
                document.getElementById("user-active").checked = true;
                break;
            case "Ausente":
                document.getElementById("user-away").checked = true;
                break;
            case "Não Perturbe":
                document.getElementById("user-busy").checked = true;
                break;
            case "Offline":
                document.getElementById("user-offline").checked = true;
                break;
            default:
                document.getElementById("user-active").checked = true;
                break;
        }

        document.getElementById("user-chat-sidebar-avatar").classList = `flex-shrink-0 avatar ${this._avatarStatus(dados_usuario.status)} me-4`;
        document.getElementById("user-chat-sidebar-foto").src = dados_usuario.foto || "../../assets/images/foto-perfil-light.png";
    }

    // Plota as informações do usuario e disponibiliza editar as informações do perfil
    _handleUsuario() {
        this._preencherInformacoesUsuario(this.dadosUsuario);
        
        document.getElementById("btn-editar-perfil").addEventListener("click", async () => {
            const sobre = document.getElementById("user-chat-sidebar-edit-sobre").value.trim();
            const checkedStatusInput = document.querySelector('input[name="chat-user-status"]:checked');

            const status = checkedStatusInput 
                ? document.querySelector(`label[for="${checkedStatusInput.id}"]`)?.textContent.trim() 
                : null;

            if (!sobre || !status) {
                await customAlert("Preencha os campos de 'Sobre' e 'Status'");
                return;
            }

            try {
                this.telaCarregamento.style.display = "flex";
    
                const response = await fetchComAutoRefresh(`${endpoint}/api/oz/chat/editarUsuario`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        sobre: sobre,
                        status: status
                    })
                }, '../../..');
        
                this.telaCarregamento.style.display = "none";
        
                if (response.status === 500) {
                    await customAlert("Erro interno no servidor ao editar o usuário.");
                    return;
                }
                
                const dados = await response.json();
        
                if (!dados.payload || !Array.isArray(dados.payload)) {
                    await customAlert("Payload não encontrado ou em formato inválido na resposta dos dados do usuario.");
                    return;
                }
        
                this.dadosUsuario = dados.payload[0];   
                
                this._preencherInformacoesUsuario(this.dadosUsuario);

                document.querySelector(".app-chat-sidebar-left").classList.remove("show");

                customToast("Perfil editado com sucesso");

                // Avisar com Socket todos contatos!
                this.socket.emit("perfilEditado", {
                    contatos: Object.values(this.dadosContatos).map(obj => obj.id),
                    statusAtualizado: this.dadosUsuario.status,
                    sobreAtualizado: this.dadosUsuario.sobre
                })

            } catch (err) {
                this.telaCarregamento.style.display = "none";
                customAlert("Erro ao realizar a edição do usuário: " + err);
                console.error("Erro ao realizar a edição do usuário: ", err);
            }
        })
    }

    // Plota os contatos
    _handleContatos() {
        const listaDeContatosContainer = document.getElementById("contact-list");

        Object.values(this.dadosContatos).forEach(contato => {
            const contatoLI = document.createElement("li");
            contatoLI.classList = "chat-contact-list-item";
            contatoLI.setAttribute("data-id", contato.id);
            contatoLI.innerHTML = `
                <a class="d-flex align-items-center">
                    <div class="flex-shrink-0 avatar">
                        <img src="${contato.foto || "../../assets/images/foto-perfil-light.png"}" alt="Avatar" class="rounded-circle" style="object-fit: contain;"/>
                    </div>
                    <div class="chat-contact-info flex-grow-1 ms-4">
                        <h6 class="chat-contact-name text-truncate m-0 fw-normal">${contato.nome}</h6>
                    </div>
                </a>`;

            listaDeContatosContainer.appendChild(contatoLI)
        });
    }

    // Move conversa para o topo caso receba uma mensagem da mesma
    _moverConversaParaTopo(userId) {
        const li = document.querySelector(`#chat-list li[data-id="${userId}"]`);
        if (!li) return;

        const chatList = document.getElementById("chat-list");

        const titleConversas = chatList.querySelector("#title-conversa");

        // Move para o topo
        chatList.prepend(li);
        chatList.prepend(titleConversas);
    }

    _handleConversas() {
        const listaDeConversasContainer = document.getElementById("chat-list");

        const conversasOrdenadas = Object.values(this.dadosConversas)
            .sort((a, b) => new Date(b.ultima_mensagem_data_hora) - new Date(a.ultima_mensagem_data_hora));

        // Mostra/oculta placeholder "Nenhuma Conversa Encontrada"
        const placeholder = listaDeConversasContainer.querySelector('.chat-list-item-0');
        if (placeholder) {
            placeholder.classList.toggle('d-none', conversasOrdenadas.length > 0);
        }

        // Remove itens antigos (mantendo o título e o placeholder)
        listaDeConversasContainer
          .querySelectorAll('.chat-contact-list-item:not(.chat-contact-list-item-title):not(.chat-list-item-0)')
          .forEach(el => el.remove());

        conversasOrdenadas.forEach(conversa => {
            const unread = Number(conversa.mensagens_nao_lidas || 0);
            const conversaLI = document.createElement("li");
            conversaLI.classList = "chat-contact-list-item";
            conversaLI.setAttribute("data-id", conversa.id);
            conversaLI.innerHTML = `
                <a class="d-flex align-items-center">
                    <div class="flex-shrink-0 avatar ${this.dadosConversas[conversa.id] && this.dadosConversas[conversa.id].status ? this._avatarStatus(this.dadosConversas[conversa.id].status) : ""}" id="conversa-avatar-${conversa.id}">
                        <img src="${conversa.foto || "../../assets/images/foto-perfil-light.png"}" alt="Avatar" class="rounded-circle" style="object-fit: contain;"/>
                    </div>
                    <div class="chat-contact-info flex-grow-1 ms-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="chat-contact-name text-truncate m-0 fw-normal">${conversa.nome}</h6>
                            <small id="conversa-msg-nao-lida-indicador-${conversa.id}" class="chat-contact-list-item-time ${unread > 0 ? "text-success" : ""}">${conversa.ultima_mensagem_data_hora? this._formatarDataConversa(conversa.ultima_mensagem_data_hora) : ""}</small>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small id="conversa-ultima-msg-conteudo-${conversa.id}" class="chat-contact-status text-truncate">${conversa.ultima_mensagem_conteudo ? conversa.ultima_mensagem_conteudo : ""}</small>
                            <small id="conversa-msg-nao-lida-qtd-${conversa.id}" class="chat-contact-list-item-time bg-success" style="color: var(--bs-paper-bg); border-radius: 50%; height: 18px !important; width: 100% !important; max-width: 20px; text-align: center; margin-left: 4px; ${unread > 0 ? "display: block;" : "display: none;"}">${unread > 0 ? unread : ""}</small>
                        </div>
                    </div>
                </a>`;

            listaDeConversasContainer.appendChild(conversaLI)
        });
    }

    _initTemplateElements() {
        if(window.innerWidth < 992) {
            const sidebar = document.querySelector('#app-chat-contacts');
            if (sidebar) {
                sidebar.classList.toggle('show'); 
            }
        }

        function debounce(func, wait) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        this.elements = {
            chatContactsBody: document.querySelector('.app-chat-contacts .sidebar-body'),
            chatHistoryBody: document.querySelector('.chat-history-body'),
            chatSidebarLeftBody: document.querySelector('.app-chat-sidebar-left .sidebar-body'),
            chatSidebarRightBody: document.querySelector('.app-chat-sidebar-right .sidebar-body'),
            chatUserStatus: [...document.querySelectorAll(".form-check-input[name='chat-user-status']")],
            chatSidebarLeftUserAbout: document.getElementById('user-chat-sidebar-edit-sobre'),
            formSendMessage: document.querySelector('.form-send-message'),
            messageInput: document.querySelector('.message-input'),
            searchInput: document.querySelector('.chat-search-input'),
            chatContactListItems: [...document.querySelectorAll('.chat-contact-list-item:not(.chat-contact-list-item-title)')],
            textareaInfo: document.getElementById('textarea-maxlength-info'),
            conversationButton: document.getElementById('app-chat-conversation-btn'),
            chatHistoryHeader: document.querySelector(".chat-history-header [data-target='#app-chat-contacts']"),
            speechToText: $('.speech-to-text'),
            appChatConversation: document.getElementById('app-chat-conversation'),
            appChatHistory: document.getElementById('app-chat-history')
        };

        const initPerfectScrollbar = elements => {
            elements.forEach(el => {
                if (el) {
                    new PerfectScrollbar(el, {
                    wheelPropagation: false,
                    suppressScrollX: true
                    });
                }
            });
        };

        this.elements.messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); 
                
                document.querySelector(".send-msg-btn").click(); 
            }
        });

        /**
         * Scroll chat history to the bottom.
         */
        const scrollToBottom = () => this.elements.chatHistoryBody?.scrollTo(0, this.elements.chatHistoryBody.scrollHeight);

        // Handle textarea max length count.
        function handleMaxLengthCount(inputElement, infoElement, maxLength) {
            const currentLength = inputElement.value.length;
            const remaining = maxLength - currentLength;

            infoElement.className = 'maxLength label-success';

            if (remaining >= 0) {
            infoElement.textContent = `${currentLength}/${maxLength}`;
            }
            if (remaining <= 0) {
            infoElement.textContent = `${currentLength}/${maxLength}`;
            infoElement.classList.remove('label-success');
            infoElement.classList.add('label-danger');
            }
        }

        /**
         * Switch to chat conversation view.
         */
        const switchToChatConversation = () => {
            this.elements.appChatConversation.classList.replace('d-flex', 'd-none');
            this.elements.appChatHistory.classList.replace('d-none', 'd-block');
        };

        /**
         * Filter chat contacts by search input.
         * @param {string} selector - CSS selector for chat/contact list items.
         * @param {string} searchValue - Search input value.
         * @param {string} placeholderSelector - Selector for placeholder element.
         */
        const filterChatContacts = (selector, searchValue, placeholderSelector) => {
            const items = document.querySelectorAll(`${selector}:not(.chat-contact-list-item-title)`);
            let visibleCount = 0;

            items.forEach(item => {
            const isVisible = item.textContent.toLowerCase().includes(searchValue);
            item.classList.toggle('d-flex', isVisible);
            item.classList.toggle('d-none', !isVisible);
            if (isVisible) visibleCount++;
            });

            document.querySelector(placeholderSelector)?.classList.toggle('d-none', visibleCount > 0);
        };

        /**
         * Initialize speech-to-text functionality.
         */
        const initSpeechToText = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition || this.elements.speechToText.length === 0) return;

            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR'; // ou a linguagem desejada
            recognition.interimResults = false;
            
            let listening = false;

            this.elements.speechToText.on('click', function () {
                if (!listening) {
                    listening = true
                    recognition.start();
                    $(this).addClass("listening");
                } 

                recognition.onspeechend = () => {
                    $(this).removeClass("listening");
                    listening = false;
                }

                recognition.onresult = event => {
                    $(this).closest('.form-send-message').find('.message-input').val(event.results[0][0].transcript);
                }

                recognition.onerror = () => {
                    console.log("erro")
                    $(this).removeClass("listening");
                    listening = false;
                }
            });
        };

        // Initialize PerfectScrollbar
        initPerfectScrollbar([
            this.elements.chatSidebarLeftBody,
            this.elements.chatSidebarRightBody
        ]);

        // Scroll to the bottom of the chat history
        scrollToBottom();

        // Handle max length for textarea
        const maxLength = parseInt(this.elements.chatSidebarLeftUserAbout.getAttribute('maxlength'), 10);
        handleMaxLengthCount(this.elements.chatSidebarLeftUserAbout, this.elements.textareaInfo, maxLength);

        this.elements.chatSidebarLeftUserAbout.addEventListener('input', () => {
            handleMaxLengthCount(this.elements.chatSidebarLeftUserAbout, this.elements.textareaInfo, maxLength);
        });

        // Attach chat conversation switch event
        this.elements.conversationButton?.addEventListener('click', () => {
            const sidebar = document.querySelector('#app-chat-contacts');
            if (sidebar) {
                sidebar.classList.toggle('show'); // Ou a classe que controla visibilidade
            }
        });

        this._addEventListenerContatoConversa = (item) => {
            item.addEventListener('click', async () => {
                if(item.getAttribute("data-id")) {
                    this.elements.chatContactListItems.forEach(contact => contact.classList.remove('active'));
                    item.classList.add('active');

                    const id_contato = item.getAttribute("data-id");

                    document.getElementById("contato-chat-history-avatar").classList = `flex-shrink-0 avatar ${this.dadosContatos[id_contato] && this.dadosContatos[id_contato].status ? this._avatarStatus(this.dadosContatos[id_contato].status) : ""}`;
                    document.getElementById("contato-chat-history-foto").src = this.dadosContatos[id_contato].foto || "../../assets/images/foto-perfil-light.png";
                    document.getElementById("contato-chat-history-nome").textContent = this.dadosContatos[id_contato].nome;
                    document.getElementById("contato-chat-history-username").textContent = this.dadosContatos[id_contato].usuario;

                    document.getElementById("contato-chat-sidebar-avatar").classList = `avatar avatar-xl ${this._avatarStatus(this.dadosContatos[id_contato].status)} chat-sidebar-avatar`;
                    document.getElementById("contato-chat-sidebar-foto").src = this.dadosContatos[id_contato].foto || "../../assets/images/foto-perfil-light.png";
                    document.getElementById("contato-chat-sidebar-nome").textContent = this.dadosContatos[id_contato].nome;
                    document.getElementById("contato-chat-sidebar-username").textContent = this.dadosContatos[id_contato].usuario;
                    document.getElementById("contato-chat-sidebar-sobre").textContent = this.dadosContatos[id_contato].sobre;

                    if(this.dadosConversas[id_contato]) {
                        this.dadosConversas[id_contato].mensagens_nao_lidas = 0;
                        document.getElementById(`conversa-msg-nao-lida-indicador-${id_contato}`).classList = "chat-contact-list-item-time";
                        document.getElementById(`conversa-msg-nao-lida-qtd-${id_contato}`).textContent = this.dadosConversas[id_contato].mensagens_nao_lidas;
                        document.getElementById(`conversa-msg-nao-lida-qtd-${id_contato}`).style.display = "none"; 
                    }                    

                    document.querySelector(".chat-history").innerHTML = "";

                    // Inicializa paginação e carrega primeiro lote (antes de agora)
                    this.paginacao[id_contato] = { oldestDateLoaded: new Date(), reachedStart: false, isLoading: false, pageSize: 50 };
                    await this._fetchDadosMensagens(id_contato, { limit: 50, before: new Date() });

                    this.contatoAberto = id_contato;

                    document.querySelector(".app-chat-contacts").classList.remove("show");
                    
                    switchToChatConversation();

                    document.querySelector(".message-input")?.focus()

                    scrollToBottom();
                    // Bind infinite scroll para este contato
                    this.elements.chatHistoryBody?.removeEventListener('scroll', this._infiniteScrollHandler);
                    this._infiniteScrollHandler = async () => {
                        if (this.elements.chatHistoryBody.scrollTop < 60) {
                            await this._loadMoreMensagens(id_contato);
                        }
                    };
                    this.elements.chatHistoryBody?.addEventListener('scroll', this._infiniteScrollHandler);
                } 
            }); 
        }

        // Attach chat contact selection event
        this.elements.chatContactListItems.forEach(item => {
            this._addEventListenerContatoConversa(item);
        });   

        // Attach chat search filter event
        this.elements.searchInput?.addEventListener(
            'keyup',
            debounce(e => {
            const searchValue = e.target.value.toLowerCase();
            filterChatContacts('#chat-list li', searchValue, '.chat-list-item-0');
            filterChatContacts('#contact-list li', searchValue, '.contact-list-item-0');
            }, 300)
        );

        console.log(this.elements.formSendMessage)
        // Attach message send event
        document.querySelector(".send-msg-btn")?.addEventListener('click', e => {
            e.preventDefault();

            const message = this.elements.messageInput.value.trim();
            const idElement = uuidv4();
            const data_hora = new Date();

            if (message) {
                const payload = {
                    primeiraMensagem: !this.dadosConversas[this.contatoAberto],
                    to: this.contatoAberto,
                    data_hora: data_hora,
                    conteudo: message,
                    id_element: idElement
                };
                console.log(this.contatoAberto, "contatoAberto")

                console.log(payload, "payload")
                console.log(this.isSocketConnected, "isSocketConnected")
                if (this.isSocketConnected) {
                    this.socket.emit("mensagemEnviada", payload);
                } else {
                    // Enfileira para reenvio quando reconectar
                    this.pendingOutbox.push(payload);
                }

                const listaDeMensagens = document.querySelector(".chat-history");
                const messageLI = document.createElement('li');
                
                const dividers = document.querySelectorAll('div.text-center.my-2.text-muted.fw-bold.small');
                const dividerHje = Array.from(dividers).find(el => el.textContent.includes("Hoje"));

                if(!dividerHje) {
                    const divisor = document.createElement("div");
                    divisor.className = "text-center my-2 text-muted fw-bold small";
                    divisor.textContent = "Hoje";
                    listaDeMensagens.appendChild(divisor);
                }           

                messageLI.classList = "chat-message chat-message-right";
                messageLI.style.setProperty('margin-bottom', '5px', 'important');
                messageLI.innerHTML = `
                    <div class="d-flex overflow-hidden">
                        <div class="chat-message-wrapper flex-grow-1">
                            <div class="chat-message-text">
                                <p class="mb-0">${message}</p>
                                <p class="mb-0" style="width: 100%; display: flex; flex-direction: row; justify-content: flex-end; gap: 4px; margin-top: 3px;">
                                    <small>${this._formatarHoraBrasileira(new Date())}</small>
                                    <i id="indicador-mensagem-${idElement}" class="icon-base bx ${this.isSocketConnected ? 'bx-check' : 'bx-time'}"></i>
                                </p>
                            </div>
                        </div>
                    </div>
                `;

                listaDeMensagens.appendChild(messageLI);

                if(!this.dadosConversas[this.contatoAberto]) {
                    this.dadosConversas[this.contatoAberto] = {
                        id: this.contatoAberto,
                        usuario: this.dadosContatos[this.contatoAberto].usuario,
                        nome: this.dadosContatos[this.contatoAberto].nome,
                        status: this.dadosContatos[this.contatoAberto].status,
                        sobre: this.dadosContatos[this.contatoAberto].sobre,
                        foto: this.dadosContatos[this.contatoAberto].foto || "../../assets/images/foto-perfil-light.png",
                        criado_em: this.dadosContatos[this.contatoAberto].criado_em,
                        assigned_at: new Date(),
                        ultima_mensagem_conteudo: `${message}`,
                        ultima_mensagem_data_hora: new Date(),
                        mensagens_nao_lidas: '0'
                    }

                    const listaDeConversasContainer = document.getElementById("chat-list");

                    const conversaLI = document.createElement("li");
                    conversaLI.classList = "chat-contact-list-item";
                    conversaLI.setAttribute("data-id", this.contatoAberto);
                    conversaLI.innerHTML = `
                        <a class="d-flex align-items-center">
                            <div class="flex-shrink-0 avatar ${this.dadosConversas[this.contatoAberto] && this.dadosConversas[this.contatoAberto].status ? this._avatarStatus(this.dadosConversas[this.contatoAberto].status) : ""}" id="conversa-avatar-${this.contatoAberto}">
                                <img src="${this.dadosConversas[this.contatoAberto].foto || "../../assets/images/foto-perfil-light.png"}" alt="Avatar" class="rounded-circle" style="object-fit: contain;"/>
                            </div>
                            <div class="chat-contact-info flex-grow-1 ms-4">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="chat-contact-name text-truncate m-0 fw-normal">${this.dadosConversas[this.contatoAberto].nome}</h6>
                                    <small id="conversa-msg-nao-lida-indicador-${this.contatoAberto}" class="chat-contact-list-item-time ${this.dadosConversas[this.contatoAberto].mensagens_nao_lidas !== '0' ? "text-success" : ""}">${this.dadosConversas[this.contatoAberto].ultima_mensagem_data_hora? this._formatarHoraBrasileira(this.dadosConversas[this.contatoAberto].ultima_mensagem_data_hora) : ""}</small>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small id="conversa-ultima-msg-conteudo-${this.contatoAberto}" class="chat-contact-status text-truncate">${this.dadosConversas[this.contatoAberto].ultima_mensagem_conteudo ? this.dadosConversas[this.contatoAberto].ultima_mensagem_conteudo : ""}</small>
                                    <small id="conversa-msg-nao-lida-qtd-${this.contatoAberto}" class="chat-contact-list-item-time bg-success" style="color: var(--bs-paper-bg); border-radius: 50%; height: 18px !important; width: 100% !important; max-width: 20px; text-align: center; margin-left: 4px; display: none;"></small>
                                </div>
                            </div>
                        </a>`; 

                    this._addEventListenerContatoConversa(conversaLI);

                    listaDeConversasContainer.appendChild(conversaLI);           
                    
                    document.querySelectorAll(".chat-list-item-0")[1].classList.add("d-none");     

                    this.elements.chatContactListItems = document.querySelectorAll('.chat-contact-list-item:not(.chat-contact-list-item-title)');
                    
                    this.elements.chatContactListItems.forEach(contact => contact.classList.remove('active'));
                    conversaLI.classList.add('active');
                }

                document.getElementById(`conversa-msg-nao-lida-indicador-${this.contatoAberto}`).textContent = this._formatarHoraBrasileira(data_hora)
                document.getElementById(`conversa-msg-nao-lida-indicador-${this.contatoAberto}`).classList = "chat-contact-list-item-time";
                document.getElementById(`conversa-ultima-msg-conteudo-${this.contatoAberto}`).textContent = `${message}`;

                this._moverConversaParaTopo(this.contatoAberto, message, data_hora.toISOString(), 0);

                this.elements.messageInput.value = '';
                scrollToBottom();
            }
        });

        // ! Fix overlay issue for chat sidebar
        this.elements.chatHistoryHeader?.addEventListener('click', () => {
            document.querySelector('.app-chat-sidebar-left .close-sidebar')?.removeAttribute('data-overlay');
        });

        // Initialize speech-to-text
        initSpeechToText();
    }

    _handleSocketActions() {
        this.socket.on('connect', () => {
            console.log("connect")
            this.isSocketConnected = true;
            // Reenvia pendências
            const fila = [...this.pendingOutbox];
            this.pendingOutbox = [];
            fila.forEach(p => this.socket.emit('mensagemEnviada', p));
        });

        this.socket.on('disconnect', () => {
            this.isSocketConnected = false;
        });

        this.socket.on("mensagemRecebida", async (data) => {
            this.socket.emit("mensagemEntregue", {
                contato: data.from,
                idMensagem: data.id,
                idElement: data.id_element
            });

            if(parseInt(this.contatoAberto) === data.from) {
                const listaDeMensagens = document.querySelector(".chat-history");
                const mensagemLI = document.createElement("li");
                mensagemLI.classList = "chat-message";
                mensagemLI.style.setProperty('margin-bottom', '5px', 'important');
                mensagemLI.innerHTML = `
                    <div class="d-flex overflow-hidden">
                        <div class="chat-message-wrapper flex-grow-1">
                            <div class="chat-message-text">
                                <p class="mb-0">${data.conteudo}</p>                                
                                <p class="mb-0" style="width: 100%; display: flex; flex-direction: row; justify-content: flex-end; gap: 4px; margin-top: 3px;">
                                    <small>${this._formatarHoraBrasileira(data.data_hora)}</small>
                                </p>
                            </div>
                        </div>
                    </div>
                `;

                listaDeMensagens.appendChild(mensagemLI);
                
                this.elements.chatHistoryBody?.scrollTo(0, this.elements.chatHistoryBody.scrollHeight);

                document.getElementById(`conversa-msg-nao-lida-indicador-${data.from}`).textContent = this._formatarHoraBrasileira(data.data_hora)
                document.getElementById(`conversa-msg-nao-lida-indicador-${data.from}`).classList = "chat-contact-list-item-time";
                document.getElementById(`conversa-ultima-msg-conteudo-${data.from}`).textContent = data.conteudo;

                this.socket.emit("mensagemLida", {
                    contato: data.from,
                    idMensagem: data.id,
                    idElement: data.id_element
                })
            } else {
                if(!this.dadosConversas[data.from]) {
                    this.dadosConversas[data.from] = {
                        id: data.from,
                        usuario: this.dadosContatos[data.from].usuario,
                        nome: this.dadosContatos[data.from].nome,
                        status: this.dadosContatos[data.from].status,
                        sobre: this.dadosContatos[data.from].sobre,
                        foto: this.dadosContatos[data.from].foto || "../../assets/images/foto-perfil-light.png",
                        criado_em: this.dadosContatos[data.from].criado_em,
                        ultima_mensagem_conteudo: data.conteudo,
                        ultima_mensagem_data_hora: data.data_hora,
                        mensagens_nao_lidas: 0
                    }

                    const listaDeConversasContainer = document.getElementById("chat-list");

                    const conversaLI = document.createElement("li");
                    conversaLI.classList = "chat-contact-list-item";
                    conversaLI.setAttribute("data-id", data.from);
                    conversaLI.innerHTML = `
                        <a class="d-flex align-items-center">
                            <div class="flex-shrink-0 avatar ${this.dadosConversas[data.from] && this.dadosConversas[data.from].status ? this._avatarStatus(this.dadosConversas[data.from].status) : ""}" id="conversa-avatar-${data.from}">
                                <img src="${this.dadosContatos[data.from].foto || "../../assets/images/foto-perfil-light.png"}" alt="Avatar" class="rounded-circle" style="object-fit: contain;"/>
                            </div>
                            <div class="chat-contact-info flex-grow-1 ms-4">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="chat-contact-name text-truncate m-0 fw-normal">${this.dadosConversas[data.from].nome}</h6>
                                    <small id="conversa-msg-nao-lida-indicador-${data.from}" class="chat-contact-list-item-time ${this.dadosConversas[data.from].mensagens_nao_lidas !== '0' ? "text-success" : ""}">${this.dadosConversas[data.from].ultima_mensagem_data_hora? this._formatarHoraBrasileira(this.dadosConversas[data.from].ultima_mensagem_data_hora) : ""}</small>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small id="conversa-ultima-msg-conteudo-${data.from}" class="chat-contact-status text-truncate">${this.dadosConversas[data.from].ultima_mensagem_conteudo ? this.dadosConversas[data.from].ultima_mensagem_conteudo : ""}</small>
                                    <small id="conversa-msg-nao-lida-qtd-${data.from}" class="chat-contact-list-item-time bg-success" style="color: var(--bs-paper-bg); border-radius: 50%; height: 18px !important; width: 100% !important; max-width: 20px; text-align: center; margin-left: 4px; ${this.dadosConversas[data.from].mensagens_nao_lidas !== '0' ? "display: block;" : "display: none;"}">${this.dadosConversas[data.from].mensagens_nao_lidas !== '0' ? this.dadosConversas[data.from].mensagens_nao_lidas : ""}</small>
                                </div>
                            </div>
                        </a>`;

                    this._addEventListenerContatoConversa(conversaLI);

                    listaDeConversasContainer.appendChild(conversaLI);
                    
                    document.querySelectorAll(".chat-list-item-0")[1].classList.add("d-none");     

                    this.elements.chatContactListItems.push(conversaLI)

                    this._moverConversaParaTopo(data.from);
                }

                const toastContainer = document.getElementById("toast-container");

                const novoToast = document.createElement("div");
                novoToast.className = "toast bs-toast animate__animated animate__fadeInRight my-2 bg-primary";
                novoToast.setAttribute("role", "alert");
                novoToast.setAttribute("aria-live", "assertive");
                novoToast.setAttribute("aria-atomic", "true");
                novoToast.setAttribute("data-bs-delay", "1500");

                novoToast.innerHTML = `
                <div class="toast-header">
                    <i class="icon-base bx bx-bell me-2"></i>
                    <div class="me-auto fw-medium">${this.dadosConversas[data.from].nome}</div>
                    <small>${this._formatarHoraBrasileira(data.data_hora)}</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">${data.conteudo}</div>
                `;

                // Adiciona no container
                toastContainer.appendChild(novoToast);

                // Inicializa e exibe
                const toast = new bootstrap.Toast(novoToast);
                toast.show();

                // Remove da DOM quando sumir
                novoToast.addEventListener('hidden.bs.toast', () => {
                    novoToast.remove();
                });

                this.dadosConversas[data.from].mensagens_nao_lidas = Number(this.dadosConversas[data.from].mensagens_nao_lidas) + 1; 
                document.getElementById(`conversa-msg-nao-lida-indicador-${data.from}`).textContent = this._formatarHoraBrasileira(data.data_hora)
                document.getElementById(`conversa-msg-nao-lida-indicador-${data.from}`).classList = "chat-contact-list-item-time text-success";
                document.getElementById(`conversa-ultima-msg-conteudo-${data.from}`).textContent = data.conteudo;
                document.getElementById(`conversa-msg-nao-lida-qtd-${data.from}`).style.display = "block";
                document.getElementById(`conversa-msg-nao-lida-qtd-${data.from}`).textContent = this.dadosConversas[data.from].mensagens_nao_lidas;
            }         

            const mensagensNaoLidas = parseInt(this.contatoAberto) === data.from ? 0 : (Number(this.dadosConversas[data.from]?.mensagens_nao_lidas || 0) + 1);
            // Apenas marca verde se houver não lidas
            const indicador = document.getElementById(`conversa-msg-nao-lida-indicador-${data.from}`);
            indicador.classList = `chat-contact-list-item-time ${mensagensNaoLidas > 0 ? 'text-success' : ''}`;
            this._moverConversaParaTopo(data.from, data.conteudo, data.data_hora, mensagensNaoLidas);
        });

        this.socket.on("editouPerfil", async (data) => {
            document.getElementById(`conversa-avatar-${data.id}`).classList = `flex-shrink-0 avatar ${this._avatarStatus(data.statusAtualizado)}`
            
            this.dadosContatos[data.id].status = data.statusAtualizado
            this.dadosContatos[data.id].sobre = data.sobreAtualizado

            if(parseInt(this.contatoAberto) === data.id) {                
                document.getElementById("contato-chat-history-avatar").classList = `flex-shrink-0 avatar ${this._avatarStatus(data.statusAtualizado)}`;        
                document.getElementById("contato-chat-sidebar-avatar").classList = `avatar avatar-xl ${this._avatarStatus(data.statusAtualizado)} chat-sidebar-avatar`;     
                document.getElementById("contato-chat-sidebar-sobre").textContent = data.sobreAtualizado;   
            }
        });

        this.socket.on("leuMensagem", async (data) => {
            if(parseInt(this.contatoAberto) === data.id) {   
                document.getElementById(`indicador-mensagem-${data.idElement}`).classList = `icon-base bx ${document.getElementById(`indicador-mensagem-${data.idElement}`).classList.contains("bx-check-double") ? "bx-check-double" : "bx-check"} icon-16px text-success`
            }            
        });

        this.socket.on("recebeuMensagem", async (data) => {
            if (parseInt(this.contatoAberto) === data.id) {
                document.getElementById(`indicador-mensagem-${data.idElement}`).classList = `icon-base bx bx-check-double icon-16px ${document.getElementById(`indicador-mensagem-${data.idElement}`).classList.contains("text-success") ? "text-success" : ""}`;
            }
        });
    }

    async _init(canvas) {
        await this._renderCanvas(canvas);

        await this._fetchDadosUsuario();
        await this._fetchDadosContatos();
        await this._fetchDadosConversas();

        this._handleUsuario();
        this._handleContatos();
        this._handleConversas();

        this._initTemplateElements();

        this._handleSocketActions();
    }
}

export default Chat;