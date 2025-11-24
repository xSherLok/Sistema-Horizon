// ======================= DASHBOARD =======================

// Pequeno helper local (não dependo do vendas.js)
function formatCurrencyBRL(value) {
    if (value == null || value === '' || isNaN(Number(value))) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

// Carrega os números dos cards principais
async function carregarResumoDashboard() {
    try {
        const res = await api('/dashboard/resumo'); // endpoint que vamos criar no backend

        const totalFaturado = res?.totalFaturado ?? 0;
        const totalTransacoes = res?.totalTransacoes ?? 0;
        const totalProdutos = res?.totalProdutos ?? 0;
        const totalClientes = res?.totalClientes ?? 0;

        const elFat = document.getElementById('cardTotalFaturado');
        const elTran = document.getElementById('cardTotalTransacoes');
        const elProd = document.getElementById('cardTotalProdutos');
        const elCli = document.getElementById('cardTotalClientes');

        if (elFat) elFat.textContent = formatCurrencyBRL(totalFaturado);
        if (elTran) elTran.textContent = totalTransacoes.toString();
        if (elProd) elProd.textContent = totalProdutos.toString();
        if (elCli) elCli.textContent = totalClientes.toString();
    } catch (err) {
        console.error('[DASHBOARD] Erro ao carregar resumo:', err);
        // Se der erro (endpoint ainda não existe), deixamos os zeros lá mesmo
    }
}

// Gráfico de linha: faturamento por dia/mês
async function carregarGraficoReceita() {
    const canvas = document.getElementById('graficoReceita');
    if (!canvas || typeof Chart === 'undefined') return;

    try {
        // Esperado: { labels: ['01/11','02/11',...], valores: [123,456,...] }
        const dados = await api('/dashboard/receita-mensal'); // endpoint que vamos criar

        const labels = dados?.labels || [];
        const valores = dados?.valores || [];

        const ctx = canvas.getContext('2d');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Faturamento',
                    data: valores,
                    fill: true,
                    tension: 0.3,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => formatCurrencyBRL(value),
                        },
                    },
                },
            },
        });
    } catch (err) {
        console.error('[DASHBOARD] Erro ao carregar gráfico de receita:', err);
    }
}

// Gráfico de pizza/doughnut: produtos mais vendidos
async function carregarGraficoTopProdutos() {
    const canvas = document.getElementById('graficoTopProdutos');
    if (!canvas || typeof Chart === 'undefined') return;

    try {
        // Esperado: array de objetos
        // [ { nome: 'Produto A', quantidade: 10 }, ... ]
        const lista = await api('/dashboard/top-produtos'); // endpoint que vamos criar

        const labels = (lista || []).map((item) => item.nome || item.produto || 'Produto');
        const valores = (lista || []).map((item) => item.quantidade || item.totalVendido || 0);

        const ctx = canvas.getContext('2d');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: valores,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                },
            },
        });
    } catch (err) {
        console.error('[DASHBOARD] Erro ao carregar gráfico de produtos:', err);
    }
}

// Quando a página carregar, busca tudo
document.addEventListener('DOMContentLoaded', () => {
    carregarResumoDashboard();
    carregarGraficoReceita();
    carregarGraficoTopProdutos();
});
