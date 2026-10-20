import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;

// Contraseñas más usadas (y variantes locales obvias). No pretende ser
// exhaustiva: junto con la longitud mínima descarta lo que un ataque de
// diccionario prueba primero.
const COMUNES = new Set([
  "123456", "1234567", "12345678", "123456789", "1234567890", "12345678910", "0123456789",
  "password", "password1", "password12", "password123", "passw0rd", "contraseña", "contrasena",
  "contrasena1", "contraseña1", "qwerty", "qwerty123", "qwertyuiop", "asdfghjkl", "zxcvbnm",
  "111111", "000000", "abc123", "abcd1234", "iloveyou", "admin", "admin123", "admin1234",
  "administrador", "bienvenido", "bienvenido1", "argentina", "argentina1", "boca1234",
  "river1234", "futbol", "superman", "dragon", "monkey", "letmein", "welcome", "welcome1",
  "traza", "traza123", "traza1234", "demo1234", "changeme", "cambiame", "test1234",
]);

function esTrivial(password: string) {
  const lower = password.toLowerCase();
  if (COMUNES.has(lower)) return true;
  if (/^(.)\1+$/.test(password)) return true; // "aaaaaaaaaa"
  if (/^\d+$/.test(password) && "01234567890123456789".includes(password)) return true;
  if (/^\d+$/.test(password) && "98765432109876543210".includes(password)) return true;
  return false;
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(128, "La contraseña es demasiado larga")
  .refine((p) => !esTrivial(p), "Esa contraseña es demasiado común. Elegí otra.");

// Rechaza contraseñas que contienen el usuario del email (ej. "mlopez2024"
// para mlopez@empresa.com), algo que un atacante prueba siempre.
export function passwordContieneEmail(password: string, email: string) {
  const usuario = email.split("@")[0]?.toLowerCase() ?? "";
  return usuario.length >= 4 && password.toLowerCase().includes(usuario);
}
