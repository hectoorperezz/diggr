const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setIsLoading(true);
  setError('');

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    setIsLoading(false);
    return;
  }

  // Verificar si el email está en período de enfriamiento
  try {
    const checkResponse = await fetch('/api/auth/register/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const checkResult = await checkResponse.json();
    
    if (!checkResult.allowed) {
      setError(checkResult.message);
      setIsLoading(false);
      return;
    }

    // Continuar con el registro normal
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    // ... existing code ...
  } catch (error: any) {
    setError(error.message || 'An error occurred during registration');
    setIsLoading(false);
  }
}; 