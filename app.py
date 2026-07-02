import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash

# 1. Carrega as variáveis do arquivo .env
load_dotenv()

app = Flask(__name__)
CORS(app) # Permite que o seu front-end acesse a API sem erros de CORS

# 2. Função para conectar ao Banco Neon
def obter_conexao_banco():
    # O psycopg2 precisa que a URL comece com 'postgresql://' ao invés de 'postgres://'
    url_banco = os.getenv("DATABASE_URL")
    if url_banco and url_banco.startswith("postgres://"):
        url_banco = url_banco.replace("postgres://", "postgresql://", 1)
        
    return psycopg2.connect(url_banco)

# 3. Rota para servir os arquivos estáticos (HTML/JS) do seu Front-end
@app.route('/<path:path>')
def servir_arquivos(path):
    return send_from_directory('src/public', path)

@app.route('/')
def index():
    return send_from_directory('src/public', 'login.html')


# ==========================================
#                ROTAS DA API
# ==========================================

# CREATE - Cadastrar Usuário no Neon
@app.route('/api/usuarios', methods=['POST'])
def criar_usuario():
    dados = request.get_json()
    nome = dados.get('nome')
    email = dados.get('email')
    senha = dados.get('senha')
    perfil = dados.get('perfil', 'tecnico')

    try:
        # Criptografia de senha equivalente ao bcrypt
        senha_criptografada = generate_password_hash(senha)

        conexao = obter_conexao_banco()
        cursor = conexao.cursor(cursor_factory=RealDictCursor)
        
        query = """
            INSERT INTO usuarios (nome, email, senha, perfil) 
            VALUES (%s, %s, %s, %s) 
            RETURNING id, nome, email, perfil;
        """
        cursor.execute(query, (nome, email, senha_criptografada, perfil))
        usuario_criado = cursor.fetchone()
        
        conexao.commit()
        cursor.close()
        conexao.close()

        return jsonify({"mensagem": "Usuário salvo com sucesso!", "usuario": usuario_criado}), 201

    except Exception as erro:
        print("Erro no Flask ao salvar no Neon:", erro)
        return jsonify({"error": "Erro interno no banco de dados."}), 500


# READ - Listar Usuários
@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    try:
        conexao = obter_conexao_banco()
        cursor = conexao.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT id, nome, email, perfil FROM usuarios ORDER BY id DESC;")
        usuarios = cursor.fetchall()
        
        cursor.close()
        conexao.close()
        return jsonify(usuarios), 200
    except Exception as erro:
        return jsonify({"error": str(erro)}), 500


# UPDATE - Alterar Usuário
@app.route('/api/usuarios/<int:id>', methods=['PUT'])
def atualizar_usuario(id):
    dados = request.get_json()
    nome = dados.get('nome')
    perfil = dados.get('perfil')

    try:
        conexao = obter_conexao_banco()
        cursor = conexao.cursor(cursor_factory=RealDictCursor)
        
        query = "UPDATE usuarios SET nome = %s, perfil = %s WHERE id = %s RETURNING id, nome, email, perfil;"
        cursor.execute(query, (nome, perfil, id))
        usuario_atualizado = cursor.fetchone()
        
        conexao.commit()
        cursor.close()
        conexao.close()

        if not usuario_atualizado:
            return jsonify({"error": "Usuário não encontrado."}), 404

        return jsonify({"mensagem": "Usuário atualizado!", "usuario": usuario_atualizado}), 200
    except Exception as erro:
        return jsonify({"error": str(erro)}), 500


# DELETE - Excluir Usuário
@app.route('/api/usuarios/<int:id>', methods=['DELETE'])
def deletar_usuario(id):
    try:
        conexao = obter_conexao_banco()
        cursor = conexao.cursor()
        
        cursor.execute("DELETE FROM usuarios WHERE id = %s;", (id,))
        conexao.commit()
        
        cursor.close()
        conexao.close()
        return jsonify({"mensagem": "Deletado com sucesso"}), 200
    except Exception as erro:
        return jsonify({"error": str(erro)}), 500


# POST - Login
@app.route('/api/login', methods=['POST'])
def login():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha')

    try:
        conexao = obter_conexao_banco()
        cursor = conexao.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM usuarios WHERE email = %s;", (email,))
        usuario = cursor.fetchone()
        
        cursor.close()
        conexao.close()

        if not usuario:
            return jsonify({"error": "Usuário não encontrado."}), 401
        
        # Verifica se a senha bate com o hash do banco
        if not check_password_hash(usuario['senha'], senha):
            return jsonify({"error": "Senha incorreta."}), 401

        return jsonify({
            "mensagem": "Login bem-sucedido!", 
            "usuario": {"id": usuario['id'], "nome": usuario['nome'], "perfil": usuario['perfil']}
        }), 200
    except Exception as erro:
        return jsonify({"error": str(erro)}), 500

# ========================================================
#  CRUD DE PACIENTES (Listar e Cadastrar)
# ========================================================
@app.route('/api/pacientes', methods=['GET', 'POST'])
def gerenciar_pacientes():
    conn = obter_conexao_banco()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'POST':
            dados = request.json
            
            # Executa o INSERT com todos os novos campos
            cur.execute("""
                INSERT INTO pacientes (
                    nome, cpf, data_nascimento, telefone, nome_mae, genero, 
                    rua, bairro, numero, cidade, estado, cep, observacoes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                RETURNING id;
            """, (
                dados.get('nome'), dados.get('cpf'), dados.get('data_nascimento'), dados.get('telefone'),
                dados.get('nome_mae'), dados.get('genero'), dados.get('rua'), dados.get('bairro'),
                dados.get('numero'), dados.get('cidade'), dados.get('estado'), dados.get('cep'),
                dados.get('observacoes')
            ))
            
            novo_id = cur.fetchone()['id']
            conn.commit()
            return jsonify({"message": "Paciente cadastrado com sucesso!", "id": novo_id}), 201
            
        else:
            # GET - Listar buscando os novos campos também
            cur.execute("""
                SELECT id, nome, cpf, to_char(data_nascimento, 'YYYY-MM-DD') as data_nascimento, 
                       telefone, nome_mae, genero, rua, bairro, numero, cidade, estado, cep, observacoes 
                FROM pacientes ORDER BY nome ASC;
            """)
            pacientes = cur.fetchall()
            return jsonify(pacientes), 200
            
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({"error": "Este CPF já está cadastrado."}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/pacientes/<int:id>', methods=['PUT', 'DELETE'])
def alterar_paciente(id):
    conn = obter_conexao_banco()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if request.method == 'DELETE':
            cur.execute("DELETE FROM pacientes WHERE id = %s;", (id,))
            conn.commit()
            return jsonify({"message": "Paciente removido!"}), 200
            
        elif request.method == 'PUT':
            dados = request.json
            cur.execute("""
                UPDATE pacientes SET 
                    nome = %s, cpf = %s, data_nascimento = %s, telefone = %s, nome_mae = %s, 
                    genero = %s, rua = %s, bairro = %s, numero = %s, cidade = %s, estado = %s, 
                    cep = %s, observacoes = %s 
                WHERE id = %s;
            """, (
                dados.get('nome'), dados.get('cpf'), dados.get('data_nascimento'), dados.get('telefone'),
                dados.get('nome_mae'), dados.get('genero'), dados.get('rua'), dados.get('bairro'),
                dados.get('numero'), dados.get('cidade'), dados.get('estado'), dados.get('cep'),
                dados.get('observacoes'), id
            ))
            conn.commit()
            return jsonify({"message": "Dados do paciente atualizados!"}), 200
            
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    # 1. O Render envia uma porta dinâmica na variável 'PORT'. Se não existir, usa a 3000 local.
    porta = int(os.environ.get("PORT", 3000))
    
    # 2. Descobre se está rodando no Render ou no seu PC local
    eh_producao = os.environ.get("RENDER") is not None
    
    # 3. Configura o servidor de acordo com o ambiente
    app.run(
        host='0.0.0.0', 
        port=porta, 
        debug=not eh_producao  # Liga o debug (auto-reload) só no seu PC; desliga no Render
    )