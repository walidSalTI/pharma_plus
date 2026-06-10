import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flower2, Pill, Building2 } from 'lucide-react';
import { authApi } from '../services/auth.service';
import validate from '../validation/login.schema';

const ROLES = [
  { id: 'pharmacist', label: 'Pharmacist', icon: Pill },
  { id: 'company', label: 'Pharma Company', icon: Building2 },
];

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('pharmacist');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await authApi.login({ ...formData, role });
      navigate('/Dashboard/AddPharmacy');
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid credentials. Please try again.');
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
              <span className="font-extrabold text-xl tracking-tight text-primary">Aura Health</span>
            </div>

            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold text-on-surface mb-6">
              Welcome back.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              Sign in to manage your pharmacy or company, track inventory, and access analytics.
            </p>
          </div>

          <div className="mt-12 flex justify-start">
            <img
              src="/images/register.png"
              alt="Pharmacy Login"
              className="w-48 h-48 object-contain opacity-90"
            />
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-12 lg:p-16 bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-3">Sign In</h2>
            <p className="text-on-surface-variant">Access your Aura Health dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
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

            <InputField id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <InputField id="password" label="Password" type="password" value={formData.password} onChange={handleChange} error={errors.password} />

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-all mt-4 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Register here
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
