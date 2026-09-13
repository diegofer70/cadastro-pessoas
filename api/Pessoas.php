<?php
/**
 * API REST de Cadastro de Pessoas
 *
 * GET    /api/pessoas.php          -> lista todas as pessoas
 * GET    /api/pessoas.php?id=1     -> busca uma pessoa
 * POST   /api/pessoas.php          -> cria uma pessoa (JSON no corpo)
 * PUT    /api/pessoas.php?id=1     -> atualiza uma pessoa (JSON no corpo)
 * DELETE /api/pessoas.php?id=1     -> remove uma pessoa
 */

header('Content-Type: application/json; charset=utf8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();
$metodo = $_SERVER['REQUEST_METHOD'];

function respond(int $status, $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function validar(array $dados, bool $exigirTodos = true): array
{
    $erros = [];

    if ($exigirTodos || array_key_exists('nome', $dados)) {
        if (empty(trim($dados['nome'] ?? ''))) {
            $erros[] = 'O campo nome é obrigatório.';
        }
    }

    if ($exigirTodos || array_key_exists('cpf', $dados)) {
        $cpf = preg_replace('/\D/', '', $dados['cpf'] ?? '');
        if (strlen($cpf) !== 11) {
            $erros[] = 'CPF inválido — deve conter 11 dígitos.';
        }
    }

    if ($exigirTodos || array_key_exists('email', $dados)) {
        if (!filter_var($dados['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
            $erros[] = 'E-mail inválido.';
        }
    }

    return $erros;
}

function formatarCpf(string $cpf): string
{
    $cpf = preg_replace('/\D/', '', $cpf);
    return substr($cpf, 0, 3) . '.' . substr($cpf, 3, 3) . '.' . substr($cpf, 6, 3) . '-' . substr($cpf, 9, 2);
}

switch ($metodo) {

    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('SELECT * FROM pessoas WHERE id = :id');
            $stmt->execute(['id' => $_GET['id']]);
            $pessoa = $stmt->fetch();

            if (!$pessoa) {
                respond(404, ['erro' => 'Pessoa não encontrada.']);
            }
            respond(200, $pessoa);
        }

        $busca = trim($_GET['busca'] ?? '');
        if ($busca !== '') {
            $stmt = $db->prepare(
                'SELECT * FROM pessoas WHERE nome LIKE :busca OR cpf LIKE :busca OR email LIKE :busca ORDER BY nome'
            );
            $stmt->execute(['busca' => "%{$busca}%"]);
        } else {
            $stmt = $db->query('SELECT * FROM pessoas ORDER BY nome');
        }

        respond(200, $stmt->fetchAll());
        break;

    case 'POST':
        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $erros = validar($dados);

        if (!empty($erros)) {
            respond(422, ['erros' => $erros]);
        }

        $cpfFormatado = formatarCpf($dados['cpf']);

        $stmt = $db->prepare('SELECT id FROM pessoas WHERE cpf = :cpf');
        $stmt->execute(['cpf' => $cpfFormatado]);
        if ($stmt->fetch()) {
            respond(409, ['erros' => ['Já existe uma pessoa cadastrada com este CPF.']]);
        }

        $stmt = $db->prepare(
            'INSERT INTO pessoas (nome, cpf, email, telefone, data_nascimento)
             VALUES (:nome, :cpf, :email, :telefone, :data_nascimento)'
        );
        $stmt->execute([
            'nome' => trim($dados['nome']),
            'cpf' => $cpfFormatado,
            'email' => trim($dados['email']),
            'telefone' => $dados['telefone'] ?? null,
            'data_nascimento' => $dados['data_nascimento'] ?? null,
        ]);

        respond(201, ['id' => (int) $db->lastInsertId(), 'mensagem' => 'Pessoa cadastrada com sucesso.']);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            respond(400, ['erro' => 'Informe o id da pessoa a atualizar.']);
        }

        $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        $erros = validar($dados);

        if (!empty($erros)) {
            respond(422, ['erros' => $erros]);
        }

        $cpfFormatado = formatarCpf($dados['cpf']);

        $stmt = $db->prepare('SELECT id FROM pessoas WHERE cpf = :cpf AND id != :id');
        $stmt->execute(['cpf' => $cpfFormatado, 'id' => $_GET['id']]);
        if ($stmt->fetch()) {
            respond(409, ['erros' => ['Já existe outra pessoa cadastrada com este CPF.']]);
        }

        $stmt = $db->prepare(
            'UPDATE pessoas SET nome = :nome, cpf = :cpf, email = :email,
             telefone = :telefone, data_nascimento = :data_nascimento WHERE id = :id'
        );
        $stmt->execute([
            'nome' => trim($dados['nome']),
            'cpf' => $cpfFormatado,
            'email' => trim($dados['email']),
            'telefone' => $dados['telefone'] ?? null,
            'data_nascimento' => $dados['data_nascimento'] ?? null,
            'id' => $_GET['id'],
        ]);

        if ($stmt->rowCount() === 0) {
            respond(404, ['erro' => 'Pessoa não encontrada.']);
        }

        respond(200, ['mensagem' => 'Cadastro atualizado com sucesso.']);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            respond(400, ['erro' => 'Informe o id da pessoa a remover.']);
        }

        $stmt = $db->prepare('DELETE FROM pessoas WHERE id = :id');
        $stmt->execute(['id' => $_GET['id']]);

        if ($stmt->rowCount() === 0) {
            respond(404, ['erro' => 'Pessoa não encontrada.']);
        }

        respond(200, ['mensagem' => 'Cadastro removido com sucesso.']);
        break;

    default:
        respond(405, ['erro' => 'Método não permitido.']);
}