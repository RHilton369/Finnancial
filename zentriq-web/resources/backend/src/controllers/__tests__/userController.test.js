
const { updateProfile } = require('../userController');
const User = require('../../models/User');



// Mock do logger para evitar sujeira no console durante os testes
vi.mock('../../utils/logger', () => ({
  info: vi.fn(),
  error: vi.fn(),
}));

describe('User Controller - updateProfile', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(User, 'update');
    
    // Configura os objetos req e res simulados
    req = {
      userId: '123456789012345678901234',
      body: {
        name: 'Usuário Teste',
        monthly_income: 5000,
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('deve atualizar o perfil do usuário e retornar status 200', async () => {
    // Configura o retorno esperado do mock
    const mockUpdatedUser = {
      id: req.userId,
      name: 'Usuário Teste',
      email: 'teste@email.com',
      monthly_income: 5000,
    };
    User.update.mockResolvedValue(mockUpdatedUser);

    // Executa a função (lembrando que asyncHandler retorna um middleware, então chamamos ele como função)
    await updateProfile(req, res, vi.fn());

    // Validações
    expect(User.update).toHaveBeenCalledWith(req.userId, {
      name: 'Usuário Teste',
      monthly_income: 5000,
    });
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: mockUpdatedUser.id,
      name: mockUpdatedUser.name,
      email: mockUpdatedUser.email,
      monthly_income: mockUpdatedUser.monthly_income,
    });
  });

  it('deve lançar erro 404 se o usuário não for encontrado', async () => {
    // Retorna nulo simulando usuário não existente
    User.update.mockResolvedValue(null);

    // O asyncHandler passa o erro para a função next
    const next = vi.fn();

    await updateProfile(req, res, next);

    // Verifica se o middleware chamou next() com um erro
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Usuário não encontrado');
  });
});
