import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Chiave per il cookie
const TOKEN_COOKIE = "libibi_auth_token";

// Hook per gestire lo stato di login
export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Verifica token all'avvio e imposta un interval per controllare periodicamente
  useEffect(() => {
    function checkToken() {
      const token = Cookies.get(TOKEN_COOKIE);
      const credentialsExist = typeof window !== 'undefined' && localStorage.getItem('libibi_credentials');
      const loggedIn = !!(token && credentialsExist);
      
      console.log("Cookie libibi_auth_token:", token, "Credentials exist:", !!credentialsExist); // Debug
      setIsLoggedIn(loggedIn);
      setIsChecking(false);
    }
    
    // Controlla subito
    checkToken();
    
    // Controlla ogni 5 secondi invece di ogni secondo per ridurre la frequenza
    const interval = setInterval(checkToken, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return { isLoggedIn, isChecking };
}

// Funzioni di utilità per login/logout (esposte per altri componenti)
export function setLoginCookie(value: string, expiresInDays: number = 7) {
  Cookies.set(TOKEN_COOKIE, value, { expires: expiresInDays });
}

export function clearLoginCookie() {
  Cookies.remove(TOKEN_COOKIE);
}