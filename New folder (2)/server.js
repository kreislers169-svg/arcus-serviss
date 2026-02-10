const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Konfigurācija
const PORT = 3000;
const DATA_FILE = './pieteikumi.json';
const CONFIG_FILE = './config.json';
const MANA_PAROLE = "audi2010"; // Tava parole piekļuvei

// Middleware - nepieciešams, lai saprastu datus no formām
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); 

// Funkcijas datu nolasīšanai
const dabutPieteikumus = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (e) { return []; }
};

const dabutKonfigu = () => {
    if (!fs.existsSync(CONFIG_FILE)) return { akcija: "Piesakies remontam jau šodien!" };
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE));
    } catch (e) { return { akcija: "Piesakies remontam jau šodien!" }; }
};

// --- MARŠRUTI ---

// Galvenā lapa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Akcijas ziņas saņemšana
app.get('/api/settings/banner', (req, res) => {
    const config = dabutKonfigu();
    res.json({ 
        enabled: config.enabled ?? true, // Ja nav definēts, tad ieslēgts
        text: config.akcija || "Piesakies remontam jau šodien!" 
    });
});

// Pieteikuma iesniegšana
app.post('/pieteikt-servisu', (req, res) => {
    const visiPieteikumi = dabutPieteikumus();
    const jauns = {
        id: Date.now().toString(),
        vards: req.body.vards,
        email: req.body.email, 
        talrunis: req.body.talrunis,
        pakalpojums: req.body.pakalpojums,
        apraksts: req.body.apraksts || "Nav apraksta", 
        statuss: "Saņemts",
        datums: new Date().toLocaleString('lv-LV')
    };
    visiPieteikumi.push(jauns);
    fs.writeFileSync(DATA_FILE, JSON.stringify(visiPieteikumi, null, 2));
    res.sendStatus(200);
});

// Statusa pārbaude (klientam)
app.post('/check-status', (req, res) => {
    const talrunis = req.body.talrunis;
    const pieteikums = dabutPieteikumus().find(p => p.talrunis === talrunis);
    if (pieteikums) {
        res.json({ success: true, statuss: pieteikums.statuss, vards: pieteikums.vards });
    } else {
        res.json({ success: false, message: "Pieteikums netika atrasts." });
    }
});

// --- ADMIN SADAĻA ---

// --- ADMIN SADAĻA ---

// Galvenais ienākšanas punkts Admin panelī
app.get('/admin', (req, res) => {
    const parole = req.query.password;

    // 1. Pārbaudām paroli
    if (parole !== MANA_PAROLE) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(`
            <!DOCTYPE html>
            <html lang="lv">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <title>ARCUS ADMIN | Login</title>
                <style>
                    body {
                        background: radial-gradient(circle at top left, #1a1a1a, #000000);
                        overflow: hidden;
                    }
                    .glass {
                        background: rgba(255, 255, 255, 0.03);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    }
                </style>
            </head>
            <body class="flex items-center justify-center h-screen font-sans">
                <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]"></div>
                
                <div class="glass p-12 rounded-[40px] shadow-2xl w-full max-w-md relative overflow-hidden group">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

                    <div class="text-center mb-10">
                        <div class="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-2">Droša Piekļuve</div>
                        <h1 class="text-4xl font-black text-white uppercase italic tracking-tighter">
                            ARCUS <span class="text-gray-500">ADMIN</span>
                        </h1>
                    </div>

                    <form action="/admin" method="GET" class="space-y-6">
                        <div class="relative">
                            <input type="password" name="password" autofocus required
                                placeholder="IEVADIET PAROLI" 
                                class="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-bold text-white outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-600/10 transition-all placeholder:text-gray-600 tracking-[0.2em] text-sm">
                        </div>

                        <button type="submit" 
                            class="w-full bg-red-600 hover:bg-red-700 text-white p-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                            AUTORIZĒTIES
                        </button>
                    </form>

                    <div class="mt-8 text-center">
                        <a href="/" class="text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest transition">
                            Atpakaļ uz galveno lapu
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    // 2. Ja parole pareiza, sūtām jauno Kanban HTML failu
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- API MARŠRUTI (Datiem) ---

// Ielādēt visus pasūtījumus priekš Kanban
app.get('/api/admin/orders', (req, res) => {
    res.json(dabutPieteikumus());
});

// Atjaunot statusu (Drag & Drop darbībai)
app.post('/api/admin/update-status', (req, res) => {
    // API: Dzēst pieteikumu
app.delete('/api/admin/delete/${orderIdToDelete}', (req, res) => {
    let pieteikumi = dabutPieteikumus();
    const jaunie = pieteikumi.filter(p => p.id !== req.params.id);
    
    if (pieteikumi.length !== jaunie.length) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(jaunie, null, 2));
        return res.json({ success: true });
    }
    res.status(404).json({ success: false });
});
    const { id, newStatus } = req.body;
    let pieteikumi = dabutPieteikumus();
    const index = pieteikumi.findIndex(p => p.id === id);
    
    if (index !== -1) {
        pieteikumi[index].statuss = newStatus;
        fs.writeFileSync(DATA_FILE, JSON.stringify(pieteikumi, null, 2));
        return res.json({ success: true });
    }
    res.status(404).json({ success: false });
});

// Akcijas ziņas atjaunošana (Ja vēlies to saglabāt no vecā dizaina)
app.post('/admin/update-akcija', (req, res) => {
    const { akcija, password } = req.body;
    if (password !== MANA_PAROLE) return res.status(403).send("Pieeja liegta");
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ akcija }));
    res.redirect(`/admin?password=${password}`);
});

// Dzēšanas funkcija (Ja izmantosi API)
app.delete('/api/admin/delete/:id', (req, res) => {
    let pieteikumi = dabutPieteikumus();
    const jaunie = pieteikumi.filter(p => p.id !== req.params.id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(jaunie, null, 2));
    res.json({ success: true });
});

// --- BANERA UN KONFIGURĀCIJAS API ---

// Saņemt banera iestatījumus (apvienots ar config)
app.get('/api/settings/banner', (req, res) => {
    const config = dabutKonfigu();
    res.json({ 
        enabled: config.enabled ?? true, 
        text: config.akcija || "Piesakies remontam jau šodien!" 
    });
});

// Saglabāt banera iestatījumus
app.post('/api/settings/banner', (req, res) => {
    const { enabled, text } = req.body;
    
    let config = dabutKonfigu();
    config.enabled = enabled;
    config.akcija = text; // Saglabājam tekstu 'akcija' laukā
    
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Serveris gatavs: http://localhost:${PORT}`));