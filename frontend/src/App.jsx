import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, User, Search, Menu, Star, CheckCircle } from 'lucide-react';
import ProductPage from './ProductPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import DashboardPage from './DashboardPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage'; // Import de la Caisse

// --- COMPOSANT PAGE D'ACCUEIL ---
function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:3000/products')
      .then(response => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erreur:", error);
        setLoading(false);
      });
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-10 text-white shadow-lg mb-10 flex flex-col md:flex-row items-center justify-between">
        <div className="mb-6 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Livraison partout au Sénégal 🇸🇳</h1>
          <p className="text-lg opacity-90">Produits vérifiés, stockés à Dakar, livrés en 24h.</p>
        </div>
        <div className="text-6xl">📦</div>
      </div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Star className="text-yellow-500 fill-yellow-500" /> Recommandés pour vous
      </h2>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div 
              key={product.variant_id} 
              onClick={() => navigate(`/product/${product.variant_id || product.id}`)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
            >
              <div className="h-48 bg-gray-100 relative">
                <img src="https://via.placeholder.com/400x400?text=Produit" alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle size={12} /> Stock Hub
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 h-12">{product.title}</h3>
                <div className="text-2xl font-bold text-blue-700 mb-1">{new Intl.NumberFormat('fr-SN').format(product.price)} F</div>
                <button className="w-full bg-blue-100 text-blue-700 font-bold py-2 rounded-lg hover:bg-blue-200 transition mt-2">Voir détails</button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-xl text-gray-400">Rayons vides. Utilisez test.http pour livrer !</p>
          </div>
      )}
    </main>
  );
}

// --- COMPOSANT PRINCIPAL ---
function App() {
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((acc, item) => acc + item.quantity, 0);
    setCartCount(total);
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
        
        <Routes>
          <Route path="/dashboard" element={null} />
          <Route path="*" element={
            <nav className="bg-blue-700 text-white sticky top-0 z-50 shadow-md">
              <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Menu className="w-6 h-6 md:hidden cursor-pointer" />
                  <Link to="/" className="text-2xl font-bold tracking-tight">Market<span className="text-yellow-400">Sénégal</span></Link>
                </div>
                <div className="hidden md:flex flex-1 max-w-xl mx-4">
                  <div className="flex w-full bg-white rounded-lg overflow-hidden">
                    <input type="text" placeholder="Rechercher..." className="w-full px-4 py-2 text-gray-700 outline-none" />
                    <button className="bg-blue-900 px-6 text-white font-bold"><Search size={20} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Link to="/login" className="flex flex-col items-center cursor-pointer hover:text-yellow-300 transition">
                    <User size={24} />
                    <span className="text-xs hidden md:block">Compte</span>
                  </Link>
                  
                  <Link to="/cart" className="flex flex-col items-center cursor-pointer hover:text-yellow-300 transition relative">
                    <ShoppingCart size={24} />
                    <span className="text-xs hidden md:block">Panier</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-blue-700">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </nav>
          } />
        </Routes>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} /> {/* Nouvelle route */}
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;