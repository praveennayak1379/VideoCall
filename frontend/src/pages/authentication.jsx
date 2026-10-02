import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar
} from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

function Authentication() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // field-level validation errors
  const [errors, setErrors] = useState({});

  const { handleRegister, handleLogin } = useContext(AuthContext);

  // -------------------------
  // VALIDATION
  // -------------------------
  const validate = () => {
    const newErrors = {};

    if (isSignUp && !name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (isSignUp && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    // true only if there are no errors
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------
  // SUBMIT
  // -------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validate()) return; // stop here if invalid

    try {
      if (isSignUp) {
        const result = await handleRegister(name, username, password);
        setIsError(false);
        setMessage(result);

        setIsSignUp(false);
        setName("");
        setPassword("");
      } else {
        const result = await handleLogin(username, password);
        setIsError(false);
        setMessage(result);
      }
    } catch (err) {
      console.log("Auth error:", err);
      setIsError(true);
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  // switch between Sign In / Sign Up
  const switchMode = (signUp) => {
    setIsSignUp(signUp);
    setMessage("");
    setErrors({});
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5"
      }}
    >
      <Paper elevation={5} sx={{ width: "450px", padding: "35px" }}>

        <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
          <Avatar sx={{ backgroundColor: "#1976d2" }}>
            <LockOutlinedIcon />
          </Avatar>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, marginBottom: "25px" }}>
          <Button
            variant={!isSignUp ? "contained" : "text"}
            onClick={() => switchMode(false)}
          >
            SIGN IN
          </Button>

          <Button
            variant={isSignUp ? "contained" : "text"}
            onClick={() => switchMode(true)}
          >
            SIGN UP
          </Button>
        </Box>

        {/* noValidate turns off Chrome's built-in validation */}
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {isSignUp && (
            <TextField
              label="Full Name"
              required
              fullWidth
              value={name}
              error={Boolean(errors.name)}
              helperText={errors.name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: "" });
              }}
            />
          )}

          <TextField
            label="Username"
            required
            fullWidth
            value={username}
            error={Boolean(errors.username)}
            helperText={errors.username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors({ ...errors, username: "" });
            }}
          />

          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            value={password}
            error={Boolean(errors.password)}
            helperText={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: "" });
            }}
          />

          <Button type="submit" variant="contained" fullWidth size="large">
            {isSignUp ? "SIGN UP" : "SIGN IN"}
          </Button>
        </Box>

        {message && (
          <Typography
            sx={{
              marginTop: 2,
              textAlign: "center",
              color: isError ? "error.main" : "success.main"
            }}
          >
            {message}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default Authentication;