-- Función para actualizar la suscripción
CREATE OR REPLACE FUNCTION update_subscription(
  p_user_id UUID,
  p_tier TEXT,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_customer_id TEXT,
  p_subscription_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    subscription_tier = p_tier,
    subscription_start_date = p_start_date,
    subscription_end_date = p_end_date,
    stripe_customer_id = p_customer_id,
    stripe_subscription_id = p_subscription_id,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para insertar una transacción de suscripción
CREATE OR REPLACE FUNCTION insert_subscription_transaction(
  p_user_id UUID,
  p_amount DECIMAL,
  p_status TEXT,
  p_payment_method TEXT,
  p_tier TEXT,
  p_session_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO subscription_transactions (
    user_id,
    amount,
    status,
    payment_method,
    subscription_tier,
    stripe_session_id,
    transaction_date
  ) VALUES (
    p_user_id,
    p_amount,
    p_status,
    p_payment_method,
    p_tier,
    p_session_id,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar el estado de la suscripción
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_user_id UUID,
  p_tier TEXT,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    subscription_tier = p_tier,
    subscription_end_date = p_end_date,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para cancelar una suscripción
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    subscription_tier = 'free',
    subscription_end_date = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

