'use strict';

import { endpoint } from '../../modulos/variaveisGlobais.js';
import { customAlert, customConfirm, customToast } from  "../../modulos/modals.js";
import { fetchComAutoRefresh } from '../../modulos/fetchComAutoRefresh.js';
import { dictComissoes } from '../../modulos/prefabs.js';

const params = new URLSearchParams(window.location.search);

let id_departamentoPagina;
let tipo_departamentoPagina;
let calendar;

let calendariosParaCollapse = [];
const collapseTodosCalendarios = document.querySelector(".todos-calendarios");


if (window.location.pathname.includes("calendario-geral")) {
  id_departamentoPagina = 0;
  tipo_departamentoPagina = 'GERAL';
} else {
  id_departamentoPagina = params.get("id_departamento");
  tipo_departamentoPagina = params.get("tipo_departamento");
}

const usuarioInfo = JSON.parse(localStorage.getItem("usuarioInfo"));
const depsUsuario = JSON.parse(localStorage.getItem("depsUsuario"));

const departamento = depsUsuario.deps.find(dep => dep.id_departamento === parseInt(id_departamentoPagina));
const cargoUsuarioDep = departamento?.cargo;

const funcaoUsuario = usuarioInfo.Funcao;

const nomeCalendarios = {
  "GERAL_0": "Calendário Geral",
  "COORDENADORIA_1": "Calendário Coordenação - Humanidades",
  "COORDENADORIA_2": "Calendário Coordenação - Integração",
  "COORDENADORIA_3": "Calendário Coordenação - Relações Institucionais",
  "COORDENADORIA_4": "Calendário Coordenação - Temáticas I",
  "COORDENADORIA_5": "Calendário Coordenação - Temáticas II",
  "COMISSOES_35": "Calendário Comissão - Advocacia Criminal",
  "COMISSOES_36": "Calendário Comissão - Assistência Judiciária",
  "COMISSOES_43": "Calendário Comissão - Direito Digital",
  "COMISSOES_50": "Calendário Comissão - Soluções Consensuais de Conflitos",
  "COMISSOES_54": "Calendário Comissão - Direito Urbanístico",
  "COMISSOES_48": "Calendário Comissão - Ética",
  "COMISSOES_41": "Calendário Comissão - Cursos e Palestras",
  "COMISSOES_56": "Calendário Comissão - Meio Ambiente",
  "COMISSOES_44": "Calendário Comissão - Direito Previdenciário",
  "COMISSOES_47": "Calendário Comissão - Esportes",
  "COMISSOES_46": "Calendário Comissão - Direitos Humanos",
  "COMISSOES_53": "Calendário Comissão - Direito Empresarial",
  "COMISSOES_45": "Calendário Comissão - Direitos e Prerrogativas",
  "COMISSOES_49": "Calendário Comissão - Eventos",
  "COMISSOES_55": "Calendário Comissão - Jovem Advocacia",
  "COMISSOES_39": "Calendário Comissão - Assuntos Institucionais",
  "COMISSOES_57": "Calendário Comissão - OAB Vai à Escola",
  "COMISSOES_40": "Calendário Comissão - Convênios e Parcerias",
  "COMISSOES_38": "Calendário Comissão - Mulher Advogada",
  "COMISSOES_51": "Calendário Comissão - Direito de Família e Sucessões",
  "COMISSOES_42": "Calendário Comissão - Defesa dos Direitos dos Animais",
  "COMISSOES_52": "Calendário Comissão - Direito do Trânsito",
  "COMISSOES_37": "Calendário Comissão - Igualdade Racial"
};

const todasComissoes = {
  "Advocacia Criminal": "COMISSÃO DA ADVOCACIA CRIMINAL",
  "Assistência Judiciária": "COMISSÃO DA ASSISTÊNCIA JUDICIÁRIA",
  "Direito Urbanístico": "COMISSÃO DO DIREITO URBANÍSTICO",
  "Direito Digital": "COMISSÃO DE DIREITO DIGITAL",
  "Soluções Consensuais de Conflitos": "COMISSÃO DE SOLUÇÕES CONSENSUAIS DE CONFLITOS",
  "Ética": "COMISSÃO DE ÉTICA",
  "Cursos e Palestras": "COMISSÃO DE CURSOS E PALESTRAS",
  "Meio Ambiente": "COMISSÃO DO MEIO AMBIENTE",
  "Direito Previdenciário": "COMISSÃO DE DIREITO PREVIDENCIÁRIO",
  "Esportes": "COMISSÃO DE ESPORTES",
  "Direitos Humanos": "COMISSÃO DE DIREITOS HUMANOS",
  "Direito Empresarial": "COMISSÃO DO DIREITO EMPRESARIAL",
  "Direitos e Prerrogativas": "COMISSÃO DE DIREITOS E PRERROGATIVAS",
  "Eventos": "COMISSÃO DE EVENTOS",
  "Jovem Advocacia": "COMISSÃO DA JOVEM ADVOCACIA",
  "Assuntos Institucionais": "COMISSÃO DE ASSUNTOS INSTITUCIONAIS",
  "OAB Vai à Escola": "COMISSÃO OAB VAI À ESCOLA",
  "Convênios e Parcerias": "COMISSÃO DE CONVÊNIOS E PARCERIAS",
  "Mulher Advogada": "COMISSÃO DA MULHER ADVOGADA",
  "Direito da Família e Sucessões": "COMISSÃO DIREITO DE FAMÍLIA E SUCESSÕES",
  "Direito e Defesa dos Animais": "COMISSÃO DE DEFESA DOS DIREITOS DOS ANIMAIS",
  "Direito do Trânsito": "COMISSÃO DO DIREITO DO TRÂNSITO",
  "Igualdade Racial": "COMISSÃO DA IGUALDADE RACIAL"
};

const id_departamento = id_departamentoPagina;
const tipo_departamento = tipo_departamentoPagina;

const chave = `${tipo_departamento.toUpperCase()}_${id_departamento}`;
const nomeDoCalendario = nomeCalendarios[chave] || "Calendário do Departamento";

const h4 = document.getElementById("h4-calendario");
h4.textContent = nomeDoCalendario;

const telaCarregamento = document.getElementById("div-carregando-fundo");

async function carregarEventos(calendarioExtra = null) {
  try {
    telaCarregamento.style.display = "flex";

    const response = await fetchComAutoRefresh(endpoint + `/api/oab/calendario/carregarEventos?id_departamento=${id_departamento}&tipo_departamento=${tipo_departamento}`, {
      method: 'GET', 
      credentials: 'include'
    }, "../..");

    const data = await response.json();

    if (!response.ok || data.status !== "SUCCESS") {
      window.events = [];

      customToast(data.message || `Erro ao carregar os eventos do departamento.`);
      return;
    }   

    if (data.payload.length === 0) {
      window.events = [];

      customToast(data.message || `Nenhum evento encontrado.`);
      return;
    }

    window.events = data.payload.map(evento => {
      const start = new Date(evento.data_inicio);
      const end = new Date(evento.data_fim);
      
      return {
        id: evento.id,
        url: evento.url,
        title: evento.titulo,
        start: start,
        end: (start.getTime() === end.getTime()) ? null : end, 
        allDay: Boolean(evento.all_day),
        
        extendedProps: {
          id_departamento: evento.id_departamento,
          tipo_departamento: evento.tipo_departamento,
          calendar: evento.categoria.toString(),
          id_tipo_evento: evento.id_tipo_evento,
          localizacao: evento.localizacao,
          descricao: evento.descricao
        }
      };
    });
  } catch (err) {
      console.log('Erro ao carregar os eventos do departamento: ', err);
  } finally {        
      telaCarregamento.style.display = "none";
  }   
}

async function adicionarEvento(body) {
  try {
    telaCarregamento.style.display = "flex";

    const response = await fetchComAutoRefresh(endpoint + `/api/oab/calendario/adicionarEvento`, {
      method: 'POST', 
      credentials: 'include',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }, "../..");

    const data = await response.json();

    if (!response.ok || data.status !== "SUCCESS") {
      customAlert(data.message || `Erro ao adicionar o evento.`);
      return data;
    } else {      
      customAlert(data.message || `Sucesso ao adicionar o evento.`);
      return data;
    }
  } catch (err) {
      console.log('Erro ao adicionar o evento: ', err);
  } finally {        
      telaCarregamento.style.display = "none";
  }   
}

async function atualizarEvento(body) {
  try {
    telaCarregamento.style.display = "flex";

    const response = await fetchComAutoRefresh(endpoint + `/api/oab/calendario/atualizarEvento`, {
      method: 'POST', 
      credentials: 'include',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }, "../..");

    const data = await response.json();

    if (!response.ok || data.status !== "SUCCESS") {
      customAlert(data.message || `Erro ao atualizar o evento.`);
      return data;
    } else {      
      customAlert(data.message || `Sucesso ao atualizar o evento.`);
      return data;
    }
  } catch (err) {
      console.log('Erro ao atualizar o evento: ', err);
  } finally {        
      telaCarregamento.style.display = "none";
  }   
}

async function deletarEvento(id) {
  try {
    telaCarregamento.style.display = "flex";

    const response = await fetchComAutoRefresh(endpoint + `/api/oab/calendario/apagarEvento`, {
      method: 'DELETE', 
      credentials: 'include',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: id })
    }, "../..");

    const data = await response.json();

    if (!response.ok || data.status !== "SUCCESS") {
      customAlert(data.message || `Erro ao apagar o evento.`);
      return data;
    } else {      
      customAlert(data.message || `Sucesso ao apagar o evento.`);
      return data;
    }
  } catch (err) {
      console.log('Erro ao apagar o evento: ', err);
  } finally {        
      telaCarregamento.style.display = "none";
  }   
}

async function carregarEventosOutroCalendario(id_departamento, tipo_departamento) {
  try {
    telaCarregamento.style.display = "flex";

    const response = await fetchComAutoRefresh(endpoint + `/api/oab/calendario/carregarEventosOutroCalendario?id_departamento=${id_departamento}&tipo_departamento=${tipo_departamento}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },  
    });

    const data = await response.json();

    if (!response.ok || data.status !== "SUCCESS") {
      customAlert(data.message || `Erro ao carregar os eventos do outro calendário.`);
      return null;
    }

    return data.payload;
  } catch (err) {
    console.log('Erro ao carregar os eventos do outro calendário: ', err);
  } finally {
    telaCarregamento.style.display = "none";
  }
}

let ehResponsavel = false;

document.addEventListener('DOMContentLoaded', async function () {
  const linkAtivo = document.getElementById(`${tipo_departamentoPagina}_${id_departamentoPagina}`);

  let nomeDaPagina;
  
  if (linkAtivo) {
    // Para os links de calendário, o nome está no texto do link
    nomeDaPagina = linkAtivo.textContent.trim();
  } 

  const btnAddEvent = document.getElementById("btn-add-event");
  console.log(tipo_departamentoPagina)

  switch (tipo_departamentoPagina) {
    case "GERAL":
      if (funcaoUsuario !== "USER" && funcaoUsuario !== "HEAD") {
        ehResponsavel = true;
      }
      break;
    case "COMISSOES":
      if (funcaoUsuario !== "USER" || (cargoUsuarioDep !== "MEMBRO DE COMISSÃO")) {
        ehResponsavel = true;
      }
      break;
    case "DIRETORIA":
      if (cargoUsuarioDep === "DIRETOR") {
        ehResponsavel = true;
      }
      break;
    case "COORDENADORIA":
      if (cargoUsuarioDep === "COORDENADOR") {
        ehResponsavel = true;
      }
      break;
    case "DEFENSORIA PUBLICA":
      /* cargoUsuarioDep !== "CONVENIADO" tem que fazer um administrador da defensoria*/
      if ( funcaoUsuario !== "USER" && funcaoUsuario !== "HEAD") {
        ehResponsavel = true;
      }
      break;
    default: 
      break;
  }

  if (ehResponsavel) {
    btnAddEvent.classList.remove("d-none");
    customToast("Você pode editar e adicionar eventos nesse calendário.");
  }

  await carregarEventos()

  const selectCalendario = document.getElementById("select-calendario-extra");
  if (selectCalendario) {
    selectCalendario.addEventListener("change", async function () {
      const id_departamento = selectCalendario.value;
      const tipo_departamento = selectCalendario.options[selectCalendario.selectedIndex].dataset.tipodepartamento;

      const novosEventos = await carregarEventosOutroCalendario(id_departamento, tipo_departamento);

      if (novosEventos) {
        if (novosEventos.length > 0) {
          for (const evento of novosEventos) {
            const start = new Date(evento.data_inicio);
            const end = new Date(evento.data_fim);
            
            window.events.push({
                id: evento.id,
                url: evento.url,
                title: evento.titulo,
                start: start,
                end: (start.getTime() === end.getTime()) ? null : end, 
                allDay: Boolean(evento.all_day),
                extendedProps: {
                  id_departamento: evento.id_departamento,
                  tipo_departamento: evento.tipo_departamento,
                  calendar: evento.categoria.toString(),
                  id_tipo_evento: evento.id_tipo_evento,
                  localizacao: evento.localizacao,
                  descricao: evento.descricao
                }
            });
          }
          calendar.refetchEvents();
        } else {
          customToast("Nenhum evento encontrado no outro calendário.");
        }
      } else {
        customToast("Erro ao carregar os eventos do outro calendário.");
      }

    });
  }

  const isRtl = false;

  const direction = isRtl ? 'rtl' : 'ltr';
  (function () {
    const calendarEl = document.getElementById('calendar');
    const appCalendarSidebar = document.querySelector('.app-calendar-sidebar');
    const addEventSidebar = document.getElementById('addEventSidebar');
    const appOverlay = document.querySelector('.app-overlay');
    const offcanvasTitle = document.querySelector('.offcanvas-title');
    const btnToggleSidebar = document.querySelector('.btn-toggle-sidebar');
    const btnSubmit = document.getElementById('addEventBtn');
    const btnDeleteEvent = document.querySelector('.btn-delete-event');
    const btnCancel = document.querySelector('.btn-cancel');
    const eventTitle = document.getElementById('eventTitle');
    const eventTipoEvento = document.getElementById('eventTipoEvento');
    const eventStartDate = document.getElementById('eventStartDate');
    const eventEndDate = document.getElementById('eventEndDate');
    const eventUrl = document.getElementById('eventURL');
    const eventLocation = document.getElementById('eventLocation');
    const eventDescription = document.getElementById('eventDescription');
    const allDaySwitch = document.querySelector('.allDay-switch');
    const selectAll = document.querySelector('.select-all');
    const filterInputs = Array.from(document.querySelectorAll('.input-filter'));
    const inlineCalendar = document.querySelector('.inline-calendar');

    const calendarColors = {
      "1": "primary",     // Comissão
      "2": "danger",      // Coordenadoria
      "3": "warning",     // Diretoria
      "4": "success"      // Eventos Gerais
    };

    // External jQuery Elements
    const eventLabel = $('#eventLabel'); // ! Using jQuery vars due to select2 jQuery dependency
    const eventGuests = $('#eventGuests'); // ! Using jQuery vars due to select2 jQuery dependency

    // Event Data
    let currentEvents = window.events; // Assuming events are imported from app-calendar-events.js
    let isFormValid = false;
    let eventToUpdate = null;
    let inlineCalInstance = null;

    // Offcanvas Instance
    let bsAddEventSidebar = null;
    if (addEventSidebar) {
      bsAddEventSidebar = new bootstrap.Offcanvas(addEventSidebar);
    }

    //! TODO: Update Event label and guest code to JS once select removes jQuery dependency
    // Initialize Select2 with custom templates
    if (eventLabel.length) {
      function renderBadges(option) {
        if (!option.id) {
          return option.text;
        }
        var $badge =
          "<span class='badge badge-dot bg-" + $(option.element).data('label') + " me-2'> " + '</span>' + option.text;

        return $badge;
      }
      eventLabel.wrap('<div class="position-relative"></div>').select2({
        placeholder: 'Select value',
        dropdownParent: eventLabel.parent(),
        templateResult: renderBadges,
        templateSelection: renderBadges,
        minimumResultsForSearch: -1,
        escapeMarkup: function (es) {
          return es;
        }
      });
    }

    // Render guest avatars
    if (eventGuests.length) {
      function renderGuestAvatar(option) {
        if (!option.id) return option.text;
        return `
    <div class='d-flex flex-wrap align-items-center'>
      <div class='avatar avatar-xs me-2'>
        <img src='${assetsPath}img/avatars/${$(option.element).data('avatar')}'
          alt='avatar' class='rounded-circle' />
      </div>
      ${option.text}
    </div>`;
      }
      eventGuests.wrap('<div class="position-relative"></div>').select2({
        placeholder: 'Select value',
        dropdownParent: eventGuests.parent(),
        closeOnSelect: false,
        templateResult: renderGuestAvatar,
        templateSelection: renderGuestAvatar,
        escapeMarkup: function (es) {
          return es;
        }
      });
    }

    // Event start (flatpicker)
    if (eventStartDate) {
      var start = eventStartDate.flatpickr({
        locale: 'pt', // define o idioma
        dateFormat: 'd/m/Y H:i', // formato brasileiro: 08/07/2025 10:30
        enableTime: true,
        time_24hr: true,
        altInput: true,
        altFormat: 'd/m/Y H:i',
        monthSelectorType: 'static',
        static: true,
        onReady: function (selectedDates, dateStr, instance) {
          if (instance.isMobile) {
            instance.mobileInput.setAttribute('step', null);
          }
        }
      });
    }

    // Event end (flatpicker)
    if (eventEndDate) {
      var end = eventEndDate.flatpickr({
        locale: 'pt', // define o idioma
        dateFormat: 'd/m/Y H:i',
        enableTime: true,
        time_24hr: true,
        altInput: true,
        altFormat: 'd/m/Y H:i',
        monthSelectorType: 'static',
        static: true,
        onReady: function (selectedDates, dateStr, instance) {
          if (instance.isMobile) {
            instance.mobileInput.setAttribute('step', null);
          }
        }
      });
    }

    // Inline sidebar calendar (flatpicker)
    if (inlineCalendar) {
      inlineCalInstance = inlineCalendar.flatpickr({
        locale: 'pt',              
        dateFormat: 'd/m/Y',      
        altFormat: 'd/m/Y',         
        inline: true,              
        static: true,
        monthSelectorType: 'static'
      });
    }

    // Event click function
    function eventClick(info) {
      eventToUpdate = info.event;

      if ((eventToUpdate.extendedProps.id_departamento !== id_departamentoPagina && eventToUpdate.extendedProps.tipo_departamento !== tipo_departamentoPagina) 
        || ((eventToUpdate.extendedProps.id_departamento === 0 || eventToUpdate.extendedProps.tipo_departamento === "GERAL") && funcaoUsuario === "USER")){
        document.getElementById("editar-evento").style.display = "none";
      } else {
        document.getElementById("editar-evento").style.display = "inline-flex";
      }
      
      if (eventToUpdate.url) {
        info.jsEvent.preventDefault();
      }

      const categorias = {
        1: "Comissão",
        2: "Coordenadoria",
        3: "Diretoria",
        4: "Eventos Gerais",
      }

      const tiposEvento = {
        1: "Reunião",
        2: "Palestra",
        3: "Curso",
        4: "Seminário",
        5: "Festa",
        6: "Comemoração",
        7: "Simpósio",
        8: "Painel",
        9: "Treinamento",
      }

      const dataInicio = new Date(eventToUpdate.start);
      const dataFormatadaInicio = dataInicio.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      const dataFim = new Date(eventToUpdate.end);
      const dataFormatadaFim = dataFim.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      document.getElementById("evento-titulo").innerText = eventToUpdate.title || "Nenhum";
      document.getElementById("evento-link").href = (eventToUpdate.url && eventToUpdate.url !== "null") ? eventToUpdate.url : "Nenhum";
      document.getElementById("evento-link").innerText = (eventToUpdate.url && eventToUpdate.url !== "null") ? eventToUpdate.url : "Nenhum";
      document.getElementById("evento-inicio").innerText = dataFormatadaInicio || "Nenhuma";
      document.getElementById("evento-fim").innerText = dataFormatadaFim || "Nenhuma";
      document.getElementById("evento-categoria").innerText = categorias[eventToUpdate.extendedProps.calendar] || "Nenhuma"
      document.getElementById("evento-tipo-evento").innerText = tiposEvento[eventToUpdate.extendedProps.id_tipo_evento] || "Nenhum"
      document.getElementById("evento-localizacao").innerText = eventToUpdate.extendedProps.localizacao || eventToUpdate.extendedProps.location || "Nenhuma";
      document.getElementById("evento-descricao").innerText = eventToUpdate.extendedProps.descricao || eventToUpdate.extendedProps.description || "Nenhuma";
      document.getElementById("evento-allday").innerText = (eventToUpdate.allDay === true) ? "Sim" : "Não";
      
      const modal = new bootstrap.Modal(document.getElementById('viewEventInfo'));
      modal.show();

      document.getElementById("editar-evento").onclick = function (event) {
        bsAddEventSidebar.show();

        if (offcanvasTitle) {
          offcanvasTitle.innerHTML = 'Atualizar Evento';
        }

        btnSubmit.innerHTML = 'Atualizar';

        btnSubmit.classList.add('btn-update-event');
        btnSubmit.classList.remove('btn-add-event');
        btnDeleteEvent.classList.remove('d-none');
        document.querySelector(".add-outros-calendarios").style.display = "none";

        eventTitle.value = eventToUpdate.title || "";
        eventUrl.value = (eventToUpdate.url && eventToUpdate.url !== "null") ? eventToUpdate.url : "";

        start.setDate(eventToUpdate.start);
        end.setDate(eventToUpdate.end);

        allDaySwitch.checked = Boolean(eventToUpdate.allDay);

        eventLocation.value = eventToUpdate.extendedProps.localizacao || eventToUpdate.extendedProps.location || "";
        eventDescription.value = eventToUpdate.extendedProps.descricao || eventToUpdate.extendedProps.description || "";
        eventLabel.val(eventToUpdate.extendedProps.calendar || "").trigger('change');
      };
    }

    // Modify sidebar toggler
    function modifyToggler() {
      const fcSidebarToggleButton = document.querySelector('.fc-sidebarToggle-button');
      fcSidebarToggleButton.classList.remove('fc-button-primary');
      fcSidebarToggleButton.classList.add('d-lg-none', 'd-inline-block', 'ps-0');
      while (fcSidebarToggleButton.firstChild) {
        fcSidebarToggleButton.firstChild.remove();
      }
      fcSidebarToggleButton.setAttribute('data-bs-toggle', 'sidebar');
      fcSidebarToggleButton.setAttribute('data-overlay', '');
      fcSidebarToggleButton.setAttribute('data-target', '#app-calendar-sidebar');
      fcSidebarToggleButton.insertAdjacentHTML(
        'beforeend',
        '<i class="icon-base bx bx-menu icon-lg text-heading"></i>'
      );
    }

    // Filter events by calender
    function selectedCalendars() {
      let selected = [],
        filterInputChecked = [].slice.call(document.querySelectorAll('.input-filter:checked'));

      filterInputChecked.forEach(item => {
        selected.push(item.getAttribute('data-value'));
      });

      return selected;
    }

    // --------------------------------------------------------------------------------------------------
    // AXIOS: fetchEvents
    // * This will be called by fullCalendar to fetch events. Also this can be used to refetch events.
    // --------------------------------------------------------------------------------------------------
    function fetchEvents(info, successCallback) {
      let calendars = selectedCalendars();
      let selectedEvents = currentEvents.filter(event => calendars.includes(event.extendedProps.calendar.toString()));
      successCallback(selectedEvents);
    }

    // Init FullCalendar
    // ------------------------------------------------
    calendar = new Calendar(calendarEl, {
      locale: 'pt-br',
      initialView: 'dayGridMonth',
      datesSet: function () {
        modifyToggler();

        const fcHeader = document.querySelector(".fc-header-toolbar");

        if (fcHeader && !fcHeader.querySelector(".dropdown")) {
          const dropdown = document.createElement("div");
          dropdown.className = "dropdown dropdown-dates-set";
          dropdown.innerHTML = `
            <button class="btn-dropdown btn btn-icon p-0" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="icon-base bx bx-dots-vertical-rounded icon-md"></i>
            </button>
            <div class="dropdown-menu dropdown-menu-end" style="z-index: 999999999999">
                <a class="dropdown-item fc-dayGridMonth-button" href="#">Mês</a>
                <a class="dropdown-item fc-timeGridWeek-button" href="#">Semana</a>
                <a class="dropdown-item fc-timeGridDay-button" href="#">Dia</a>
                <a class="dropdown-item fc-listMonth-button" href="#">Lista</a>
            </div>
          `;

          fcHeader.appendChild(dropdown);

          dropdown.querySelector('.fc-dayGridMonth-button')
            .addEventListener('click', () => calendar.changeView('dayGridMonth'));

          dropdown.querySelector('.fc-timeGridWeek-button')
            .addEventListener('click', () => calendar.changeView('timeGridWeek'));

          dropdown.querySelector('.fc-timeGridDay-button')
            .addEventListener('click', () => calendar.changeView('timeGridDay'));

          dropdown.querySelector('.fc-listMonth-button')
            .addEventListener('click', () => calendar.changeView('listMonth'));
        }
      },
      events: fetchEvents,
      plugins: [dayGridPlugin, interactionPlugin, listPlugin, timegridPlugin],
      editable: true,
      dragScroll: true,
      dayMaxEvents: 2,
      eventResizableFromStart: true,
      customButtons: {
        sidebarToggle: {
          text: 'Menu'
        }
      },
      headerToolbar: {
        start: 'sidebarToggle, prev,next, title',
        end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      },
      buttonText: {
        today:    'Hoje',
        month:    'Mês',
        week:     'Semana',
        day:      'Dia',
        list:     'Lista'
      },
      direction: direction,
      initialDate: new Date(),
      navLinks: true, // can click day/week names to navigate views
      eventClassNames: function ({ event: calendarEvent }) {
        const colorName = calendarColors[calendarEvent._def.extendedProps.calendar.toString()];
        return ['bg-label-' + colorName];
      },
      dateClick: function (info) {
        if (funcaoUsuario === "USER") { // TODO DEFINIR SE MEMBRO DE COMISSÃO PODE ADICIONAR EVENTOS
          return;
        }
        let date = moment(info.date).format('DD-MM-YYYY');
        resetValues();
        bsAddEventSidebar.show();

        // For new event set offcanvas title text: Add Event
        if (offcanvasTitle) {
          offcanvasTitle.innerHTML = 'Adicionar Evento';
        }
        btnSubmit.innerHTML = 'Adicionar';
        btnSubmit.classList.remove('btn-update-event');
        btnSubmit.classList.add('btn-add-event');
        btnDeleteEvent.classList.add('d-none');
        eventStartDate.value = date;
        eventEndDate.value = date;
      },
      eventClick: function (info) {
        eventClick(info);
      },
      viewDidMount: function () {
        modifyToggler();
      },
      eventDrop: async function (info) {
        const updatedEvent = info.event;

        const eventData = {
          id: updatedEvent.id,
          title: updatedEvent.title,
          start: updatedEvent.start,
          end: updatedEvent.end,
          url: updatedEvent.url,
          allDay: updatedEvent.allDay,
          extendedProps: {
            id_departamento: updatedEvent.extendedProps.id_departamento,
            tipo_departamento: updatedEvent.extendedProps.tipo_departamento,
            calendar: updatedEvent.extendedProps.calendar,
            id_tipo_evento: updatedEvent.extendedProps.id_tipo_evento,
            location: updatedEvent.extendedProps.localizacao,
            description: updatedEvent.extendedProps.descricao
          }
        };

        let propsToUpdate = ['title', 'url'];
        let extendedPropsToUpdate = ['calendar', 'location', 'description'];

        updateEventInCalendar(eventData, propsToUpdate, extendedPropsToUpdate);

        await carregarEventos();
        currentEvents = window.events;
        calendar.refetchEvents();
      }
    });

    // Render calendar
    calendar.render();
    // Modify sidebar toggler
    modifyToggler();

    const eventForm = document.getElementById('eventForm');
    const fv = FormValidation.formValidation(eventForm, {
      fields: {
        eventTitle: {
          validators: {
            notEmpty: {
              message: 'Por favor insira o título do evento '
            }
          }
        },
        eventStartDate: {
          validators: {
            notEmpty: {
              message: 'Por favor insira a data de inicio '
            }
          }
        },
        eventEndDate: {
          validators: {
            notEmpty: {
              message: 'Por favor insira a data de fim '
            }
          }
        }
      },
      plugins: {
        trigger: new FormValidation.plugins.Trigger(),
        bootstrap5: new FormValidation.plugins.Bootstrap5({
          // Use this for enabling/changing valid/invalid class
          eleValidClass: '',
          rowSelector: function (field, ele) {
            // field is the field name & ele is the field element
            return '.form-control-validation';
          }
        }),
        submitButton: new FormValidation.plugins.SubmitButton(),
        // Submit the form when all fields are valid
        // defaultSubmit: new FormValidation.plugins.DefaultSubmit(),
        autoFocus: new FormValidation.plugins.AutoFocus()
      }
    })
      .on('core.form.valid', function () {
        // Jump to the next step when all fields in the current step are valid
        isFormValid = true;
      })
      .on('core.form.invalid', function () {
        // if fields are invalid
        isFormValid = false;
      });

    // Sidebar Toggle Btn
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', async (e) => {
        // Hide left sidebar if the right sidebar is open
        if (offcanvasTitle) {
          offcanvasTitle.innerHTML = 'Adicionar Evento';
        }
        btnSubmit.innerHTML = 'Adicionar';
        btnSubmit.classList.remove('btn-update-event');
        btnSubmit.classList.add('btn-add-event');
        btnDeleteEvent.classList.add('d-none');
        appCalendarSidebar.classList.remove('show');
        appOverlay.classList.remove('show');
        btnCancel.classList.remove('d-none');

        console.log(calendariosParaCollapse)
                
        if (calendariosParaCollapse.length === 0) {
  
          document.getElementById("div-carregando-fundo").style.display = "flex";
  
          const response = await fetchComAutoRefresh(endpoint + '/api/oab/calendario/carregarCalendarios', {
              method: 'GET',
              credentials: 'include',
              headers: {
                  'Content-Type': 'application/json',
              },
          });
          
          const data = await response.json();
          console.log(data)
  
          telaCarregamento.style.display = "none";
  
          if (response.ok) {
              
              calendariosParaCollapse = data.payload;
  
              calendariosParaCollapse.forEach(calendario => {
                collapseTodosCalendarios.innerHTML += `
                  <label class="switch col-12 d-flex align-items-center p-2">
                    <input type="checkbox" class="switch-input add-outro-calendario" data-id="${calendario.id_departamento}" data-tipo="${calendario.tipo_departamento}" data-nome="${calendario.nome_departamento}" />
                    <span class="switch-toggle-slider">
                      <span class="switch-on">
                        <i class="icon-base bx bx-check"></i>
                      </span>
                      <span class="switch-off">
                        <i class="icon-base bx bx-x"></i>
                      </span>
                    </span>
                    <span class="switch-label">${calendario.nome_departamento}</span>
                  </label>
                `;
              });
          } else {
            collapseTodosCalendarios.innerHTML += `
              <label class="switch col-12 d-flex align-items-center p-2">
                Erro ao buscar os calendarios...
              </label>
            `;
          }
        }
      });
    }

    function parseBrDateTimeToDate(str) {
      const [datePart, timePart] = str.split(' ');
      const [day, month, year] = datePart.split('/');
      return new Date(`${year}-${month}-${day}T${timePart}:00`);
    }

    // Add Event
    // ------------------------------------------------
    async function addEvent(eventData) {
      const selecionados = Array.from(
        collapseTodosCalendarios.querySelectorAll('input[type="checkbox"].add-outro-calendario:checked')
      ).map(checkbox => ({
        id: parseInt(checkbox.dataset.id, 10),
        tipo: checkbox.dataset.tipo,
        nome: checkbox.dataset.nome
      }));

      const body = {
        tipo_departamento: tipo_departamento,
        id_departamento: id_departamento,
        id_tipo_evento: eventData.extendedProps.id_tipo_evento,
        titulo: eventData.title,
        categoria: eventData.extendedProps.calendar,
        data_inicio: parseBrDateTimeToDate(eventData.start),
        data_fim: parseBrDateTimeToDate(eventData.end),
        all_day: eventData.allDay,
        url: eventData.url,
        localizacao: eventData.extendedProps.location,
        descricao: eventData.extendedProps.description,
        addEmOutrosCalendarios: selecionados,
        nomeDepartamentoOrigem: departamento.nome_departamento
      }   

      const response = await adicionarEvento(body);

      if (response?.status === "SUCCESS") {
        const novoEvento = {
          id: response.payload.id,
          title: eventData.title,
          start: parseBrDateTimeToDate(eventData.start),
          end: parseBrDateTimeToDate(eventData.end),
          allDay: eventData.allDay,
          url: eventData.url,
          extendedProps: {
            id_departamento: id_departamento,
            tipo_departamento: tipo_departamento,
            calendar: eventData.extendedProps.calendar,
            location: eventData.extendedProps.location,
            description: eventData.extendedProps.description,
            id_tipo_evento: eventData.extendedProps.id_tipo_evento
          }
        };

        currentEvents.push(novoEvento);
        calendar.refetchEvents(); 
      }
    }

    // Update Event
    // ------------------------------------------------
    async function updateEvent(eventData) {
      const body = {
        id: parseInt(eventData.id),
        tipo_departamento: tipo_departamento,
        id_departamento: id_departamento,
        id_tipo_evento: eventData.extendedProps.id_tipo_evento,
        titulo: eventData.title,
        categoria: eventData.extendedProps.calendar,
        data_inicio: parseBrDateTimeToDate(eventData.start),
        data_fim: parseBrDateTimeToDate(eventData.end),
        all_day: eventData.allDay,
        url: eventData.url,
        localizacao: eventData.extendedProps.location,
        descricao: eventData.extendedProps.description 
      }     

      const response = await atualizarEvento(body);

      if (response?.status === "SUCCESS") {
        
        const index = currentEvents.findIndex(ev => ev.id == eventData.id);
        if (index !== -1) {
          currentEvents[index] = {
            ...currentEvents[index],
            title: eventData.title,
            start: parseBrDateTimeToDate(eventData.start),
            end: parseBrDateTimeToDate(eventData.end),
            allDay: eventData.allDay,
            url: eventData.url,
            extendedProps: {
              
              calendar: eventData.extendedProps.calendar,
              location: eventData.extendedProps.location,
              description: eventData.extendedProps.description
            }
          };
        }

        calendar.refetchEvents();
      }
    }

    // Remove Event
    // ------------------------------------------------
    async function removeEvent(eventId) {
      const response = await deletarEvento(eventId);

      if (response?.status === "SUCCESS") {
        currentEvents = currentEvents.filter(ev => ev.id != eventId);
        calendar.refetchEvents();
      }
    }

    // (Update Event In Calendar (UI Only)
    // ------------------------------------------------
    const updateEventInCalendar = async (updatedEventData, propsToUpdate, extendedPropsToUpdate) => {
      const body = {
        id: parseInt(updatedEventData.id),
        tipo_departamento: tipo_departamento,
        id_departamento: id_departamento,
        titulo: updatedEventData.title,
        categoria: updatedEventData.extendedProps.calendar,
        id_tipo_evento: updatedEventData.extendedProps.id_tipo_evento,
        data_inicio: updatedEventData.start,
        data_fim: updatedEventData.end,
        all_day: updatedEventData.allDay,
        url: updatedEventData.url,
        localizacao: updatedEventData.extendedProps.location,
        descricao: updatedEventData.extendedProps.description
      };

      // Atualiza no banco de dados
      const response = await atualizarEvento(body);
      if (response?.status !== "SUCCESS") return;

      // Atualiza localmente na lista de eventos (se estiver usando um array como cache)
      const index = currentEvents.findIndex(ev => ev.id == updatedEventData.id);
      if (index !== -1) {
        currentEvents[index] = {
          ...currentEvents[index],
          ...updatedEventData
        };
      }

      // Atualiza visualmente no calendário
      const existingEvent = calendar.getEventById(updatedEventData.id);
      if (!existingEvent) return;

      // Propriedades principais (title, url, etc.)
      for (let i = 0; i < propsToUpdate.length; i++) {
        existingEvent.setProp(propsToUpdate[i], updatedEventData[propsToUpdate[i]]);
      }

      // Datas (start e end)
      existingEvent.setDates(updatedEventData.start, updatedEventData.end, {
        allDay: updatedEventData.allDay
      });

      // Extended props (como descricao e localizacao)
      for (let i = 0; i < extendedPropsToUpdate.length; i++) {
        const key = extendedPropsToUpdate[i];
        const value = updatedEventData.extendedProps[key];

        // Atualiza visual no calendário
        existingEvent.setExtendedProp(key, value);

        // Força sincronização no objeto interno do FullCalendar
        existingEvent.extendedProps[key] = value;
      }
    };

    // Remove Event In Calendar (UI Only)
    // ------------------------------------------------
    function removeEventInCalendar(eventId) {
      calendar.getEventById(eventId).remove();
    }

    // Add new event
    // ------------------------------------------------
    btnSubmit.addEventListener('click', e => {
      if (btnSubmit.classList.contains('btn-add-event')) {        
        if (isFormValid) {
          let newEvent = {
            id: calendar.getEvents().length + 1,
            title: eventTitle.value,
            start: eventStartDate.value,
            end: eventEndDate.value,
            startStr: eventStartDate.value,
            endStr: eventEndDate.value,
            display: 'block',
            extendedProps: {
              id_departamento: id_departamento,
              tipo_departamento: tipo_departamento,
              location: eventLocation.value,
              guests: eventGuests.val(),
              id_tipo_evento: eventTipoEvento.value,
              calendar: eventLabel.val(),
              description: eventDescription.value
            }
          };
          if (eventUrl.value) {
            newEvent.url = eventUrl.value;
          }
          if (allDaySwitch.checked) {
            newEvent.allDay = true;
          }
          addEvent(newEvent);
          bsAddEventSidebar.hide();
        }
      } else {
        if (isFormValid) {
          let eventData = {
            id: eventToUpdate.id,
            title: eventTitle.value,
            start: eventStartDate.value,
            end: eventEndDate.value,
            url: eventUrl.value,
            extendedProps: {
              id_departamento: id_departamento,
              tipo_departamento: tipo_departamento,
              location: eventLocation.value,
              guests: eventGuests.val(),
              calendar: eventLabel.val(),
              description: eventDescription.value,
              id_tipo_evento: eventTipoEvento.value
            },
            display: 'block',
            allDay: allDaySwitch.checked ? true : false
          };

          updateEvent(eventData);
          bsAddEventSidebar.hide();
        }
      }
    });

    // Call removeEvent function
    btnDeleteEvent.addEventListener('click', async e => {
      removeEvent(parseInt(eventToUpdate.id));
      bsAddEventSidebar.hide();
    });

    // Reset event form inputs values
    // ------------------------------------------------
    function resetValues() {
      document.querySelector(".add-outros-calendarios").style.display = "block";
      collapseTodosCalendarios.querySelectorAll('input[type="checkbox"].add-outro-calendario').forEach(checkbox => {
        checkbox.checked = false;
      });
      document.getElementById("collapseListaCalendarios").classList.remove("show")
      if (start) start.setDate(null);
      if (end) end.setDate(null);

      eventEndDate.value = ""
      eventStartDate.value = ""
      eventUrl.value = '';
      eventTitle.value = '';
      eventLocation.value = '';
      allDaySwitch.checked = false;
      eventDescription.value = '';
      eventLabel.val(eventLabel.find('option[selected]').val()).trigger('change');
    }

    // When modal hides reset input values
    addEventSidebar.addEventListener('hidden.bs.offcanvas', function () {
      resetValues();
    });

    document.querySelector('.fc-sidebarToggle-button')?.addEventListener('click', function () {
      appCalendarSidebar.classList.add('show');
    });

    document.querySelector('.fc-sidebarFechar-button')?.addEventListener('click', function () {
      appCalendarSidebar.classList.remove('show');
    });

    // Calender filter functionality
    // ------------------------------------------------
    if (selectAll) {
      selectAll.addEventListener('click', e => {
        if (e.currentTarget.checked) {
          document.querySelectorAll('.input-filter').forEach(c => (c.checked = 1));
        } else {
          document.querySelectorAll('.input-filter').forEach(c => (c.checked = 0));
        }
        calendar.refetchEvents();
      });
    }

    if (filterInputs) {
      filterInputs.forEach(item => {
        item.addEventListener('click', () => {
          document.querySelectorAll('.input-filter:checked').length < document.querySelectorAll('.input-filter').length
            ? (selectAll.checked = false)
            : (selectAll.checked = true);
          calendar.refetchEvents();
        });
      });
    }

    // Jump to date on sidebar(inline) calendar change
    inlineCalInstance.config.onChange.push(function (date) {
      calendar.changeView(calendar.view.type, moment(date[0]).format('YYYY-MM-DD'));
      modifyToggler();
      appCalendarSidebar.classList.remove('show');
      appOverlay.classList.remove('show');
    });
  })();
});
