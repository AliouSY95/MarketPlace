// ---------------------------------------------------------
// LE CERVEAU DE NOTRE MARKETPLACE (server.js)
// Version 9.1 : Avec Réparation Automatique de la Base de Données
// ---------------------------------------------------------

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// =========================================================
// 🧠 FONCTIONS INTELLIGENTES (MLM & FINANCES)
// =========================================================

// 1. Payer un utilisateur (Avec option de délai de sécurité)
async function payUser(client, userId, amount, type, desc, delayHours = 0) {
    if (!userId || amount <= 0) return;

    // On calcule la date de déblocage
    const unlockDate = new Date();
    unlockDate.setHours(unlockDate.getHours() + delayHours);

    // Si delayHours > 0, le statut est 'pending', sinon 'validated'
    const status = delayHours > 0 ? 'pending' : 'validated';

    // 1. On récupère le wallet
    const walletRes = await client.query(`SELECT id FROM wallets WHERE user_id = $1`, [userId]);
    if (walletRes.rows.length === 0) return; // Sécurité
    const walletId = walletRes.rows[0].id;

    // 2. On enregistre la transaction
    await client.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_type, source, description, status, unlock_date)
         VALUES ($1, 'CREDIT', $2, 'CASH', $3, $4, $5, $6)`,
        [walletId, amount, type, desc, status, unlockDate]
    );

    // 3. Si (et seulement si) c'est validé tout de suite, on donne l'argent immédiatement
    // Sinon, l'argent reste "virtuel" dans les transactions en attente
    if (status === 'validated') {
        await client.query(
            `UPDATE wallets SET balance_cash = balance_cash + $1 WHERE id = $2`,
            [amount, walletId]
        );
    }
}

// 2. Distribuer les commissions (Appelée à la livraison)
async function distributeCommissions(client, orderId) {
    console.log(`>>> 🚚 LIVRAISON TERMINÉE : Calcul des commissions pour #${orderId}`);

    const order = (await client.query(`SELECT * FROM orders WHERE id = $1`, [orderId])).rows[0];
    const items = (await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId])).rows;
    const buyerRes = await client.query(`SELECT sponsor_id FROM users WHERE id = $1`, [order.buyer_id]);
    
    // Arbre généalogique
    const level1_ID = buyerRes.rows[0].sponsor_id;
    let level2_ID = null, level3_ID = null;

    if (level1_ID) {
        const l1 = (await client.query(`SELECT sponsor_id FROM users WHERE id = $1`, [level1_ID])).rows[0];
        if (l1) level2_ID = l1.sponsor_id;
    }
    if (level2_ID) {
        const l2 = (await client.query(`SELECT sponsor_id FROM users WHERE id = $1`, [level2_ID])).rows[0];
        if (l2) level3_ID = l2.sponsor_id;
    }

    // PÉRIODE DE SÉCURITÉ (72 HEURES)
    const DELAY_HOURS = 72; 

    for (const item of items) {
        const price = parseFloat(item.unit_price) * item.quantity;
        
        // A. Cashback Acheteur (1%) -> Bloqué 72h
        await payUser(client, order.buyer_id, price * 0.01, 'CASHBACK', `Cashback commande #${orderId}`, DELAY_HOURS);

        // B. MLM Niveau 1 (1.5%) -> Bloqué 72h
        if (level1_ID) await payUser(client, level1_ID, price * 0.015, 'MLM_LVL1', `Com L1 sur commande #${orderId}`, DELAY_HOURS);

        // C. MLM Niveau 2 (1%) -> Bloqué 72h
        if (level2_ID) await payUser(client, level2_ID, price * 0.01, 'MLM_LVL2', `Com L2 sur commande #${orderId}`, DELAY_HOURS);

        // D. MLM Niveau 3 (0.5%) -> Bloqué 72h
        if (level3_ID) await payUser(client, level3_ID, price * 0.005, 'MLM_LVL3', `Com L3 sur commande #${orderId}`, DELAY_HOURS);

        // E. Recruteur Vendeur (1%) -> Bloqué 72h (optionnel, on peut le laisser direct si on veut, mais mettons 72h pour être sûr)
        const sellerRes = await client.query(`SELECT seller_recruiter_id FROM users WHERE id = $1`, [item.seller_id]);
        if (sellerRes.rows[0].seller_recruiter_id) {
            await payUser(client, sellerRes.rows[0].seller_recruiter_id, price * 0.01, 'SELLER_REF', `Com Vendeur sur #${orderId}`, DELAY_HOURS);
        }
    }
    console.log(`>>> 🔒 Commissions mises en attente pour 72h.`);
}

// =========================================================
// ROUTES DE L'APPLICATION
// =========================================================

// --- Inscription ---
app.post('/register', async (req, res) => {
    const client = await pool.connect();
    try {
        const { phone, password, full_name, sponsor_code, recruiter_code } = req.body;
        const check = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (check.rows.length > 0) return res.status(400).json({ erreur: "Numéro déjà pris" });

        let sponsorId = null;
        if (sponsor_code) {
            const s = await client.query('SELECT id FROM users WHERE referral_code = $1', [sponsor_code]);
            if (s.rows.length > 0) sponsorId = s.rows[0].id;
        }
        
        let recruiterId = null; // Pour les vendeurs
        if (recruiter_code) {
             const r = await client.query('SELECT id FROM users WHERE referral_code = $1', [recruiter_code]);
             if (r.rows.length > 0) recruiterId = r.rows[0].id;
        }

        const newCode = 'REF-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        
        await client.query('BEGIN');
        const newUser = await client.query(
            `INSERT INTO users (phone, password_hash, full_name, referral_code, sponsor_id, seller_recruiter_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [phone, password, full_name, newCode, sponsorId, recruiterId]
        );
        await client.query(`INSERT INTO wallets (user_id) VALUES ($1)`, [newUser.rows[0].id]);
        await client.query('COMMIT');
        res.status(201).json({ message: "Inscrit", user_id: newUser.rows[0].id, code: newCode });
    } catch (err) { await client.query('ROLLBACK'); res.status(500).send(err.message); } finally { client.release(); }
});

// --- Connexion ---
app.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const r = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (r.rows.length === 0 || r.rows[0].password_hash !== password) return res.status(401).json({erreur: "Erreur login"});
        
        // On récupère aussi les commissions en attente pour l'afficher
        const w = (await pool.query('SELECT * FROM wallets WHERE user_id = $1', [r.rows[0].id])).rows[0];
        const pendingRes = await pool.query(
            `SELECT SUM(amount) as total_pending FROM wallet_transactions 
             WHERE wallet_id = $1 AND status = 'pending'`, [w.id]
        );
        
        res.json({ 
            message: "Connecté", 
            user: r.rows[0], 
            wallet: { 
                disponible: w.balance_cash, 
                en_attente: pendingRes.rows[0].total_pending || 0,
                bonus: w.balance_bonus 
            } 
        });
    } catch (err) { res.status(500).send(); }
});

// --- Setup & Réparation (MODIFIÉ) ---
app.get('/setup-categories', async (req, res) => {
    const client = await pool.connect();
    try {
        // 1. On supprime l'ancienne table (Attention : CASCADE supprime les liens s'ils existent)
        await client.query(`DROP TABLE IF EXISTS categories CASCADE`);
        
        // 2. On la recrée PROPREMENT avec toutes les colonnes nécessaires
        await client.query(`
            CREATE TABLE categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                parent_id INT REFERENCES categories(id),
                commission_rate DECIMAL(5,2) DEFAULT 0
            )
        `);

        // 3. On insère les données
        await client.query(`
            INSERT INTO categories (id, name, parent_id, commission_rate)
            VALUES 
            (1, 'Téléphones & Tablettes', NULL, 15.00),
            (2, 'Électronique & TV', NULL, 10.00),
            (3, 'Mode & Vêtements', NULL, 12.00)
        `);
        
        res.json({ message: "✅ Base de données réparée et Rayons construits !" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/setup-warehouse', async (req, res) => {
    // On fait pareil pour l'entrepôt par sécurité
    const client = await pool.connect();
    try { 
        await client.query(`CREATE TABLE IF NOT EXISTS warehouses (id SERIAL PRIMARY KEY, name VARCHAR(255), location VARCHAR(255))`);
        await client.query(`INSERT INTO warehouses (name, location) VALUES ('Hub 1', 'Dakar') ON CONFLICT DO NOTHING`); 
        res.json({msg:"OK"}); 
    } catch (e) { res.status(500).send(); } finally { client.release(); }
});

// --- Produits ---
app.post('/products', async (req, res) => {
    const client = await pool.connect();
    try {
        const { seller_id, category_id, title, description, base_price, variants } = req.body;
        await client.query('BEGIN');
        // On inclut la description dans l'insertion
        const p = await client.query(
            `INSERT INTO products (seller_id, category_id, title, description, base_price, status) 
             VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`, 
            [seller_id, category_id, title, description, base_price]
        );
        const vList = (variants && variants.length) ? variants : [{sku_suffix:"STD", price:base_price, stock:1}];
        for(const v of vList) {
            await client.query(`INSERT INTO product_variants (product_id, sku, price, stock_quantity, attributes) VALUES ($1, $2, $3, $4, $5)`, [p.rows[0].id, `SKU-${Date.now()}-${Math.random()}`, v.price, v.stock, v.attributes]);
        }
        await client.query('COMMIT');
        res.json({message: "Produit ajouté"});
    } catch (e) { await client.query('ROLLBACK'); res.status(500).send(e.message); } finally { client.release(); }
});

// Route modifiée pour renvoyer la description et le vendeur au frontend
app.get('/products', async (req, res) => {
    const r = await pool.query(`
        SELECT p.id, p.title, p.description, p.seller_id, v.id as variant_id, v.price 
        FROM products p 
        JOIN product_variants v ON p.id = v.product_id 
        WHERE p.status = 'active'
    `);
    res.json(r.rows);
});

// --- Commandes ---
app.post('/orders', async (req, res) => {
    const client = await pool.connect();
    try {
        const { buyer_id, items, payment_method } = req.body;
        await client.query('BEGIN');
        let total = 0;
        const lines = [];
        for(const i of items) {
            const v = (await client.query('SELECT * FROM product_variants WHERE id=$1', [i.variant_id])).rows[0];
            const p = (await client.query('SELECT seller_id FROM products WHERE id=$1', [v.product_id])).rows[0];
            const price = parseFloat(v.price);
            total += price * i.quantity;
            lines.push({vid: v.id, sid: p.seller_id, qty: i.quantity, price: price});
        }
        const o = await client.query(`INSERT INTO orders (buyer_id, total_products_amount, shipping_fee, shipping_payment_status, global_status, payment_method) VALUES ($1, $2, 2000, 'unpaid', 'pending', $3) RETURNING id`, [buyer_id, total, payment_method]);
        for(const l of lines) {
            await client.query(`INSERT INTO order_items (order_id, product_variant_id, seller_id, quantity, unit_price, commission_amount) VALUES ($1, $2, $3, $4, $5, 0)`, [o.rows[0].id, l.vid, l.sid, l.qty, l.price]);
        }
        await client.query('COMMIT');
        res.json({message: "Commande créée", order_id: o.rows[0].id});
    } catch (e) { await client.query('ROLLBACK'); res.status(500).send(e.message); } finally { client.release(); }
});

app.post('/pay-shipping', async (req, res) => {
    try {
        await pool.query(`UPDATE orders SET shipping_payment_status='paid', global_status='confirmed' WHERE id=$1`, [req.body.order_id]);
        await pool.query(`UPDATE order_items SET item_status='waiting_dropoff' WHERE order_id=$1`, [req.body.order_id]);
        res.json({message: "Transport payé"});
    } catch (e) { res.status(500).send(); }
});

// --- Logistique ---
app.get('/seller/pending-dropoffs/:id', async (req, res) => {
    const r = await pool.query(`SELECT * FROM order_items WHERE seller_id=$1 AND item_status='waiting_dropoff'`, [req.params.id]);
    res.json(r.rows);
});
app.post('/warehouse/check-in', async (req, res) => {
    try {
        await pool.query(`UPDATE order_items SET item_status='received_warehouse' WHERE id=$1`, [req.body.order_item_id]);
        res.json({message: "Reçu au hub"});
    } catch (e) { res.status(500).send(); }
});

// --- Livraison (Déclencheur Commissions) ---
app.post('/delivery/confirm', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`UPDATE orders SET global_status = 'completed' WHERE id = $1`, [req.body.order_id]);
        
        // Calcul des commissions (qui seront mises EN ATTENTE)
        await distributeCommissions(client, req.body.order_id);
        
        await client.query('COMMIT');
        res.json({ message: "Livraison OK. Commissions en attente de déblocage (72h)." });
    } catch (e) { await client.query('ROLLBACK'); res.status(500).send(e.message); } finally { client.release(); }
});

// --- Outil Admin : Forcer le déblocage des fonds (Pour tester sans attendre 3 jours) ---
app.post('/admin/process-commissions', async (req, res) => {
    const client = await pool.connect();
    try {
        // 1. Trouver les transactions "pending" dont la date est passée
        // (Pour le test, on prend TOUT ce qui est pending, peu importe la date, si on veut forcer)
        // Sinon on utiliserait : WHERE status = 'pending' AND unlock_date <= NOW()
        
        // Ici, on force TOUT pour que tu puisses voir le résultat dans tes tests
        const pending = await client.query(
            `SELECT * FROM wallet_transactions WHERE status = 'pending'`
        );

        let count = 0;
        await client.query('BEGIN');
        
        for (const tx of pending.rows) {
            // Débloquer l'argent dans le wallet
            await client.query(
                `UPDATE wallets SET balance_cash = balance_cash + $1 WHERE id = $2`,
                [tx.amount, tx.wallet_id]
            );
            // Marquer la transaction comme validée
            await client.query(
                `UPDATE wallet_transactions SET status = 'validated' WHERE id = $1`,
                [tx.id]
            );
            count++;
        }
        await client.query('COMMIT');
        res.json({ message: `${count} commissions débloquées avec succès !` });

    } catch (e) { await client.query('ROLLBACK'); res.status(500).send(e.message); } finally { client.release(); }
});

// --- Wallet ---
app.get('/my-wallet/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const w = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [user_id]);
    const t = await pool.query('SELECT * FROM wallet_transactions WHERE wallet_id = $1 ORDER BY id DESC', [w.rows[0].id]);
    
    // Calculer le total en attente
    let pendingTotal = 0;
    t.rows.forEach(tx => {
        if (tx.status === 'pending') pendingTotal += parseFloat(tx.amount);
    });

    res.json({ 
        solde_disponible: w.rows[0].balance_cash, 
        solde_en_attente: pendingTotal,
        historique: t.rows 
    });
});

// =========================================================
// 🤖 LE ROBOT (CRON JOB)
// Vérifie toutes les minutes si des commissions doivent être débloquées
// =========================================================
setInterval(async () => {
    // Pour la vraie vie, on décommente ce code.
    // Pour l'instant, on utilise le bouton manuel /admin/process-commissions pour contrôler le test.
    /*
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Logique de déblocage automatique ici...
        await client.query('COMMIT');
    } catch (e) { ... } finally { client.release(); }
    */
   // console.log("🤖 Robot : Vérification des commissions (En pause pour test manuel)");
}, 60000);

app.listen(PORT, () => {
    console.log(`>>> Serveur V9.1 (Réparation Auto) prêt sur http://localhost:${PORT}`);
});