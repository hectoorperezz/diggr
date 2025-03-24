-- Asegurarse de que las políticas permitan actualizaciones desde el webhook
-- Crear una política para permitir actualizaciones desde el servidor
CREATE POLICY "Server can update any profile" 
  ON profiles FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Crear una política para permitir inserciones en la tabla de transacciones
CREATE POLICY "Server can insert transactions" 
  ON subscription_transactions FOR INSERT 
  WITH CHECK (true);

