import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('http://localhost:5000/api/login', async ({ request }) => {
    const { email, password } = await request.json();

    if (email === 'test@test.com' && password === 'password123') {
      return HttpResponse.json({
        token: 'fake-token',
        user: {
          id: 1,
          email: 'test@test.com',
          username: 'testuser'
        }
      });
    }

    return new HttpResponse(
      JSON.stringify({ message: 'Email ou mot de passe incorrect' }),
      { status: 401 }
    );
  }),

  http.post('http://localhost:5000/api/signup', async ({ request }) => {
    const { username, email, password } = await request.json();

    return HttpResponse.json(
      {
        success: true,
        message: 'Inscription réussie',
        user: {
          id: 1,
          username,
          email
        }
      },
      { status: 201 }
    );
  })
]; 