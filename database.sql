-- 1. Tabula: KLIENTI
-- Šī tabula ļauj izvairīties no datu dublēšanās. 
-- Viens klients var atnest vairākas ierīces.
CREATE TABLE klienti (
    id SERIAL PRIMARY KEY,
    vards VARCHAR(100) NOT NULL,
    talrunis VARCHAR(20) UNIQUE NOT NULL, -- Telefons ir galvenais identifikators
    epasts VARCHAR(100),
    pievienots_datums TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabula: PIETEIKUMI (Aizstāj pieteikumi.json)
-- Šeit glabājas viss, ko redzi savā Kanban dēļā.
CREATE TABLE pieteikumi (
    id SERIAL PRIMARY KEY,
    klienta_id INTEGER REFERENCES klienti(id) ON DELETE CASCADE,
    pakalpojums VARCHAR(255) NOT NULL,
    apraksts TEXT,
    statuss VARCHAR(50) DEFAULT 'Saņemts', -- Saņemts, Remonts, Gatavs
    meistars VARCHAR(50), -- Juris, Andris, Māris
    prioritāte BOOLEAN DEFAULT FALSE,
    izveidots_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atjaunots_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabula: ARHĪVS (Aizstāj arhīvs.json)
-- Kad pieteikums tiek pabeigts, tas "pārceļas" uz šejieni.
CREATE TABLE arhivs (
    id SERIAL PRIMARY KEY,
    klienta_id INTEGER REFERENCES klienti(id),
    pakalpojums VARCHAR(255),
    veiktie_darbi TEXT,
    izmaksas DECIMAL(10, 2),
    meistars VARCHAR(50),
    pabeigs_datums TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);