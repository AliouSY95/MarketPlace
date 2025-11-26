import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Phone, Gift, ArrowRight } from 'lucide-react';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    full_name: '', 
    phone: '', 
    password: '', 
    sponsor_code: '' 
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    axios.post('http://localhost:3000/register', formData)
      .then(res => {
        alert(`Compte créé avec succès ! Votre code de parrainage est : ${res.data.code}`);
        navigate('/login');
      })
      .catch(err => {
        setError(err.response?.data?.erreur || "Erreur lors de l'inscription");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Rejoignez-nous !</h1>
          <p className="text-gray-500">Créez votre compte pour acheter et gagner de l'argent.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" name="full_name" placeholder="Moussa Diop"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.full_name} onChange={handleChange} required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" name="phone" placeholder="77 000 00 00"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.phone} onChange={handleChange} required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" name="password" placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.password} onChange={handleChange} required 
              />
            </div>
          </div>

          {/* SECTION PARRAINAGE (Mise en avant) */}
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <label className="block text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
              <Gift size={16} /> Code Parrain (Optionnel)
            </label>
            <input 
              type="text" name="sponsor_code" placeholder="Ex: REF-A1B2"
              className="w-full px-4 py-2 border border-emerald-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 placeholder-emerald-300"
              value={formData.sponsor_code} onChange={handleChange}
            />
            <p className="text-xs text-emerald-600 mt-1">Entrez un code pour rejoindre une équipe.</p>
          </div>

          <button type="submit" className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2">
            S'inscrire <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-blue-700 font-bold hover:underline">
            Se connecter
          </Link>
        </div>

      </div>
    </div>
  );
}

export default RegisterPage;