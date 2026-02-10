-- Lietotāju tabula
CREATE TABLE lietotaji (
    id SERIAL PRIMARY KEY,
    vards VARCHAR(50),
    epasts VARCHAR(100) UNIQUE,
    parole_hash TEXT
);

-- Datoru tabula (Piesaistīta lietotājam)
CREATE TABLE datori (
    id SERIAL PRIMARY KEY,
    lietotaja_id INTEGER REFERENCES lietotaji(id),
    modelis VARCHAR(50) DEFAULT 'Datortehnika',
    gads INTEGER DEFAULT 2010,
    vin_numurs VARCHAR(17)
);

-- Servisa vēstures tabula
CREATE TABLE servisa_vesture (
    id SERIAL PRIMARY KEY,
    auto_id INTEGER REFERENCES automasinas(id),
    datums DATE,
    darbiba TEXT, -- Piemēram: "Eļļas maiņa CANA dzinējam"
    nobraukums INTEGER,
    izmaksas DECIMAL(10, 2)
);