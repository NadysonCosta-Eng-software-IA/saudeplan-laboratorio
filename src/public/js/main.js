// Detecta automaticamente se está rodando local ou na nuvem (Render)
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"  // URL de teste local
    : "/api";                      // URL de produção na nuvem (Caminho relativo)

// Identifica qual formulário está presente na página atual
const formLogin = document.getElementById('formLogin');
const formUsuario = document.getElementById('formUsuario');

// ==========================================
// LÓGICA DA TELA DE LOGIN
// ==========================================
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;

        try {
            const resposta = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                alert('Login efetuado com sucesso!');
                localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario));
                window.location.href = 'cadastro.html'; // Redireciona para o painel
            } else {
                alert(dados.error || 'Erro ao fazer login.');
            }
        } catch (erro) {
            console.error('Erro na requisição:', erro);
            alert('Erro ao conectar com o servidor.');
        }
    });
}

// ==========================================
// LÓGICA DO CRUD DE USUÁRIOS (cadastro.html)
// ==========================================
if (formUsuario) {
    // Proteger a página: Se não estiver logado, volta pro login
    if (!localStorage.getItem('usuarioLogado')) {
        window.location.href = 'login.html';
    }

    // Botão Sair
    function deslogar() {
    // 1. Apaga os dados do usuário da memória do navegador
    localStorage.removeItem('usuarioLogado');
    
    // 2. Remove qualquer outro token ou sessão que você tenha criado
    sessionStorage.clear();
    
    // 3. Alerta o usuário (opcional)
    alert('Sessão encerrada com sucesso!');
    
    // 4. Redireciona de volta para a tela de login
    window.location.href = '/login.html';
}
    // LISTAR (Read)
    async function carregarUsuarios() {
        const tabelaUsuarios = document.getElementById('tabelaUsuarios');
        
        // SE NÃO VIR A TABELA NA TELA (ex: se estiver na página de login), PARA AQUI E NÃO DÁ ERRO
        if (!tabelaUsuarios) return; 

        try {
            const resposta = await fetch(API_URL + '/usuarios'); // Se a rota no Flask for /api/usuarios
            if (!resposta.ok) throw new Error('Erro ao buscar dados');
            
            const usuarios = await resposta.json();
            tabelaUsuarios.innerHTML = ''; 

            usuarios.forEach(user => {
                const classeBadge = user.perfil === 'admin' ? 'badge-admin' : 'badge-user';    
                tabelaUsuarios.innerHTML += `
                    <tr>
                        <td>#${user.id}</td>
                        <td><strong>${user.nome}</strong></td>
                        <td>${user.email}</td>
                        <td><span class="badge ${classeBadge}">${user.perfil}</span></td>
                        <td style="text-align: right;">
                            <button class="btn btn-warning" style="padding: 6px 12px; font-size: 0.85rem;" 
                                onclick="prepararEdicao(${user.id}, '${user.nome}', '${user.perfil}')">
                                Editar
                            </button>
                            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px;" 
                                onclick="deletarUsuario(${user.id})">
                                Excluir
                            </button>
                        </td>
                    </tr>
                `;
            });
        } catch (erro) {
            console.error('Erro ao listar:', erro);
        }
    }

    // CADASTRAR (Create) ou ATUALIZAR (Update)
    formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();
    
        // Captura o ID (se for string vazia, vira null para facilitar a checagem)
        const id = document.getElementById('usuarioId').value || null;
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        
        // CORREÇÃO AQUI: Capturando o elemento do HTML corretamente antes de pedir o .value
        const campoSenha = document.getElementById('senha');
        const senha = campoSenha ? campoSenha.value : '';
        
        const perfil = document.getElementById('perfil').value;

        // Se tem ID, vai para a rota com ID (PUT). Se não tem, vai para a rota geral (POST).
        const url = id ? `${API_URL}/usuarios/${id}` : `${API_URL}/usuarios`;
        const method = id ? 'PUT' : 'POST';
        
        // No update (PUT), não enviamos email nem senha por essa rota simplificada
        const dadosCorpo = id ? { nome, perfil } : { nome, email, senha, perfil };

        try {
            const resposta = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCorpo)
            });

            if (resposta.ok) {
                alert(id ? 'Usuário atualizado!' : 'Usuário cadastrado!');
                resetarFormulario(); // Certifique-se de que esta função limpa o input oculto 'usuarioId'
                carregarUsuarios();
            } else {
                const erro = await resposta.json();
                alert(erro.error || 'Erro na operação.');
            }
        } catch (erro) {
            console.error('Erro no fetch:', erro);
            alert('Erro de comunicação com a API.');
        }
    });

    // DELETAR (Delete)
    window.deletarUsuario = async (id) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                const resposta = await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' });
                if (resposta.ok) {
                    alert('Usuário removido!');
                    carregarUsuarios();
                }
            } catch (erro) {
                alert('Erro ao deletar.');
            }
        }
    };

    // Preparar campos para EDICAO
    window.prepararEdicao = (id, nome, perfil) => {
    // Preenche o ID oculto e os campos
    document.getElementById('usuarioId').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('perfil').value = perfil;
    
    // Muda o título e o botão principal
    document.getElementById('formTitulo').textContent = "Editar Usuário";
    
    const btnSalvar = document.getElementById('btnSalvar');
    btnSalvar.textContent = "Atualizar Cadastro";
    btnSalvar.className = "btn btn-warning"; // Muda para a cor laranja de edição

    // MOSTRA O BOTÃO CANCELAR
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.style.display = "inline-flex";
};

    function resetarFormulario() {
    const form = document.getElementById('formUsuario');
    if (!form) return;

    form.reset();
    document.getElementById('usuarioId').value = "";
    document.getElementById('formTitulo').textContent = "Gerenciamento de Usuários";

    const btnSalvar = document.getElementById('btnSalvar');
    if (btnSalvar) {
        btnSalvar.textContent = "Salvar Usuário";
        btnSalvar.className = "btn btn-success"; // Volta para o verde
    }

    // ESCONDE O BOTÃO CANCELAR NOVAMENTE
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.style.display = "none";
}

// Vincula o clique do botão cancelar explicitamente quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', resetarFormulario);
    }
});

// Executa ao abrir a página de cadastro
    carregarUsuarios();
}
// ========================================================
//  GERENCIAMENTO DE PACIENTES (JavaScript)
// ========================================================

// Função para calcular a idade exata
function calcularIdade(dataNasc) {
    if (!dataNasc) return '';
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade >= 0 ? `${idade} anos` : 'Data inválida';
}

// Escuta o carregamento da página
document.addEventListener('DOMContentLoaded', () => {
    carregarPacientes();
    // 1. Ativa o cálculo da idade dinâmico
    const campoDataNasc = document.getElementById('dataNascimento');
    const campoIdade = document.getElementById('idadePaciente');
    
    if (campoDataNasc && campoIdade) {
        campoDataNasc.addEventListener('input', () => {
            campoIdade.value = calcularIdade(campoDataNasc.value);
        });
    }

    // 2. Escuta o envio do formulário de pacientes
    const formPaciente = document.getElementById('formPaciente');
    
    if (formPaciente) {
        formPaciente.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede a página de recarregar
            
            const id = document.getElementById('pacienteId').value || null;
            
            // Captura os dados combinando exatamente com o HTML
            const dadosPaciente = {
                nome: document.getElementById('nomePaciente').value,
                nome_mae: document.getElementById('nomeMae').value,
                cpf: document.getElementById('cpfPaciente').value,
                data_nascimento: document.getElementById('dataNascimento').value,
                genero: document.getElementById('generoPaciente').value,
                cep: document.getElementById('cepPaciente').value,
                rua: document.getElementById('ruaPaciente').value,
                numero: document.getElementById('numeroPaciente').value,
                telefone: document.getElementById('telefonePaciente').value,
                bairro: document.getElementById('bairroPaciente').value,
                cidade: document.getElementById('cidadePaciente').value,
                estado: document.getElementById('estadoPaciente').value.toUpperCase(),
                observacoes: document.getElementById('observacoesPaciente').value
            };

            // URL da sua API Flask local (Porta 3000 ou 5000 dependendo do seu projeto)
            const url = id ? API_URL +'pacientes/${id}' : API_URL +'/pacientes';
            const method = id ? 'PUT' : 'POST';

            try {
                const resposta = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosPaciente)
                });

                if (resposta.ok) {
                    alert(id ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!');
                    formPaciente.reset();
                    if(campoIdade) campoIdade.value = ''; // Limpa o campo idade
                    carregarPacientes();

                    if(document.getElementById('btnCancelarPaciente')) {
                        document.getElementById('btnCancelarPaciente').style.display = 'none';
                    }
                } else {
                    const erro = await resposta.json();
                    alert(erro.error || 'Erro ao processar dados no servidor.');
                }
            } catch (err) {
                console.error('Erro no Fetch:', err);
                alert('Erro de comunicação com o servidor Flask.');
            }
        });
    }
});

// Função para carregar e listar os pacientes na tabela
async function carregarPacientes() {
    const tabelaPacientes = document.getElementById('tabelaPacientes');
    if (!tabelaPacientes) return; // Só executa se estiver na página de pacientes

    try {
        // Altere para a porta do seu projeto (3000 ou 5000)
        const resposta = await fetch(API_URL +'/pacientes');
        
        if (!resposta.ok) throw new Error('Erro ao buscar pacientes');
        
        const pacientes = await resposta.json();
        tabelaPacientes.innerHTML = ''; // Limpa a tabela antes de preencher

        if (pacientes.length === 0) {
            tabelaPacientes.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">Nenhum paciente cadastrado ainda.</td></tr>`;
            return;
        }

        pacientes.forEach(p => {
            // Formata a data de nascimento para o padrão brasileiro (DD/MM/AAAA)
            const dataFormatada = p.data_nascimento ? p.data_nascimento.split('-').reverse().join('/') : '---';
            
            tabelaPacientes.innerHTML += `
                <tr>
                    <td>#${p.id}</td>
                    <td><strong>${p.nome}</strong></td>
                    <td>${p.cpf}</td>
                    <td>${dataFormatada}</td>
                    <td>${p.telefone || '---'}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-warning" style="padding: 6px 12px; font-size: 0.85rem;" 
                            onclick="prepararEdicaoPaciente(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                            Editar
                        </button>
                        <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px;" 
                            onclick="deletarPaciente(${p.id})">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (erro) {
        console.error('Erro ao listar pacientes:', erro);
    }
}

// Função para deletar paciente
async function deletarPaciente(id) {
    if (!confirm('Tem certeza que deseja excluir permanentemente este paciente?')) return;

    try {
        const resposta = await fetch(`http://localhost:3000/api/pacientes/${id}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            alert('Paciente removido com sucesso!');
            carregarPacientes(); // Atualiza a lista na tela
        } else {
            const erro = await resposta.json();
            alert(erro.error || 'Erro ao deletar paciente.');
        }
    } catch (err) {
        alert('Erro ao se comunicar com o servidor.');
    }
}
