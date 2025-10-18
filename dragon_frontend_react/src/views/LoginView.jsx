import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth";
import { login } from "../services/auth";
import styles from "../assets/styles/login.module.css";
import logo from "../assets/images/logo.png";

const LoginView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthStore();

  // Form data
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    general: "",
  });

  // Computed property
  const isFormValid = useMemo(() => {
    return username.trim() && password.length >= 6 && !loading;
  }, [username, password, loading]);

  // Validation functions
  const validateUsername = () => {
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, username: "Username is required" }));
      return false;
    }
    if (username.length < 3) {
      setErrors((prev) => ({
        ...prev,
        username: "Username must be at least 3 characters",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, username: "" }));
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return false;
    }
    if (password.length < 6) {
      setErrors((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  const validateForm = () => {
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    return isUsernameValid && isPasswordValid;
  };

  // Clear errors when user starts typing
  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const tokens = await login(username.trim(), password);
      auth.setTokens(tokens, rememberMe, username);

      // Redirect to teams or intended route
      const redirectTo =
        new URLSearchParams(location.search).get("redirect") || "/teams";
      navigate(redirectTo);
    } catch (err) {
      console.error("LoginView error:", err);

      // Handle different error types
      if (err.response?.status === 401) {
        setErrors((prev) => ({
          ...prev,
          general: "Invalid username or password",
        }));
      } else if (err.response?.status === 429) {
        setErrors((prev) => ({
          ...prev,
          general: "Too many login attempts. Please try again later.",
        }));
      } else if (err.response?.data?.message) {
        setErrors((prev) => ({ ...prev, general: err.response.data.message }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general:
            "LoginView failed. Please check your connection and try again.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        {/* Dragon Boat Themed Header */}
        <div className={styles.loginHeader}>
          <div className={styles.appLogo}>
            <img alt="DragonBoat Logo" src={logo} width="128" height="128" />
            <h1 className={styles.appTitle}>DragonBoat Manager</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to manage your dragon boat teams</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {/* Username Field */}
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <div className={styles.inputContainer}>
              <input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError("username");
                }}
                onBlur={validateUsername}
                type="text"
                autoComplete="username"
                required
                className={errors.username ? "error" : ""}
                placeholder="Enter your username"
              />
              {username && !errors.username && (
                <div className={styles.inputSuccess}>
                  <svg
                    className={styles.successIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
            {errors.username && (
              <p className={styles.errorMessage}>{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputContainer}>
              <input
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                onBlur={validatePassword}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className={errors.password ? "error" : ""}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.passwordToggle}
              >
                {showPassword ? (
                  <svg
                    className={styles.toggleIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className={styles.toggleIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className={styles.errorMessage}>{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className={styles.formOptions}>
            <label className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              Remember me
            </label>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className={styles.generalError}>
              <svg
                className={styles.errorIcon}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`${styles.loginButton}${loading ? " loading" : ""}`}
          >
            {loading && (
              <svg
                className={styles.loadingSpinner}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>

        <div className={styles.demoHelp}>
          <p className={styles.demoText}>
            <strong>Demo credentials:</strong>
            <br />
            Username: <code>test_user</code>
            <br />
            Password: <code>test_user1234</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
