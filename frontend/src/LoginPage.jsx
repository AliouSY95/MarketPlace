import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, ArrowRight } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    axios.post('http://localhost:3000/login', formData)
      .then(res => {
        // --- SAUVEGARDE EN MÉMOIRE (C'est ici que ça change) ---
        // On enregistre l'utilisateur et son ID pour que le Dashboard puisse les lire
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('wallet', JSON.stringify(res.data.wallet));
        
        alert(`Bienvenue ${res.data.user.full_name} !`);
        navigate('/dashboard'); 
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.erreur || "Erreur de connexion");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Bon retour !</h1>
          <p className="text-gray-500">Connectez-vous pour gérer vos commandes.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                name="phone"
                placeholder="77 000 00 00"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.phone}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                name="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2">
            Se connecter <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-blue-700 font-bold hover:underline">
            Créer un compte
          </Link>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;