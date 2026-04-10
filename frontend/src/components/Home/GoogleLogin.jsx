
export const handleGoogleLogin = async (hideModal) => {
  hideModal();
  window.open(import.meta.env.VITE_BASE_URL + "/api/auth/google", "_self");
};