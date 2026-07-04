import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import { authApi } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const GENDERS = [
  { value: 'male' },
  { value: 'female' },
];

const validate = (data, t) => {
  const errors = {};
  if (!data.f_name?.trim()) {
    errors.f_name = t("validation.firstNameRequired");
  }
  if (!data.l_name?.trim()) {
    errors.l_name = t("validation.lastNameRequired");
  }
  if (!data.email?.trim()) {
    errors.email = t("validation.emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t("validation.validEmail");
  }
  if (!data.phone_number?.trim()) {
    errors.phone_number = t("validation.phoneRequired");
  } else if (!/^[\d\s\-+()]{7,20}$/.test(data.phone_number)) {
    errors.phone_number = t("validation.validPhone");
  }
  if (!data.password) {
    errors.password = t("validation.passwordRequired");
  } else if (data.password.length < 8) {
    errors.password = t("validation.passwordLength");
  }
  if (!data.password_confirmation) {
    errors.password_confirmation = t("validation.confirmPasswordRequired");
  } else if (data.password !== data.password_confirmation) {
    errors.password_confirmation = t("validation.passwordsDoNotMatch");
  }
  if (!data.age) {
    errors.age = t("validation.ageRequired");
  } else {
    const ageNum = parseInt(data.age, 10);
    if (isNaN(ageNum) || ageNum < 20 || ageNum > 70) {
      errors.age = t("validation.ageRange");
    }
  }
  if (!data.gender) {
    errors.gender = t("validation.genderRequired");
  }
  return errors;
};

export default function PharmacistRegistration() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    f_name: '', l_name: '', email: '', phone_number: '',
    password: '', password_confirmation: '', age: '', gender: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { id, value } = e.target;
    const sanitized = id === 'phone_number' ? value.replace(/[^\d\s\-+()]/g, '') : value;
    setFormData(prev => ({ ...prev, [id]: sanitized }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      const fd = new FormData();
      fd.append("f_name", formData.f_name);
      fd.append("l_name", formData.l_name);
      fd.append("email", formData.email);
      fd.append("phone_number", formData.phone_number);
      fd.append("password", formData.password);
      fd.append("password_confirmation", formData.password_confirmation);
      fd.append("age", formData.age);
      fd.append("gender", formData.gender);
      if (formData.location) fd.append("location", formData.location);
      const res = await authApi.register(fd);
      const { user, token } = res.data;
      if (token && user) {
        authLogin(user, token);
      }
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.response?.data?.message || error.message || t("auth.registrationFailed"));
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
              {t("auth.registerHeading")}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              {t("auth.registerDescription")}
            </p>
          </div>

          <div className="mt-12 flex justify-start">
            <img
              src="/images/register.png"
              alt={t("auth.registerHeading")}
              className="w-48 h-48 object-contain opacity-90"
            />
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">{t("auth.createAccount")}</h2>
            <p className="text-on-surface-variant">{t("auth.formDescription")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">

            {serverError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 font-medium">
                {serverError}
              </div>
            )}

            <div className="flex gap-4">
              <InputField id="f_name" label={t("auth.firstName")} value={formData.f_name} onChange={handleChange} error={errors.f_name} placeholder={t("placeholders.nameExample")} containerClass="flex-1" />
              <InputField id="l_name" label={t("auth.lastName")} value={formData.l_name} onChange={handleChange} error={errors.l_name} placeholder="Doe" containerClass="flex-1" />
            </div>

            <InputField id="email" label={t("auth.email")} type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder={t("placeholders.email")} />
            <InputField id="phone_number" label={t("auth.phoneNumber")} type="tel" value={formData.phone_number} onChange={handleChange} error={errors.phone_number} placeholder={t("placeholders.phoneExample")} />

            <div className="flex gap-4">
              <InputField id="password" label={t("auth.password")} type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder={t("placeholders.passwordHint")} containerClass="flex-1" />
              <InputField id="password_confirmation" label={t("auth.confirmPassword")} type="password" value={formData.password_confirmation} onChange={handleChange} error={errors.password_confirmation} placeholder={t("placeholders.reEnterPassword")} containerClass="flex-1" />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col space-y-1.5">
                <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.age")}</label>
                <input
                  id="age" type="number" min={20} max={70} value={formData.age} onChange={handleChange}
                  placeholder={t("placeholders.ageExample")}
                  className={`w-full bg-surface-container-lowest border rounded-md px-4 py-3.5 focus:border-b-2 outline-none transition-all ${
                    errors.age ? 'border-rose-300 focus:border-b-rose-500' : 'border-outline-variant/20 focus:border-b-primary'
                  }`}
                />
                {errors.age && <p className="text-xs text-rose-500 font-medium ml-1">{errors.age}</p>}
              </div>

              <div className="flex-1 flex flex-col space-y-1.5">
                <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{t("auth.gender")}</label>
                <div className="flex gap-2 h-[50px] items-center">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, gender: g.value }));
                        if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                      className={`flex-1 h-full rounded-md text-sm font-bold transition-all ${
                        formData.gender === g.value
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {g.value === 'male' ? t("auth.male") : t("auth.female")}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-xs text-rose-500 font-medium ml-1">{errors.gender}</p>}
              </div>
            </div>

            <InputField id="location" label={t("auth.location")} value={formData.location} onChange={handleChange} error={errors.location} placeholder={t("placeholders.locationExample")} />

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-all disabled:opacity-60"
            >
              {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
            </button>

            <p className="text-center text-sm text-on-surface-variant mt-4">
              {t("auth.alreadyHaveAccount")}{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">{t("auth.signIn")}</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function InputField({ id, label, type = "text", value, onChange, error, placeholder, containerClass = "" }) {
  return (
    <div className={`flex flex-col space-y-1.5 ${containerClass}`}>
      <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full bg-surface-container-lowest border rounded-md px-4 py-3.5 focus:border-b-2 outline-none transition-all ${
          error ? 'border-rose-300 focus:border-b-rose-500' : 'border-outline-variant/20 focus:border-b-primary'
        }`}
      />
      {error && <p className="text-xs text-rose-500 font-medium ml-1">{error}</p>}
    </div>
  );
}
