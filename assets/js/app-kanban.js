'use strict';

// ============================================================================
// KANBAN BOARD - SISTEMA DE TIMELINE COM EVENTOS
// ============================================================================

(async function () {
  // ============================================================================
  // 1. INICIALIZAÇÃO E CONFIGURAÇÃO
  // ============================================================================
  
  // Elementos DOM principais
  const kanbanSidebar = document.querySelector('.kanban-update-item-sidebar');
  
  // Inicializar offcanvas do Bootstrap
  const kanbanOffcanvas = new bootstrap.Offcanvas(kanbanSidebar);
  
  // Carregar dados do Kanban do arquivo JSON
  const kanbanResponse = await fetch(assetsPath + 'json/kanban.json');
  if (!kanbanResponse.ok) {
    console.error('Erro ao carregar dados do Kanban:', kanbanResponse);
  }
  const boards = await kanbanResponse.json();

  // ============================================================================
  // 2. FUNÇÕES DE RENDERIZAÇÃO
  // ============================================================================
  
  // Criar ícone de lixeira para exclusão
  const renderDropdown = () => `
    <i class="icon-base fa-solid fa-trash icon-xs me-1 delete-task cursor-pointer" style="color: red;"></i>
  `;
  
  // Criar cabeçalho do item com título e ícone de exclusão
  const renderHeader = (elementTitle) => `
    <div class="d-flex justify-content-between flex-wrap align-items-center mb-2">
        <span class="kanban-text">${elementTitle}</span>
        ${renderDropdown()}
    </div>
  `;

  // ============================================================================
  // 3. FUNÇÕES UTILITÁRIAS PARA HORÁRIOS
  // ============================================================================
  
  // Gerar opções de horário (18:00 até 22:00, intervalos de 30 min)
  function generateTimeOptions(startHour = 18, endHour = 22, stepMin = 30) {
    const times = [];
    const d = new Date(); d.setHours(startHour, 0, 0, 0);
    const e = new Date(); e.setHours(endHour, 0, 0, 0);
    
    while (d <= e) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      times.push(`${hh}:${mm}`);
      d.setMinutes(d.getMinutes() + stepMin);
    }
    return times;
  }
  
  // Encontrar board pelo horário
  function findBoardIdByTime(hhmm) {
    const titles = Array.from(document.querySelectorAll('.kanban-board .kanban-title-board'));
    const titleEl = titles.find(t => (t.textContent || '').trim() === hhmm);
    if (!titleEl) return null;
    const board = titleEl.closest('.kanban-board');
    return board ? board.getAttribute('data-id') : null;
  }
  
  // Verificar se evento longo precisa unir boards
  function mergeBoardsForEvent(startTime, endTime) {
    if (!startTime || !endTime) return null;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startDate = new Date(); startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date(); endDate.setHours(endH, endM, 0, 0);
    const diffMs = endDate - startDate;
    const diffMinutes = diffMs / (1000 * 60);
    
    // Se duração <= 30 min, não precisa unir
    if (diffMinutes <= 30) return null;
    
    // Encontrar todos os boards entre início e fim
    const boardsToMerge = [];
    const allTimes = generateTimeOptions();
    const startIndex = allTimes.indexOf(startTime);
    const endIndex = allTimes.indexOf(endTime);
    
    if (startIndex === -1 || endIndex === -1) return null;
    
    for (let i = startIndex; i <= endIndex; i++) {
      const time = allTimes[i];
      const boardId = findBoardIdByTime(time);
      if (boardId) {
        const board = document.querySelector(`.kanban-board[data-id="${boardId}"]`);
        if (board) boardsToMerge.push(board);
      }
    }
    
    return boardsToMerge;
  }

  // ============================================================================
  // 4. INICIALIZAÇÃO DO KANBAN
  // ============================================================================
  
  // Criar instância do jKanban
  const kanban = new jKanban({
    element: '.kanban-wrapper',
    gutter: '12px',
    widthBoard: '250px',
    dragItems: true,
    boards: boards,
    dragBoards: true,
    
    // ============================================================================
    // 5. HANDLER DE CLIQUE NO ITEM (EDITAR)
    // ============================================================================
    click: el => {
      const element = el;
      
      // Armazenar ID do item atual globalmente
      try { window.hiramCurrentKanbanItemId = element.getAttribute('data-eid'); } catch (_) {}
      
      // Extrair dados do item clicado
      const title = element.getAttribute('data-eid')
        ? element.querySelector('.kanban-text').textContent
        : element.textContent;
      const timeInicio = element.getAttribute('data-time-inicio') || '';
      const timeFim = element.getAttribute('data-time-fim') || '';
      
      // Abrir offcanvas
      kanbanOffcanvas.show();
      
      // Preencher campos do formulário
      const titleField = kanbanSidebar.querySelector('#title');
      const inicioField = kanbanSidebar.querySelector('#due-date-inicio');
      const fimField = kanbanSidebar.querySelector('#due-date-fim');
      
      if (titleField) titleField.value = title;
      if (inicioField) inicioField.value = timeInicio;
      if (fimField) fimField.value = timeFim;
      
      // Configurar interface para modo edição
      const titleEl = kanbanSidebar.querySelector('.offcanvas-title');
      if (titleEl) titleEl.textContent = 'Editar Evento';
      
      const primaryBtn = kanbanSidebar.querySelector('.btn.btn-primary');
      if (primaryBtn) primaryBtn.textContent = 'Atualizar';
      
      // Configurar selects de horário e selecionar valores atuais
      setTimeout(() => {
        setupTimeSelects();
        if (timeInicio && inicioField) {
          $(inicioField).val(timeInicio).trigger('change');
        }
        if (timeFim && fimField) {
          $(fimField).val(timeFim).trigger('change');
        }
      }, 100);
    },
    
    // ============================================================================
    // 6. HANDLER DE BOTÃO "+" NO BOARD (ADICIONAR RÁPIDO)
    // ============================================================================
    buttonClick: (el, boardId) => {
      // Criar formulário simples para adição rápida
      const addNewForm = document.createElement('form');
      addNewForm.setAttribute('class', 'new-item-form');
      addNewForm.innerHTML = `
        <div class="mb-4">
            <textarea class="form-control add-new-item" rows="2" placeholder="Digite o título do evento" autofocus required></textarea>
        </div>
        <div class="mb-4">
            <button type="submit" class="btn btn-primary btn-sm me-3">Adicionar</button>
            <button type="button" class="btn btn-label-secondary btn-sm cancel-add-item">Cancelar</button>
        </div>
      `;
      
      kanban.addForm(boardId, addNewForm);
      
      // Handler do formulário
      addNewForm.addEventListener('submit', e => {
        e.preventDefault();
        const currentBoard = Array.from(document.querySelectorAll(`.kanban-board[data-id="${boardId}"] .kanban-item`));
        
        // Adicionar elemento
        kanban.addElement(boardId, {
          title: `<span class="kanban-text">${e.target[0].value}</span>`,
          id: `${boardId}-${currentBoard.length + 1}`
        });
        
        // Renderizar dropdowns nos novos elementos
        renderDropdownsOnItems();
        addNewForm.remove();
      });
      
      // Cancelar formulário
      addNewForm.querySelector('.cancel-add-item').addEventListener('click', () => addNewForm.remove());
    }
  });
  
  // Expor instância globalmente
  try { window.hiramKanban = kanban; } catch (_) {}

  // ============================================================================
  // 7. FUNÇÃO PARA RENDERIZAR DROPDOWNS EM TODOS OS ITENS
  // ============================================================================
  
  function renderDropdownsOnItems() {
    const items = Array.from(document.querySelectorAll('.kanban-item'));
    items.forEach(el => {
      // Adicionar dropdown se não existir
      if (!el.querySelector('.delete-task')) {
        const textEl = el.querySelector('.kanban-text');
        if (textEl) {
          textEl.insertAdjacentHTML('beforebegin', renderDropdown());
        }
      }
      
      // Adicionar funcionalidade de exclusão
      const deleteBtn = el.querySelector('.delete-task');
      if (deleteBtn && !deleteBtn.hasAttribute('data-event-bound')) {
        deleteBtn.setAttribute('data-event-bound', 'true');
        deleteBtn.addEventListener('click', (e) => {
          const title = el.querySelector('.kanban-text')?.textContent || 'este evento';
          const id = el.getAttribute('data-eid');
          if (id && window.confirm(`Tem certeza que deseja excluir ${title}?`)) {
            kanban.removeElement(id);
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
    });
  }

  // ============================================================================
  // 8. RENDERIZAÇÃO INICIAL DOS ITENS
  // ============================================================================
  
  const kanbanItem = Array.from(document.querySelectorAll('.kanban-item'));
  if (kanbanItem.length) {
    kanbanItem.forEach(el => {
      const element = `<span class="kanban-text">${el.textContent}</span>`;
      el.insertAdjacentHTML('afterbegin', `${renderHeader(element)}`);
    });
  }
  
  // Renderizar dropdowns em todos os itens
  renderDropdownsOnItems();

  // ============================================================================
  // 9. CONFIGURAÇÃO DOS SELECTS DE HORÁRIO
  // ============================================================================
  
  function setupTimeSelects() {
    const inicioField = kanbanSidebar.querySelector('#due-date-inicio');
    const fimField = kanbanSidebar.querySelector('#due-date-fim');
    
    if (!inicioField || !fimField) {
      console.warn('Campos de horário não encontrados no offcanvas');
      return;
    }
    
    // Verificar se jQuery e Select2 estão disponíveis
    if (typeof $ === 'undefined' || typeof $.fn.select2 === 'undefined') {
      console.error('jQuery ou Select2 não estão carregados');
      return;
    }
    
    const allTimes = generateTimeOptions();
    
    // Converter inputs para selects se necessário
    let inicioSelect = inicioField;
    let fimSelect = fimField;
    
    if (inicioField.tagName === 'INPUT') {
      const inicioSelectEl = document.createElement('select');
      inicioSelectEl.id = 'due-date-inicio';
      inicioSelectEl.className = 'form-control';
      inicioField.parentNode.replaceChild(inicioSelectEl, inicioField);
      inicioSelect = inicioSelectEl;
    }
    
    if (fimField.tagName === 'INPUT') {
      const fimSelectEl = document.createElement('select');
      fimSelectEl.id = 'due-date-fim';
      fimSelectEl.className = 'form-control';
      fimField.parentNode.replaceChild(fimSelectEl, fimField);
      fimSelect = fimSelectEl;
    }
    
    // Limpar e configurar selects
    $(inicioSelect).empty();
    $(fimSelect).empty();
    
    // Adicionar opções de horário
    allTimes.forEach(time => {
      $(inicioSelect).append(new Option(time, time));
      $(fimSelect).append(new Option(time, time));
    });
    
    // Inicializar Select2
    try {
      $(inicioSelect).select2({
        placeholder: 'Selecione horário início',
        dropdownParent: $(inicioSelect).parent()
      });
      
      $(fimSelect).select2({
        placeholder: 'Selecione horário fim',
        dropdownParent: $(fimSelect).parent()
      });
    } catch (error) {
      console.error('Erro ao configurar Select2:', error);
    }
    
    // Auto-selecionar fim quando início mudar
    $(inicioSelect).on('change', function() {
      const selectedInicio = $(this).val();
      if (selectedInicio) {
        const inicioIndex = allTimes.indexOf(selectedInicio);
        if (inicioIndex !== -1 && inicioIndex + 1 < allTimes.length) {
          $(fimSelect).val(allTimes[inicioIndex + 1]).trigger('change');
        }
      }
    });
  }

  // ============================================================================
  // 10. MODO ADICIONAR EVENTO (BOTÃO PRINCIPAL)
  // ============================================================================
  
  (function setupAddMode() {
    const headerAddBtn = document.querySelector('.container-xxl .btn.btn-primary');
    if (!headerAddBtn) return;
    
    headerAddBtn.addEventListener('click', () => {
      // Configurar interface para modo adicionar
      const titleEl = kanbanSidebar.querySelector('.offcanvas-title');
      if (titleEl) titleEl.textContent = 'Adicionar Evento';
      
      const primaryBtn = kanbanSidebar.querySelector('.btn.btn-primary');
      const originalText = primaryBtn ? primaryBtn.textContent : '';
      if (primaryBtn) primaryBtn.textContent = 'Adicionar';
      
      // Configurar selects de horário
      setTimeout(() => {
        setupTimeSelects();
      }, 100);
      
      // Abrir offcanvas
      const off = bootstrap.Offcanvas.getOrCreateInstance(kanbanSidebar);
      off.show();
      
      // Handler para adicionar evento
      function onAddClick() {
        const titleField = kanbanSidebar.querySelector('#title');
        const inicioField = kanbanSidebar.querySelector('#due-date-inicio');
        const fimField = kanbanSidebar.querySelector('#due-date-fim');
        
        const titleValue = (titleField?.value || '').trim();
        const timeInicio = (inicioField?.value || '').trim();
        const timeFim = (fimField?.value || '').trim();
        
        // Validação
        if (!titleValue || !/^\d{2}:\d{2}$/.test(timeInicio)) {
          alert('Preencha o título e horário de início.');
          return;
        }
        
        // Verificar conflitos de horário
        const boardsToMerge = mergeBoardsForEvent(timeInicio, timeFim);
        if (boardsToMerge && boardsToMerge.length > 0) {
          const hasConflict = boardsToMerge.some(board => board.querySelector('.kanban-item'));
          if (hasConflict) {
            alert('Existe conflito de horário com outro evento.');
            return;
          }
        }
        
        // Criar evento
        const newId = `event-${Date.now()}`;
        const eventData = {
          id: newId,
          title: `<span class="kanban-text">${titleValue}</span>`,
          'data-time-inicio': timeInicio,
          'data-time-fim': timeFim || timeInicio
        };
        
        // Adicionar evento
        if (boardsToMerge && boardsToMerge.length > 1) {
          // Evento longo: unir boards
          const firstBoard = boardsToMerge[0];
          const firstBoardId = firstBoard.getAttribute('data-id');
          window.hiramKanban.addElement(firstBoardId, eventData);
          
          // Atualizar título do board
          const titleEl = firstBoard.querySelector('.kanban-title-board');
          if (titleEl) {
            titleEl.textContent = `${timeInicio} - ${timeFim}`;
          }
          
          // Remover boards intermediários
          for (let i = 1; i < boardsToMerge.length; i++) {
            const boardToRemove = boardsToMerge[i];
            const boardId = boardToRemove.getAttribute('data-id');
            window.hiramKanban.removeBoard(boardId);
          }
        } else {
          // Evento curto: usar board do horário início
          const boardId = findBoardIdByTime(timeInicio);
          if (boardId) {
            window.hiramKanban.addElement(boardId, eventData);
          }
        }
        
        // Renderizar dropdown no novo elemento
        setTimeout(() => {
          renderDropdownsOnItems();
        }, 100);
        
        // Fechar e limpar
        off.hide();
        if (primaryBtn) primaryBtn.removeEventListener('click', onAddClick);
        if (primaryBtn && originalText) primaryBtn.textContent = originalText;
        const formEl = kanbanSidebar.querySelector('form');
        if (formEl) formEl.reset();
      }
      
      if (primaryBtn) {
        primaryBtn.addEventListener('click', onAddClick, { once: true });
      }
    });
  })();

  // ============================================================================
  // 11. HANDLER PARA BOTÃO ATUALIZAR (EDITAR)
  // ============================================================================
  
  (function setupUpdateHandler() {
    const updateBtn = kanbanSidebar.querySelector('.btn.btn-primary');
    if (!updateBtn) return;
    
    updateBtn.addEventListener('click', function() {
      const id = window.hiramCurrentKanbanItemId;
      if (!id) return;
      
      const item = document.querySelector(`.kanban-item[data-eid="${id}"]`);
      if (!item) return;
      
      // Obter valores dos campos
      const titleField = kanbanSidebar.querySelector('#title');
      const inicioField = kanbanSidebar.querySelector('#due-date-inicio');
      const fimField = kanbanSidebar.querySelector('#due-date-fim');
      
      const titleValue = (titleField?.value || '').trim();
      const timeInicio = (inicioField?.value || '').trim();
      const timeFim = (fimField?.value || '').trim();
      
      // Validação
      if (!titleValue || !/^\d{2}:\d{2}$/.test(timeInicio)) {
        alert('Preencha o título e horário de início.');
        return;
      }
      
      // Atualizar item
      item.setAttribute('data-time-inicio', timeInicio);
      item.setAttribute('data-time-fim', timeFim || timeInicio);
      
      const textEl = item.querySelector('.kanban-text');
      if (textEl) textEl.textContent = titleValue;
      
      // Fechar offcanvas
      const off = bootstrap.Offcanvas.getInstance(kanbanSidebar);
      if (off) off.hide();
    });
  })();

  // ============================================================================
  // 12. LIMPEZA AO FECHAR OFFCANVAS
  // ============================================================================
  
  kanbanSidebar.addEventListener('hidden.bs.offcanvas', () => {
    try {
      // Limpar formulário
      const form = kanbanSidebar.querySelector('form');
      if (form) form.reset();
      
      // Limpar campos de horário
      const inicioField = kanbanSidebar.querySelector('#due-date-inicio');
      const fimField = kanbanSidebar.querySelector('#due-date-fim');
      if (inicioField) inicioField.value = '';
      if (fimField) fimField.value = '';
      
      // Restaurar texto do botão
      const primaryBtn = kanbanSidebar.querySelector('.btn.btn-primary');
      if (primaryBtn) primaryBtn.textContent = 'Atualizar';
    } catch (_) { /* no-op */ }
  });

})();
