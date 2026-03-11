// DEPRECATED: Use useCredentials hook instead  
// This file is kept for backwards compatibility only
import { useCredentials } from "./useCredentials";

export const useVAPICredentials = () => {
  const { vapiCredentials, setVapiCredentials, saveVAPICredentials, hasVAPICredentials, resetVAPIMessage } = useCredentials();
  
  return {
    credentials: vapiCredentials,
    setCredentials: setVapiCredentials,
    saveCredentials: () => saveVAPICredentials(),
    hasCredentials: hasVAPICredentials,
    resetToDefault: resetVAPIMessage
  };
};