import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, CreditCard, CheckCircle, AlertCircle, Banknote, Truck, Smartphone, User, ChevronDown } from 'lucide-react';

// GRILLE TARIFAIRE (Simulée)
const DELIVERY_ZONES = {
  'Dakar': 2000,
  'Pikine': 2500,
  'Guédiawaye': 2500,
  'Rufisque': 3000,
  'Thies': 4000,
  'Mbour': 5000,
  'Saint-Louis': 7000,
  'Touba': 6000,
  'Ziguinchor': 8000,
  'Autre': 10000
};

function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [user, setUser] = useState(null);
  
  // Adresse de Livraison
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '', // La ville déterminera le prix
    sameAsBilling: true
  });

  const [billingAddress, setBillingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('WAVE');
  const [loading, setLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState(0); // Frais dynamiques

  // 1. Chargement initial
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');

    if (!storedUser) {
      navigate('/login');
      return;
    }
    if (storedCart.length === 0) {
      navigate('/cart');
      return;
    }

    setUser(storedUser);
    setCart(storedCart);
    
    setAddress(prev => ({
      ...prev,
      fullName: storedUser.full_name,
      phone: storedUser.phone
    }));

    const sum = storedCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setSubTotal(sum);
  }, [navigate]);

  // 2. Calcul dynamique des frais quand la ville change
  useEffect(() => {
    if (address.city && DELIVERY_ZONES[address.city]) {
      setShippingFee(DELIVERY_ZONES[address.city]);
    } else if (address.city) {
      setShippingFee(DELIVERY_ZONES['Autre']);
    } else {
      setShippingFee(0); // Pas de ville, pas de frais affichés
    }
  }, [address.city]);

  // 3. Gestion de la commande
  const handlePlaceOrder = async () => {
    // Validation
    if (!address.addressLine || !address.city) {
      alert("Veuillez choisir une ville et une adresse.");
      return;
    }

    if (!address.sameAsBilling && (!billingAddress.addressLine || !billingAddress.city)) {
      alert("Veuillez compléter l'adresse de facturation.");
      return;
    }

    // Règle spéciale COD : Paiement du transport OBLIGATOIRE
    if (paymentMethod === 'COD') {
        const confirmMsg = `POUR VALIDER VOTRE COMMANDE :\n\nVous avez choisi le paiement à la livraison.\nVous devez d'abord régler les frais de transport de ${new Intl.NumberFormat('fr-SN').format(shippingFee)} FCFA maintenant (via Wave/OM).\n\nLe reste (${new Intl.NumberFormat('fr-SN').format(subTotal + 500)} FCFA) sera payé au livreur.\n\nVoulez-vous payer le transport maintenant ?`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
    }

    setLoading(true);

    const totalAmount = subTotal + shippingFee + (paymentMethod === 'COD' ? 500 : 0);

    const orderData = {
      buyer_id: user.id,
      payment_method: paymentMethod,
      items: cart.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      }))
    };

    try {
      // A. Création au backend
      const response = await axios.post('http://localhost:3000/orders', orderData);
      const orderId = response.data.order_id;

      // B. Paiement du transport (Simulation)
      await axios.post('http://localhost:3000/pay-shipping', { order_id: orderId });

      // C. Sauvegarde locale (Avec les bons statuts)
      const newOrder = {
        id: orderId,
        date: new Date().toISOString(),
        total: totalAmount,
        status: 'En cours de traitement', // Statut initial
        items: cart,
        payment_method: paymentMethod,
        shipping_address: address,
        shipping_fee: shippingFee
      };

      const existingOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
      localStorage.setItem('my_orders', JSON.stringify([newOrder, ...existingOrders]));

      alert(`Commande #${orderId} validée avec succès !`);
      
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event("storage"));
      navigate('/dashboard');

    } catch (error) {
      console.error(error);
      alert("Erreur lors de la commande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Finaliser la commande</h1>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* COLONNE GAUCHE */}
          <div className="flex-1 space-y-6">
            
            {/* 1. ADRESSE DE LIVRAISON */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="text-blue-600" /> Adresse de Livraison
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nom du destinataire</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-blue-500 outline-none bg-white" 
                      placeholder="Prénom & Nom"
                      value={address.fullName} 
                      onChange={(e) => setAddress({...address, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Téléphone du destinataire</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-blue-500 outline-none bg-white" 
                      placeholder="77..."
                      value={address.phone} 
                      onChange={(e) => setAddress({...address, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1">Ville (Détermine les frais)</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border rounded-lg bg-white outline-none appearance-none cursor-pointer"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                  >
                    <option value="">-- Choisir une ville --</option>
                    {Object.keys(DELIVERY_ZONES).map(city => (
                        <option key={city} value={city}>{city} ({DELIVERY_ZONES[city]} F)</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1">Quartier / Rue / Indications</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:border-blue-500 outline-none" 
                  placeholder="Ex: Liberté 6, près de la boulangerie..."
                  value={address.addressLine}
                  onChange={(e) => setAddress({...address, addressLine: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2 mt-4 pb-2">
                <input 
                  type="checkbox" 
                  id="billing" 
                  className="w-5 h-5 text-blue-600"
                  checked={address.sameAsBilling}
                  onChange={(e) => setAddress({...address, sameAsBilling: e.target.checked})}
                />
                <label htmlFor="billing" className="text-sm text-gray-700 cursor-pointer font-medium">
                  L'adresse de facturation est identique.
                </label>
              </div>

              {/* FACTURATION */}
              {!address.sameAsBilling && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Adresse de Facturation</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nom complet</label>
                        <input type="text" className="w-full p-3 border rounded-lg outline-none" placeholder="Nom" value={billingAddress.fullName} onChange={(e) => setBillingAddress({...billingAddress, fullName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Téléphone</label>
                        <input type="text" className="w-full p-3 border rounded-lg outline-none" placeholder="Numéro" value={billingAddress.phone} onChange={(e) => setBillingAddress({...billingAddress, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Adresse & Ville</label>
                    <input type="text" className="w-full p-3 border rounded-lg outline-none" placeholder="Adresse complète" value={billingAddress.addressLine} onChange={(e) => setBillingAddress({...billingAddress, addressLine: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            {/* 3. PAIEMENT */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-600" /> Moyen de Paiement
              </h2>
              
              <div className="space-y-3">
                {/* Wave */}
                <div onClick={() => setPaymentMethod('WAVE')} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'WAVE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center border-gray-400">
                      {paymentMethod === 'WAVE' && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
                    </div>
                    <span className="font-bold text-blue-900">Wave</span>
                  </div>
                </div>

                {/* Orange Money */}
                <div onClick={() => setPaymentMethod('OM')} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'OM' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center border-gray-400">
                      {paymentMethod === 'OM' && <div className="w-3 h-3 bg-orange-600 rounded-full"></div>}
                    </div>
                    <span className="font-bold text-orange-700">Orange Money</span>
                  </div>
                </div>

                {/* Carte Bancaire */}
                <div onClick={() => setPaymentMethod('CARD')} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'CARD' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center border-gray-400">
                      {paymentMethod === 'CARD' && <div className="w-3 h-3 bg-purple-600 rounded-full"></div>}
                    </div>
                    <span className="font-bold text-purple-900">Carte Bancaire</span>
                  </div>
                  <CreditCard size={20} className="text-purple-400"/>
                </div>

                {/* COD */}
                <div onClick={() => setPaymentMethod('COD')} className={`flex items-start justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'COD' ? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center border-gray-400 mt-1">
                      {paymentMethod === 'COD' && <div className="w-3 h-3 bg-gray-800 rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-bold text-gray-700 block">Paiement à la livraison</span>
                      {paymentMethod === 'COD' && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex gap-2 items-start">
                          <Truck size={16} className="shrink-0 mt-0.5" />
                          <span><strong>Important :</strong> Frais de transport à payer d'avance.</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Banknote size={20} className="text-gray-400"/>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : RÉSUMÉ */}
          <div className="w-full md:w-80">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Commande</h3>
              
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto text-sm">
                {cart.map(item => (
                  <div key={item.variant_id} className="flex justify-between text-gray-600">
                    <span>{item.quantity}x {item.title.substring(0, 15)}...</span>
                    <span>{new Intl.NumberFormat('fr-SN').format(item.price * item.quantity)} F</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span>{new Intl.NumberFormat('fr-SN').format(subTotal)} F</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Livraison ({address.city || "?"})</span>
                  <span className="text-blue-600 font-bold">{shippingFee > 0 ? new Intl.NumberFormat('fr-SN').format(shippingFee) + ' F' : '--'}</span>
                </div>
                {paymentMethod === 'COD' && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Frais COD</span>
                    <span>+500 F</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-4 mb-6 text-xl font-bold text-blue-800 border-t pt-4">
                <span>Total</span>
                <span>{new Intl.NumberFormat('fr-SN').format(subTotal + shippingFee + (paymentMethod === 'COD' ? 500 : 0))} F</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                className={`w-full text-white font-bold py-4 rounded-xl transition shadow-lg flex flex-col items-center justify-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed ${paymentMethod === 'COD' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {loading ? "Traitement..." : (
                  paymentMethod === 'COD' 
                    ? <>
                        <span className="text-sm uppercase">Payer transport ({new Intl.NumberFormat('fr-SN').format(shippingFee)} F)</span>
                        <span className="text-[10px] font-normal opacity-80">& VALIDER LA COMMANDE</span>
                      </>
                    : "CONFIRMER LA COMMANDE"
                )}
              </button>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex gap-2 items-start">
                  <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Satisfait ou Remboursé :</strong> Vous avez 72h pour retourner le produit si vous n'êtes pas satisfait. Passé ce délai, nous ne reprendrons pas le colis.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;