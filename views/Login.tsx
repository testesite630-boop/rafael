import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { User } from '../types';

// Avatares SVG padrão para inicialização
const defaultAdminAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2QxZDVlYyI+PHBhdGggZD0iTTExLjg1IDIuNDdjLTMuMzIgMC02LjExMyAyLjU5My02LjM1NyA1Ljg3QzguMDYgOS40MyA5Ljc4MiAxMC43NSAxMS44NSAxMC43NWMxLjkxMyAwIDMuNjMtMS4yMSA0LjIyNi0yLjkxMy4yNDQtMS4wMy4zNzQtMi4xMDMuMzc0LTJтовоNCiBDMTguNDUgNS4yNSAxNS40NyAyLjQ3IDExLjg1IDIuNDd6TTExLjg1IDEyLjg3Yy0zLjQ0NSAwLTYuMjUgMi43MDMtNi4yNSA2LjAzdi42NDVjMCAuOTgyLjgwNSAxLjc4NSAxLjc5OCAxLjc4NWg4LjkxYy45OTIgMCAxLjc5Mi0uODA0IDEuNzkyLTEuNzg1di0uNjQ1DQogYzAtMy4zMjgtMi44MDYtNi4wMy02LjI1LTYuMDN6Ii8+PC9zdmc+';
const defaultMotoboyAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2QxZDVlYyI+PHBhdGggZD0iTTYuNDQgMTkuMjVjLS4yMS0uMDQtLjQxLS4xLS42LS4xN2wtMS4zNS0uNDVjLS4yOC0uMDktLjM3LS40My0uMTktLjY5TDEwLjggMi4xOWMuMTYtLjI0LjQ5LS4zMS43MS0uMTZsMS4zNS40NWMuMjguMDkuMzcuNDMuMTkuNjlMNy41NSAxOC45MWMtLjA5LjEzLS4yMy4yMS0uMzguMjEtLjA4IDAtLjE2LS4wMi0uMjQtLjA1eiIvPjxwYXRoIGQ9Ik0xOC4yNCAxNy4yMmMtLjE5LS4wNi0uMzktLjEyLS41OS0uMTlsLTEuMzUtLjQ1Yy0uMjgtLjA5LS4zNy0uNDMtLjE5LS42OUwxOS40NSA0LjNjLjE2LS4yNC40OS0uMzEuNzEtLjE2bDEuMzUuNDVjLjI4LjA5LjM3LjQzLjE5LjY5bC0zLjU2IDEwLjI0Yy0uMDkuMTMtLjIzLjIxLS4zOC4yMS0uMDggMC0uMTctLjAyLS4yNS0uMDZ6Ii8+PHBhdGggZD0iTTExLjg1IDEwLjc1Yy0yLjA4IDAtMy43NyAyLjA5LTMuNzcgNC42N3MwIDEuNTggMCAyLjM3YzAgMi41OCAxLjY5IDQuNjcgMy43NyA0LjY3czMuNzctMi4wOSAzLjc3LTQuNjdjMC0uNzktMy43Ny0xLjU4LTMuNzctMi4zN3oiLz48L3N2cz4=';

// Simulação de banco de dados de usuários
const mockUsersData = [
  {
    id: 'admin-1', name: 'Administrador', role: 'ADMIN' as const, email: 'admin@rl.express', password_plaintext: 'admin123', avatar: defaultAdminAvatar
  },
  {
    id: 'driver-1', name: 'Carlos (Motoboy)', role: 'MOTOBOY' as const, email: 'carlos@rl.express', password_plaintext: 'motoboy123', avatar: defaultMotoboyAvatar
  }
];

// Inicializa os usuários no localStorage se não estiverem presentes
const initializeUsers = () => {
  if (!localStorage.getItem('users')) {
    const usersToStore = mockUsersData.map(({ password_plaintext, ...user }) => user);
    localStorage.setItem('users', JSON.stringify(usersToStore));
  }
  if (!localStorage.getItem('passwords_mock')) {
    const passwords = mockUsersData.reduce((acc, user) => {
      acc[user.id] = user.password_plaintext;
      return acc;
    }, {} as Record<string, string>);
    localStorage.setItem('passwords_mock', JSON.stringify(passwords));
  }
};
initializeUsers();

const Login: React.FC = () => {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => { // Simula a latência da rede
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const passwords: Record<string, string> = JSON.parse(localStorage.getItem('passwords_mock') || '{}');
      
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (foundUser && passwords[foundUser.id] === password) {
        setUser(foundUser);
        navigate(foundUser.role === 'ADMIN' ? '/admin' : '/motoboy');
      } else {
        setError('E-mail ou senha inválidos.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-red-600 to-red-800">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl text-center">
        <div className="mb-8">
          <div className="bg-red-100 dark:bg-red-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold dark:text-white tracking-tight">RL EXPRESS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Acesse seu painel para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>
          
          {error && <p className="text-red-500 text-xs text-left font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>Entrar</span>
            )}
          </button>
           <div className="text-xs text-gray-400 pt-4 text-left space-y-1">
              <p><strong className="font-bold text-gray-500">Admin:</strong> admin@rl.express / admin123</p>
              <p><strong className="font-bold text-gray-500">Motoboy:</strong> carlos@rl.express / motoboy123</p>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
