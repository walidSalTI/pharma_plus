import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import { authApi } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from "react-i18next";

const validate = (t) => (data) => {
  const errors = {};
  if (!data.email.trim()) {
    errors.email = t("validation.emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t("validation.validEmail");
  }
  if (!data.password) {
    errors.password = t("validation.passwordRequired");
  } else if (data.password.length < 8) {
    errors.password = t("validation.passwordLength");
  }
  return errors;
};

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(t)(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      const res = await authApi.login(formData);
      const { token, user } = res.data;

      authLogin(user, token);
      navigate('/Dashboard');
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 401) {
        setServerError(t("auth.invalidCredentials"));
      } else if (status === 403) {
        setServerError(t("auth.unauthorized"));
      } else {
        setServerError(message || t("auth.loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 antialiased">
      <main className="w-full max-w-6xl bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden flex flex-col lg:flex-row relative">

        <div className="w-full lg:w-5/12 bg-surface-container-low p-12 lg:p-16 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-16">
              <Flower2 className="text-primary text-3xl" />
              <span className="font-extrabold text-xl tracking-tight text-primary">{t("brand")}</span>
            </div>

            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold text-on-surface mb-6">
              {t("auth.welcomeBack")}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              {t("auth.welcomeDescription")}
            </p>
          </div>

          <div className="mt-12 flex justify-start">
            <img
              src="/images/register.png"
              alt={t("auth.welcomeDescription")}
              className="w-48 h-48 object-contain opacity-90"
            />
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">{t("auth.signIn")}</h2>
            <p className="text-on-surface-variant">{t("auth.signInDescription")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">

            {serverError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 font-medium">
                {serverError}
              </div>
            )}

            <InputField id="email" label={t("auth.email")} type="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <InputField id="password" label={t("auth.password")} type="password" value={formData.password} onChange={handleChange} error={errors.password} />

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-all mt-4 disabled:opacity-60"
            >
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </button>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              {t("auth.dontHaveAccount")}{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                {t("auth.register")}
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

const InputField = ({ id, label, type = "text", value, onChange, error }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{label}</label>
    <input
      id={id} type={type} value={value} onChange={onChange}
      className={`w-full bg-surface-container-lowest border rounded-md px-4 py-3.5 focus:border-b-2 outline-none transition-all ${
        error ? 'border-rose-300 focus:border-b-rose-500' : 'border-outline-variant/20 focus:border-b-primary'
      }`}
    />
    {error && <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>}
  </div>
);

export default Login;
