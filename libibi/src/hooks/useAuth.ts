import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Chiave per il cookie
const TOKEN_COOKIE = "libibi_auth_token";

// Hook per gestire lo stato di login
export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verifica token all'avvio e imposta un interval per controllare periodicamente
  useEffect(() => {
    function checkToken() {
      const token = Cookies.get(TOKEN_COOKIE);
      console.log("Cookie libibi_auth_token:", token); // Debug
      setIsLoggedIn(!!token);
    }
    
    // Controlla subito
    checkToken();
    
    // Controlla ogni secondo (per sviluppo, in produzione usare un intervallo più lungo)
    const interval = setInterval(checkToken, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return isLoggedIn;
}

// Funzioni di utilità per login/logout (esposte per altri componenti)
export function setLoginCookie(value: string, expiresInDays: number = 7) {
  Cookies.set(TOKEN_COOKIE, value, { expires: expiresInDays });
}

export function clearLoginCookie() {
  Cookies.remove(TOKEN_COOKIE);
}