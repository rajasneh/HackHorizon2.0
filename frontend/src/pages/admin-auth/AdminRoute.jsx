
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";

// export const AdminRoute = ({ children }) => {
//   const { user } = useAuth();

//   if (!user || user.role !== "moderator") {
//     return <Navigate to="/admin/login" replace />;
//   }
 
//   return children;
// };

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { TktPlzSpinner } from "../../components/Other/Spinner"

export const AdminRoute = ({ children }) => {
  const [access, setAccess] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BASE_URL + "/api/auth/verify-admin", {
          method: "GET",
          credentials: "include", // important for cookies
        });

        const data = await res.json();
        if (res.ok && data.role === "moderator") {
          setAccess(true);
        } else {
          setAccess(false);
        }
      } catch (error) {
        console.error("AdminRoute access error:", error);
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

  if (access === false) return <Navigate to="/admin/login" replace />;

  return children;
};