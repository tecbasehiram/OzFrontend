import { endpoint } from '../../modulos/variaveisGlobais.js';
import { customAlert, customConfirm } from '../../modulos/modals.js';
import { fetchComAutoRefresh } from '../../modulos/fetchComAutoRefresh.js';

let topVendasFaturamento, topVendasQuantidade, topEstadosVendas, topClientes, topVendedores, mapTipos = {}, totalAno = {}, statusVendas, taxaFornecedores;

async function getTaxaFornecedores() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/vendas/getTaxaFornecedores', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        taxaFornecedores = data.payload;
        exibirTaxaFornecedores(taxaFornecedores);
    } else {
        customAlert(data.message);
    }
}

async function getTopVendasFaturamento() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/vendas/getTopVendasFaturamento', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        topVendasFaturamento = data.payload;
        exibirTopVendasFaturamento(topVendasFaturamento.vendasFaturamentoUmMes);
        handleTopVendasFaturamento();
    } else {
        customAlert(data.message);
    }
}

async function getTopVendasQuantidade() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/vendas/getTopVendasQuantidade', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        topVendasQuantidade = data.payload;
        exibirTopVendasQuantidade(topVendasQuantidade.vendasQuantidadeUmMes);
        handleTopVendasQuantidade();
    } else {
        customAlert(data.message);
    }
}

async function getTopEstadosVendas() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/vendas/getTopEstadosVendas', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        topEstadosVendas = data.payload;
        exibirTopEstadosVendas(topEstadosVendas);
    } else {
        customAlert(data.message);
    }
}

async function getTopClientes() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/pessoas/getClientes', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        topClientes = data.payload;
        console.log(topClientes);
        exibirTopClientes(topClientes);
    } else {
        customAlert(data.message);
    }
}

async function getTopVendedores() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/pessoas/getVendedores', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        topVendedores = data.payload;
        console.log(topVendedores);
        exibirTopVendedores(topVendedores);
    } else {
        customAlert(data.message);
    }
}

async function getVendasAnalise() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/vendas/getVendasAnalise', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        data.payload.forEach(item => {
            // Inicializa o array do ano se não existir
            if (!mapTipos[item.ano]) {
                mapTipos[item.ano] = [];
            }
        
            // Verifica se já existe um objeto para o tipo
            let tipoObj = mapTipos[item.ano].find(t => t.name === item.tipo);
        
            if (!tipoObj) {
                tipoObj = {
                    name: item.tipo,
                    data: []
                };
                mapTipos[item.ano].push(tipoObj);
            }
        
            // Adiciona o mês e valor
            tipoObj.data.push({
                x: item.mes_abrev,
                y: item.total_vendas
            });

            if(!totalAno[item.ano]) {
                totalAno[item.ano] = 0;
            }

            totalAno[item.ano] += parseFloat(item.total_vendas);
        });

        exibirAnalisisVendas(mapTipos[2025], 2025);
    } else {
        customAlert(data.message);
    }
}

async function getVendasStatus() {
    const response = await fetchComAutoRefresh(endpoint + '/api/oz/vendas/getVendasStatus', {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (response.ok) {
        statusVendas = data.payload;
        exibirStatusVendas(statusVendas.percentual_ultimos_3_meses);
    } else {
        customAlert(data.message);
    }
}

function handleTopVendasFaturamento() {
    document.getElementById('topProdutosFaturamentoUltimoMes').addEventListener('click', () => {
        exibirTopVendasFaturamento(topVendasFaturamento.vendasFaturamentoUmMes);
    });
    document.getElementById('topProdutosFaturamentoUltimos6Meses').addEventListener('click', () => {
        exibirTopVendasFaturamento(topVendasFaturamento.vendasFaturamentoSeisMeses);
    });
    document.getElementById('topProdutosFaturamentoUltimoAno').addEventListener('click', () => {
        exibirTopVendasFaturamento(topVendasFaturamento.vendasFaturamentoDozeMeses);
    });
}

function handleTopVendasQuantidade() {
    document.getElementById('topProdutosQuantidadeUltimoMes').addEventListener('click', () => {
        exibirTopVendasQuantidade(topVendasQuantidade.vendasQuantidadeUmMes);
    });
    document.getElementById('topProdutosQuantidadeUltimos6Meses').addEventListener('click', () => {
        exibirTopVendasQuantidade(topVendasQuantidade.vendasQuantidadeSeisMeses);
    });
    document.getElementById('topProdutosQuantidadeUltimoAno').addEventListener('click', () => {
        exibirTopVendasQuantidade(topVendasQuantidade.vendasQuantidadeDozeMeses);
    });
}

function exibirTaxaFornecedores(taxaFornecedores) {
    document.getElementById('taxaFornecedoresLista').innerHTML = '';

    if(taxaFornecedores.length === 0) {
        document.getElementById('taxaFornecedoresLista').innerHTML = 'Dados não encontrados';

        return;
    }

    taxaFornecedores.forEach(item => {
        document.getElementById('taxaFornecedoresLista').innerHTML += `
            <li class="d-flex mb-6 pb-1">
                <div class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div class="me-2">
                        <h6 class="mb-0">${item.fornecedor}</h6>
                        <small class="text-body-secondary">${item.produto}</small>
                    </div>
                    <div class="user-progress">
                        <span class="me-3">${parseFloat(item.percentual_comissao).toFixed(2)}%</span
                    </div>
                </div>
            </li> `;
    });
}

function exibirTopClientes(topClientes) {
    document.getElementById('topClientesTableBody').innerHTML = '';

    if(topClientes.length === 0) {
        document.getElementById('topClientesTableBody').innerHTML = 'Dados não encontrados';

        return;
    }

    topClientes.forEach(item => {
        document.getElementById('topClientesTableBody').innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td>${item.tipo_pessoa === 'F' ? 'Física' : 'Jurídica'}</td>
                <td>${item.total_compras}</td>
                <td>R$ ${item.valor_total_compras}</td>
                <td>${new Date(item.ultima_compra).toLocaleDateString('pt-BR')}</td>
            </tr>
        `;
    });
}

function exibirTopVendedores(topVendedores) {
    document.getElementById('topVendedoresTableBody').innerHTML = '';

    if(topVendedores.length === 0) {
        document.getElementById('topVendedoresTableBody').innerHTML = 'Dados não encontrados';

        return;
    }

    topVendedores.forEach(item => {
        document.getElementById('topVendedoresTableBody').innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td>${item.total_vendas}</td>
                <td>R$ ${item.valor_total_vendas}</td>
                <td>${new Date(item.ultima_venda).toLocaleDateString('pt-BR')}</td>
            </tr>
        `;
    });
}

function exibirTopEstadosVendas(topEstadosVendas) {
    document.getElementById('topEstadosVendas').innerHTML = '';

    if(topEstadosVendas.length === 0) {
        document.getElementById('topEstadosVendas').innerHTML = 'Dados não encontrados';

        return;
    }

    topEstadosVendas.forEach(item => {
        document.getElementById('topEstadosVendas').innerHTML += `
            <li class="d-flex align-items-center mb-6 me-3">        
                <div class="avatar flex-shrink-0 me-3 d-flex align-items-center justify-content-center">
                    ${item.sigla}
                </div>
                <div class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div class="me-2">
                        <div class="d-flex align-items-center">
                            <h6 class="mb-0 me-2">R$ ${item.total_vendido}</h6>
                        </div>
                        <small>${item.estado}</small>
                    </div>
                    <div class="user-progress">
                        <h6 class="mb-0">${item.total_vendas}</h6>
                    </div>
                </div>
            </li>
        `;
    });
}      

function exibirTopVendasQuantidade(topVendasQuantidade) {

    document.getElementById('topProdutosQuantidade').innerHTML = '';

    if(topVendasQuantidade.length === 0) {
        document.getElementById('topProdutosQuantidade').innerHTML = 'Dados não encontrados';

        return;
    }

    topVendasQuantidade.forEach(item => {
        const icon = item.tipo === 'SV' ? 'shield me-4' : 
        item.tipo === 'PA' ? 'ticket me-4' : 
        item.tipo === 'PT' ? 'box me-4' : 
        item.tipo === 'OP' ? 'person-walking icon-lg me-2' : 
        item.tipo === 'DH' ? 'hotel me-3' :
        item.tipo === 'LV' ? 'car me-3' :
        item.tipo === 'CM' ? 'ship me-3' :
        item.tipo === 'PA' ? 'plane me-3' :
        item.tipo === 'OU' ? 'ellipsis icon-lg me-4' : 'plane me-4';


        document.getElementById('topProdutosQuantidade').innerHTML += `
            <li class="d-flex align-items-center mb-7 p-2">                
                <div class="avatar flex-shrink-0 d-flex align-items-center justify-content-center">
                    <i class="fa-solid fa-${icon} icon-base"></i>
                </div> 
                <div class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div class="me-2">
                        <h6 class="mb-0">${item.nome}</h6>
                        <small class="d-block">Tipo: ${item.tipo}</small>
                    </div>
                    <div class="user-progress d-flex align-items-center gap-1">
                        <span class="fw-medium text-primary">${item.total_qtd_vendas}</span>
                    </div>
                </div>
            </li>
        `;
    });
}

function exibirTopVendasFaturamento(topVendasFaturamento) {

    document.getElementById('topProdutosFaturamento').innerHTML = '';

    if(topVendasFaturamento.length === 0) {
        document.getElementById('topProdutosFaturamento').innerHTML = 'Dados não encontrados';

        return;
    }

    topVendasFaturamento.forEach(item => {
        const icon = item.tipo === 'SV' ? 'shield me-4' : 
        item.tipo === 'PA' ? 'ticket me-4' : 
        item.tipo === 'PT' ? 'box me-4' : 
        item.tipo === 'OP' ? 'person-walking icon-lg me-2' : 
        item.tipo === 'DH' ? 'hotel me-3' :
        item.tipo === 'LV' ? 'car me-3' :
        item.tipo === 'CM' ? 'ship me-3' :
        item.tipo === 'PA' ? 'plane me-3' :
        item.tipo === 'OU' ? 'ellipsis icon-lg me-4' : 'plane me-4';


        document.getElementById('topProdutosFaturamento').innerHTML += `
            <li class="d-flex align-items-center mb-7 p-2">                
                <div class="avatar flex-shrink-0 d-flex align-items-center justify-content-center">
                    <i class="fa-solid fa-${icon} icon-base"></i>
                </div> 
                <div class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                    <div class="me-2">
                        <h6 class="mb-0">${item.nome}</h6>
                        <small class="d-block">Tipo: ${item.tipo}</small>
                    </div>
                    <div class="user-progress d-flex align-items-center gap-1">
                        <span class="fw-medium text-primary">R$ ${item.total_faturamento}</span>
                    </div>
                </div>
            </li>
        `;
    });
}

function handleAnalisisVendas() {
    document.getElementById('salesAnalyticsChartAno2025').addEventListener('click', () => {
        exibirAnalisisVendas(mapTipos[2025], 2025);
    });
    document.getElementById('salesAnalyticsChartAno2024').addEventListener('click', () => {
        exibirAnalisisVendas(mapTipos[2024], 2024);
    });
    document.getElementById('salesAnalyticsChartAno2023').addEventListener('click', () => {
        exibirAnalisisVendas(mapTipos[2023], 2023);
    });
    document.getElementById('salesAnalyticsChartAno2022').addEventListener('click', () => {
        exibirAnalisisVendas(mapTipos[2022], 2022);
    }); 
}

function handleStatusVendas() {
    document.getElementById('salesStatsUltimos3Meses').addEventListener('click', () => {
        exibirStatusVendas(statusVendas.percentual_ultimos_3_meses);
    });
    document.getElementById('salesStatsUltimos6Meses').addEventListener('click', () => {
        exibirStatusVendas(statusVendas.percentual_ultimos_6_meses);
    });
    document.getElementById('salesStatsUltimoAno').addEventListener('click', () => {
        exibirStatusVendas(statusVendas.percentual_ultimos_12_meses);
    });
}

function exibirAnalisisVendas(analisisVendas, ano) {
    document.getElementById('salesAnalyticsChart').innerHTML = '';

    document.getElementById('salesAnalyticsChartAno').textContent = ano;

    console.log(totalAno[ano], totalAno[ano - 1]);

    document.getElementById('salesAnalyticsComparacaoAnoPassado').textContent = `+${((totalAno[ano] / totalAno[ano - 1] || 0) * 100).toFixed(2)}%`;

    document.getElementById('salesAnalyticsComparacaoAnoPassadoText').textContent = `Do que ${ano - 1}`;

    let cardColor,
    labelColor,
    shadeColor,
    heatMap1,
    fontFamily;

    if (isDarkStyle) {
        shadeColor = 'dark';
        heatMap1 = '#295e4e';
      } else {
        shadeColor = '';
        heatMap1 = '#ededff';
    }

    const salesAnalyticsChartEl = document.querySelector('#salesAnalyticsChart'),
    salesAnalyticsChartConfig = {
      chart: {
        height: 350,
        type: 'heatmap',
        parentHeightOffset: 0,
        offsetX: -10,
        toolbar: {
          show: false
        }
      },
      series: analisisVendas,
      plotOptions: {
        heatmap: {
          enableShades: false, // cores fixas
          radius: '6px',
          colorScale: {
            ranges: [
              { from: 0, to: 1000, color: '#295e4e'  },
              { from: 1001, to: 10000, color: '#39836d' },
              { from: 10001, to: 100000, color: '#46a78a' },
              { from: 100001, to: 150000, color: '#5ad1ad' },
              { from: 150001, to: 200000, color: '#64ebc2' },
              { from: 200001, to: 1000000, color: '#43fdc5' }
            ]
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 4,
        colors: [cardColor]
      },
      legend: {
        show: false
      },
      grid: {
        show: false,
        padding: {
          top: -10,
          left: 16,
          right: -15,
          bottom: 0
        }
      },
      xaxis: {
        labels: {
          show: true,
          style: {
            colors: labelColor,
            fontSize: '15px',
            fontFamily: fontFamily
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: labelColor,
            fontSize: '15px',
            fontFamily: fontFamily
          }
        }
      },
      responsive: [
        {
          breakpoint: 1441,
          options: {
            chart: {
              height: '325px'
            },
            grid: {
              padding: {
                right: -15
              }
            }
          }
        },
        {
          breakpoint: 1045,
          options: {
            chart: {
              height: '300px'
            },
            grid: {
              padding: {
                right: -50
              }
            }
          }
        },
        {
          breakpoint: 992,
          options: {
            chart: {
              height: '320px'
            },
            grid: {
              padding: {
                right: -50
              }
            }
          }
        },
        {
          breakpoint: 767,
          options: {
            chart: {
              height: '400px'
            },
            grid: {
              padding: {
                right: 0
              }
            }
          }
        },
        {
          breakpoint: 568,
          options: {
            chart: {
              height: '330px'
            },
            grid: {
              padding: {
                right: -20
              }
            }
          }
        }
      ],
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      }
    };
  if (typeof salesAnalyticsChartEl !== undefined && salesAnalyticsChartEl !== null) {
    const salesAnalyticsChart = new ApexCharts(salesAnalyticsChartEl, salesAnalyticsChartConfig);
    salesAnalyticsChart.render();
  }
}

function exibirStatusVendas(statusVendas) {

    document.getElementById('salesStats').innerHTML = '';

    let borderColor = '#cecece',
    headingColor = '#cecece',
    legendColor = '#cecece',
    fontFamily = 'FontLogo';

    const salesStatsEl = document.querySelector('#salesStats'),
    salesStatsOptions = {
      chart: {
        height: 315,
        type: 'radialBar'
      },
      series: [statusVendas],
      labels: ['Vendas Concluídas'],
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
          strokeWidth: '70',
          hollow: {
            margin: 50,
            size: `80%`,
            image: assetsPath + 'img/icons/misc/arrow-star.png',
            imageWidth: 65,
            imageHeight: 55,
            imageOffsetY: -35,
            imageClipped: false
          },
          track: {
            strokeWidth: '50%',
            background: borderColor
          },
          dataLabels: {
            show: true,
            name: {
              offsetY: 60,
              show: true,
              color: legendColor,
              fontSize: '13px',
              fontWeight: '200',
              fontFamily: fontFamily
            },
            value: {
              formatter: function (val) {
                return parseInt(statusVendas) + '%';
              },
              offsetY: 20,
              color: headingColor,
              fontSize: '28px',
              fontWeight: '500',
              fontFamily: fontFamily,
              show: true
            }
          }
        }
      },
      fill: {
        type: 'solid',
        colors: config.colors.success
      },
      stroke: {
        lineCap: 'round'
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      }
    };
  if (typeof salesStatsEl !== undefined && salesStatsEl !== null) {
    const salesStats = new ApexCharts(salesStatsEl, salesStatsOptions);
    salesStats.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
    getTopVendasFaturamento();
    getTopVendasQuantidade();
    getTopEstadosVendas();
    getTopClientes();
    getTopVendedores();
    getVendasAnalise();
    getVendasStatus();
    handleAnalisisVendas();
    handleStatusVendas();
    getTaxaFornecedores();
});