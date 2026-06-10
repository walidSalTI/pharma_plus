import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flower2, Upload, CheckCircle, Pill, Building2 } from 'lucide-react';
import { authApi } from '../services/auth.service';
import validate from '../validation/registration.schema';

const ROLES = [
  { id: 'pharmacist', label: 'Pharmacist', icon: Pill },
  { id: 'company', label: 'Pharma Company', icon: Building2 },
];

const PharmacistRegistration = () => {
  const [role, setRole] = useState('pharmacist');
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', license: '', syndicateCard: null,
    companyName: '', regNumber: '', commercialReg: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    const sanitized = id === 'phone' ? value.replace(/[^\d\s\-+()]/g, '') : value;
    setFormData(prev => ({ ...prev, [id]: files ? files[0] : sanitized }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, role };
    const validationErrors = validate(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    const payload = new FormData();
    Object.keys(data).forEach(key => data[key] && payload.append(key, data[key]));
    try {
      await authApi.register(payload);
      setSubmitted(true);
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 antialiased">
        <main className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-ambient p-12 lg:p-16 text-center">
          <CheckCircle className="text-primary mx-auto mb-6" size={48} />
          <h1 className="text-3xl font-bold text-on-surface mb-4">Application Submitted</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
            Your registration has been received. Our team will review your information and you'll receive an email once your account is approved.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-all"
          >
            Return to Login
          </Link>
        </main>
      </div>
    );
  }

  const isCompany = role === 'company';

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 antialiased">
      <main className="w-full max-w-6xl bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden flex flex-col lg:flex-row relative">

        <div className="w-full lg:w-5/12 bg-surface-container-low p-12 lg:p-16 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-16">
              <Flower2 className="text-primary" size={24} />
              <span className="font-extrabold text-xl tracking-tight text-primary">Aura Health</span>
            </div>

            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold text-on-surface mb-6">
              Elevating pharmacy practice.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              Join a network designed to reduce cognitive load and put patient care first.
            </p>
          </div>

          <div className="mt-12 flex justify-start">
            <img
              src="/images/register.png"
              alt="Pharmacy Registration"
              className="w-48 h-48 object-contain opacity-90"
            />
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">Create Account</h2>
            <p className="text-on-surface-variant">Select your account type and fill in the details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">I am a</label>
              <div className="flex gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                        role === r.id
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <Icon size={18} />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isCompany ? (
                <>
                  <InputField id="companyName" label="Company Name" value={formData.companyName} onChange={handleChange} error={errors.companyName} />
                  <InputField id="regNumber" label="Registration Number" value={formData.regNumber} onChange={handleChange} error={errors.regNumber} />
                </>
              ) : (
                <>
                  <InputField id="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} error={errors.fullName} />
                  <InputField id="license" label="License Number" value={formData.license} onChange={handleChange} error={errors.license} />
                </>
              )}
              <InputField id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
              <InputField id="phone" label="Phone Number" type="tel" value={formData.phone} onChange={handleChange} error={errors.phone} />
            </div>

            <div className="flex flex-col space-y-2 pt-4">
              <label className="text-[0.75rem] font-bold uppercase text-on-surface-variant ml-1">
                {isCompany ? 'Upload Commercial Register' : 'Upload Syndicate Card'}
              </label>
              <label className={`border border-dashed rounded-xl bg-surface-container hover:bg-surface-container-high/50 p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${errors.syndicateCard || errors.commercialReg ? 'border-rose-300' : 'border-outline-variant/40'}`}>
                <Upload className="text-primary mb-2" size={24} />
                <p className="font-semibold text-lg">
                  {isCompany
                    ? (formData.commercialReg ? formData.commercialReg.name : "Drag and drop your register here")
                    : (formData.syndicateCard ? formData.syndicateCard.name : "Drag and drop your card here")
                  }
                </p>
                <input
                  type="file"
                  id={isCompany ? 'commercialReg' : 'syndicateCard'}
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
              {errors.syndicateCard && <p className="text-xs text-rose-500 font-medium">{errors.syndicateCard}</p>}
              {errors.commercialReg && <p className="text-xs text-rose-500 font-medium">{errors.commercialReg}</p>}
            </div>

            <button disabled={loading} className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-all disabled:opacity-60">
              {loading ? 'Processing...' : 'Submit Registration'}
            </button>

            <p className="text-center text-sm text-on-surface-variant mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
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
    {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
  </div>
);

export default PharmacistRegistration;
