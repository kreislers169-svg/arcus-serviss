const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Konfigurācija
const PORT = 3000;
const DATA_FILE = './pieteikumi.json';
const CONFIG_FILE = './config.json';
const ARHIVS_FILE = './arhivs.json';
const MANA_PAROLE = "audi2010"; 

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); 

// --- POMGĀFUNKCIJAS ---
const dabutPieteikumus = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (e) { return []; }
};

const dabutKonfigu = () => {
    if (!fs.existsSync(CONFIG_FILE)) return { akcija: "Piesakies remontam jau šodien!", enabled: true };
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE));
    } catch (e) { return { akcija: "Piesakies remontam jau šodien!", enabled: true }; }
};

// --- MARŠRUTI ---

// Galvenā lapa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin panelis
app.get('/admin', (req, res) => {
    if (req.query.password !== MANA_PAROLE) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(`... LOGIN LAPAS KODS (tavs iepriekšējais) ...`.replace('... LOGIN LAPAS KODS (tavs iepriekšējais) ...', loginHtml)); // Piezīme: Šeit ieliec savu login HTML, ja nepieciešams, vai atstāj kā bija
    }
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// LOGIN HTML logs priekš admin!
const loginHtml = `
<!DOCTYPE html>
<html lang="lv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <title>ARCUS ADMIN | Autorizācija</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: radial-gradient(circle at 0% 0%, #1a1a1a 0%, #050505 100%);
            overflow: hidden;
            color: white;
        }
        .glass {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .glow {
            position: absolute;
            width: 300px;
            height: 300px;
            background: #dc2626;
            filter: blur(120px);
            opacity: 0.15;
            z-index: 0;
            border-radius: 50%;
        }
        input::placeholder {
            letter-spacing: 0.2em;
            font-size: 0.75rem;
            opacity: 0.5;
        }
        .btn-gradient {
            background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-gradient:hover {
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.4);
            transform: translateY(-2px);
            filter: brightness(1.1);
        }
    </style>
</head>
<body class="flex flex-col items-center justify-center h-screen p-4">
    <div class="glow" style="top: -100px; left: -100px;"></div>
    <div class="glow" style="bottom: -100px; right: -100px; background: #450a0a;"></div>

    <div class="glass p-10 md:p-16 rounded-[48px] w-full max-w-[440px] relative z-10 mb-8">
        <div class="text-center mb-12">
            <div class="inline-block px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 mb-6">
                <span class="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Drošības Protokols</span>
            </div>
            <h1 class="text-5xl font-black text-white italic tracking-tighter uppercase">
                ARCUS <span class="text-white/20">ADMIN</span>
            </h1>
        </div>

        <form action="/admin" method="GET" class="space-y-6">
            <div class="relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
                <input type="password" name="password" autofocus required
                       placeholder="IEVADIET PAROLI" 
                       class="relative w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-bold text-white outline-none focus:border-red-600/50 transition-all tracking-[0.3em]">
            </div>

            <button type="submit" 
                    class="btn-gradient w-full text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg">
                AUTORIZĒTIES
            </button>
        </form>

        <div class="mt-12 text-center">
            <a href="/" class="text-[10px] font-bold text-white/20 hover:text-white/60 uppercase tracking-[0.2em] transition-all">
                ← Atgriezties mājaslapā
            </a>
        </div>
    </div>

    <div class="relative z-10 text-[10px] font-medium text-white/20 uppercase tracking-[0.2em] text-center">
        © 2026 ARCUS TĪKLS. Visas tiesības aizsargātas.
    </div>
</body>
</html>
`;

// --- API ---

// Ielādēt visus Kanban
app.get('/api/admin/orders', (req, res) => {
    res.json(dabutPieteikumus());
});

// KLIENTA VĒSTURE (Meklē aktīvajos + arhīvā)
app.get('/api/admin/history', (req, res) => {
    try {
        const phone = req.query.phone;
        if (!phone) return res.json([]);

        let allData = dabutPieteikumus();
        
        if (fs.existsSync(ARHIVS_FILE)) {
            const archiveData = JSON.parse(fs.readFileSync(ARHIVS_FILE, 'utf8') || '[]');
            allData = [...allData, ...archiveData];
        }

        const history = allData.filter(o => String(o.talrunis) === String(phone));
        res.json(history.reverse());
    } catch (e) {
        res.status(500).json([]);
    }
});

// PIETEIKUMA IESNIEGŠANA
app.post('/pieteikt-servisu', (req, res) => {
    const visi = dabutPieteikumus();
    visi.push({
        id: Date.now().toString(),
        vards: req.body.vards,
        talrunis: req.body.talrunis,
        email: req.body.email,
        pakalpojums: req.body.pakalpojums,
        apraksts: req.body.apraksts || "",
        statuss: "Saņemts",
        datums: new Date().toLocaleString('lv-LV')
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(visi, null, 2));
    res.sendStatus(200);
});

// STATUSS KLIENTAM
app.post('/check-status', (req, res) => {
    const p = dabutPieteikumus().find(p => p.talrunis === req.body.talrunis);
    res.json(p ? { success: true, statuss: p.statuss, vards: p.vards } : { success: false });
});

// UPDATE MEISTARS
app.post('/api/admin/update-master', (req, res) => {
    let orders = dabutPieteikumus();
    const idx = orders.findIndex(o => o.id === req.body.id);
    if (idx !== -1) {
        orders[idx].meistars = req.body.meistars;
        fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
        return res.json({ success: true });
    }
    res.status(404).json({ success: false });
});

// UPDATE STATUS (Drag&Drop)
app.post('/api/admin/update-status', (req, res) => {
    let orders = dabutPieteikumus();
    const idx = orders.findIndex(o => o.id === req.body.id);
    if (idx !== -1) {
        orders[idx].statuss = req.body.newStatus;
        fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
        return res.json({ success: true });
    }
    res.status(404).json({ success: false });
});

// DZĒST (Arhivēt)
app.delete('/api/admin/delete/:id', (req, res) => {
    try {
        const id = req.params.id;
        let orders = dabutPieteikumus();
        const idx = orders.findIndex(o => o.id === id);

        if (idx !== -1) {
            const orderToArchive = orders[idx];
            let archive = [];
            if (fs.existsSync(ARHIVS_FILE)) {
                archive = JSON.parse(fs.readFileSync(ARHIVS_FILE, 'utf8') || '[]');
            }

            archive.push({ 
                ...orderToArchive, 
                archivedAt: new Date().toLocaleString('lv-LV'),
                statuss: 'ARHIVĒTS' 
            });
            orders.splice(idx, 1);

            fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
            fs.writeFileSync(ARHIVS_FILE, JSON.stringify(archive, null, 2));
            return res.json({ success: true });
        }
        res.status(404).send("Nav atrasts");
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// BANNERA API
app.get('/api/settings/banner', (req, res) => {
    const c = dabutKonfigu();
    res.json({ enabled: c.enabled, text: c.akcija });
});

app.post('/api/settings/banner', (req, res) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ enabled: req.body.enabled, akcija: req.body.text }, null, 2));
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`🚀 Serveris gatavs: http://localhost:${PORT}`));