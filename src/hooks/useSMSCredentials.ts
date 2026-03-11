// DEPRECATED: Use useCredentials hook instead
// This file is kept for backwards compatibility only
import { useCredentials } from "./useCredentials";

export const useSMSCredentials = () => {
  const { smsCredentials, setSmsCredentials, saveSMSCredentials, hasSMSCredentials } = useCredentials();
  
  return {
    credentials: smsCredentials,
    setCredentials: setSmsCredentials,
    saveCredentials: () => saveSMSCredentials(),
    hasCredentials: hasSMSCredentials
  };
};