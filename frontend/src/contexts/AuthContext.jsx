import axios, { HttpStatusCode } from "axios";
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:3000/users/api"
});

const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();

  const handleRegister = async (name, username, password) => {
    const request = await client.post("/register", { name, username, password });

    if (request.status === HttpStatusCode.Created) {
      return request.data.message;
    }
  };

  const handleLogin = async (username, password) => {
    const request = await client.post("/login", { username, password });

    if (request.status === HttpStatusCode.Ok) {
      localStorage.setItem("token", request.data.token);
      setUserData({ username });
      navigate("/home");
      return request.data.message;
    }
  };

  const data = { userData, setUserData, handleRegister, handleLogin };

  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;