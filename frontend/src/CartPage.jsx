import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    calculateTotal(savedCart);
  }, []);

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
  };

  const updateQuantity = (id, delta) => {
    const newCart = cart.map(item => {
      if (item.variant_id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCart(newCart);
    calculateTotal(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter(item => item.variant_id !== id);
    setCart(newCart);
    calculateTotal(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  // --- NOUVEAU COMPORTEMENT ---
  const handleProceedToCheckout = () => {
    // On redirige simplement vers la page de Caisse
    // La vérification de connexion se fera là-bas
    navigate('/checkout');
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Votre panier est vide</h2>
          <p className="text-gray-500 mb-8">Il semblerait que vous n'ayez pas encore craqué pour nos produits.</p>
          <Link to="/" className="block w-full bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition">
            Retourner à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="text-blue-600" /> Mon Panier ({totalItems})
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LISTE DES PRODUITS */}
          <div className="flex-1 space-y-4">
            {cart.map((item) => (
              <div key={item.variant_id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
                <img src="https://via.placeholder.com/100" alt={item.title} className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <p className="text-blue-600 font-bold">{new Intl.NumberFormat('fr-SN').format(item.price)} F</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                  <button onClick={() => updateQuantity(item.variant_id, -1)} className="p-1 hover:bg-white rounded shadow-sm transition"><Minus size={14} /></button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.variant_id, 1)} className="p-1 hover:bg-white rounded shadow-sm transition"><Plus size={14} /></button>
                </div>

                <button onClick={() => removeFromCart(item.variant_id)} className="text-red-400 hover:text-red-600 p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* RÉSUMÉ & PAIEMENT */}
          <div className="w-full md:w-80">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Résumé</h3>
              
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-medium">{new Intl.NumberFormat('fr-SN').format(total)} F</span>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-gray-500">Livraison estimée</span>
                <span className="text-green-600 font-medium">Gratuit au Hub</span>
              </div>
              
              <div className="flex justify-between mb-6 text-xl font-bold text-blue-800">
                <span>Total</span>
                <span>{new Intl.NumberFormat('fr-SN').format(total)} F</span>
              </div>

              <button 
                onClick={handleProceedToCheckout}
                className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-lg"
              >
                Passer à la caisse <ArrowRight size={18} />
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Paiement sécurisé
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CartPage;