const fs = require('fs');
const { Pool } = require('pg');

// 1. Savienojums ar tavu jauno datubāzi
const pool = new Pool({
    user: 'tavs_user',
    host: 'localhost',
    database: 'arcus_serviss',
    password: 'tava_parole',
    port: 5432,
});

async function migrateData() {
    try {
        // 2. Nolasa datus no vecā JSON faila
        const rawData = fs.readFileSync('pieteikumi.json');
        const orders = JSON.parse(rawData);

        console.log(`Atrasti ${orders.length} pieteikumi. Sāku migrāciju...`);

        for (const order of orders) {
            // 3. Ievieto vai atrod klientu (lai nebūtu dublikātu pēc telefona)
            const klientRes = await pool.query(
                `INSERT INTO klienti (vards, talrunis, epasts) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (talrunis) DO UPDATE SET vards = EXCLUDED.vards
                 RETURNING id`,
                [order.vards, order.talrunis, order.email || order.epasts]
            );

            const klientaId = klientRes.rows[0].id;

            // 4. Ievieto pašu pieteikumu, piesaistot to klienta ID
            await pool.query(
                `INSERT INTO pieteikumi (klienta_id, pakalpojums, apraksts, statuss, meistars, izveidots_at) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    klientaId, 
                    order.pakalpojums, 
                    order.apraksts || '', 
                    order.statuss || 'Saņemts', 
                    order.meistars || null,
                    order.datums || new Date()
                ]
            );
        }

        console.log("✅ Migrācija pabeigta veiksmīgi!");
    } catch (err) {
        console.error("❌ Kļūda migrācijas laikā:", err);
    } finally {
        await pool.end();
    }
}

migrateData();