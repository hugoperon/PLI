import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils/test-utils';
import Signup from '../Signup';

describe('Signup Component', () => {
  test('renders signup form', () => {
    render(<Signup />);
    
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
  });

  test('validates password match', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
      target: { value: 'password124' }
    });

    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    expect(await screen.findByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });

  test('handles successful signup', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/nom d'utilisateur/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(screen.getByText(/Inscription réussie/i)).toBeInTheDocument();
    });
  });
});