const API_URL = 'api/pessoas.php';

const corpoTabela = document.getElementById('corpoTabela');
const totalRegistros = document.getElementById('totalRegistros');
const campoBusca = document.getElementById('campoBusca');
const feedback = document.getElementById('feedback');

const overlay = document.getElementById('fichaOverlay');
const form = document.getElementById('formFicha');
const fichaTitulo = document.getElementById('fichaTitulo');
const fichaErros = document.getElementById('fichaErros');

const campoId = document.getElementById('pessoaId');
const campoNome = document.getElementById('nome');
const campoCpf = document.getElementById('cpf');
const campoEmail = document.getElementById('email');
const campoTelefone = document.getElementById('telefone');
const campoNascimento = document.getElementById('data_nascimento');

let buscaTimeout = null;

document.addEventListener('DOMContentLoaded', carregarPessoas);
document.getElementById('btnNovaFicha').addEventListener('click', () => abrirFicha());
document.getElementById('btnFechar').addEventListener('click', fecharFicha);
document.getElementById('btnCancelar').addEventListener('click', fecharFicha);
overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharFicha(); });
form.addEventListener('submit', salvarFicha);
campoCpf.addEventListener('input', mascararCpf);
campoTelefone.addEventListener('input', mascararTelefone);

campoBusca.addEventListener('input', () => {
    clearTimeout(buscaTimeout);
    buscaTimeout = setTimeout(() => carregarPessoas(campoBusca.value.trim()), 300);
});

async function carregarPessoas(busca = '') {
    try {
        const url = busca ? `${API_URL}?busca=${encodeURIComponent(busca)}` : API_URL;
        const resposta = await fetch(url);
        const pessoas = await resposta.json();

        if (!resposta.ok) throw new Error(pessoas.erro || 'Falha ao carregar registros.');

        renderizarTabela(pessoas);
        totalRegistros.textContent = pessoas.length;
    } catch (erro) {
        mostrarFeedback(erro.message, true);
    }
}

function renderizarTabela(pessoas) {
    if (pessoas.length === 0) {
        corpoTabela.innerHTML = `<tr class="linha-vazia"><td colspan="6">Nenhum registro encontrado.</td></tr>`;
        return;
    }

    corpoTabela.innerHTML = pessoas.map((pessoa) => `
    <tr>
      <td>${escapar(pessoa.nome)}</td>
      <td>${escapar(pessoa.cpf)}</td>
      <td>${escapar(pessoa.email)}</td>
      <td>${escapar(pessoa.telefone || '—')}</td>
      <td>${formatarData(pessoa.data_nascimento)}</td>
      <td class="col-acoes">
        <div class="linha-acoes">
          <button class="icone-acao" title="Editar" onclick="editarPessoa(${pessoa.id})">✎</button>
          <button class="icone-acao icone-acao--remover" title="Remover" onclick="removerPessoa(${pessoa.id})">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function abrirFicha(pessoa = null) {
    form.reset();
    fichaErros.hidden = true;
    fichaErros.innerHTML = '';

    if (pessoa) {
        fichaTitulo.textContent = 'Editar ficha';
        campoId.value = pessoa.id;
        campoNome.value = pessoa.nome;
        campoCpf.value = pessoa.cpf;
        campoEmail.value = pessoa.email;
        campoTelefone.value = pessoa.telefone || '';
        campoNascimento.value = pessoa.data_nascimento || '';
    } else {
        fichaTitulo.textContent = 'Nova ficha';
        campoId.value = '';
    }

    overlay.hidden = false;
    campoNome.focus();
}

function fecharFicha() {
    overlay.hidden = true;
}

async function editarPessoa(id) {
    try {
        const resposta = await fetch(`${API_URL}?id=${id}`);
        const pessoa = await resposta.json();
        if (!resposta.ok) throw new Error(pessoa.erro || 'Registro não encontrado.');
        abrirFicha(pessoa);
    } catch (erro) {
        mostrarFeedback(erro.message, true);
    }
}

async function removerPessoa(id) {
    if (!confirm('Remover esta ficha do cadastro? Esta ação não pode ser desfeita.')) return;

    try {
        const resposta = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado.erro || 'Falha ao remover.');

        mostrarFeedback(resultado.mensagem);
        carregarPessoas(campoBusca.value.trim());
    } catch (erro) {
        mostrarFeedback(erro.message, true);
    }
}

async function salvarFicha(evento) {
    evento.preventDefault();

    const dados = {
        nome: campoNome.value.trim(),
        cpf: campoCpf.value.trim(),
        email: campoEmail.value.trim(),
        telefone: campoTelefone.value.trim(),
        data_nascimento: campoNascimento.value || null,
    };

    const id = campoId.value;
    const url = id ? `${API_URL}?id=${id}` : API_URL;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        const resultado = await resposta.json();

        if (!resposta.ok) {
            exibirErrosFicha(resultado.erros || [resultado.erro || 'Não foi possível salvar.']);
            return;
        }

        fecharFicha();
        mostrarFeedback(resultado.mensagem);
        carregarPessoas(campoBusca.value.trim());
    } catch (erro) {
        exibirErrosFicha(['Erro de comunicação com o servidor.']);
    }
}

function exibirErrosFicha(erros) {
    fichaErros.innerHTML = erros.map((e) => `<li>${escapar(e)}</li>`).join('');
    fichaErros.hidden = false;
}

function mostrarFeedback(mensagem, ehErro = false) {
    feedback.textContent = mensagem;
    feedback.hidden = false;
    feedback.classList.toggle('feedback--erro', ehErro);
    setTimeout(() => { feedback.hidden = true; }, 4000);
}

function mascararCpf(e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
}

function mascararTelefone(e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    e.target.value = v;
}

function formatarData(data) {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}