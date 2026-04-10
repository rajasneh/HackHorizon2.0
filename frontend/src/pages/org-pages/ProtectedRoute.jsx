import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { TktPlzSpinner } from "../../components/Other/Spinner"

export const ProtectedRoute = ({ children }) => {
  const [access, setAccess] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/verify-organsier", {
          method: "GET",
          credentials: "include", 
        });

        const data = await res.json();

        if (res.ok && data.role === "organiser") {
          setAccess(true);
        } else {
          setAccess(false);
        }
      } catch (error) {
        console.error("ProtectedRoute access error:", error);
        setAccess(false);
      }
    };

    checkAccess();
  }, []);

  if (access === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <TktPlzSpinner />
      </div>
    );
  }

  if (access === false) return <Navigate to="/org-login" replace />;

  return children;
};
