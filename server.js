const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());

// 👉 stockage temporaire (en mémoire)
let validCodes = {};

// 🔑 webhook Stripe
app.post("/webhook", (req, res) => {
    const event = req.body;

    // ⚠️ En production : vérifier la signature Stripe

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const phone = session.customer_details?.phone || "inconnu";

        // 🔢 générer code à 4 chiffres
        const code = Math.floor(1000 + Math.random() * 9000);

        // stocker le code (valide 30 min)
        validCodes[code] = {
            phone: phone,
            expires: Date.now() + 30 * 60 * 1000
        };

        console.log("Paiement OK - Code:", code);

        // 👉 ici tu peux envoyer SMS plus tard

    }

    res.sendStatus(200);
});

// 🔍 API pour vérifier code (appelée par ESP32)
app.get("/check-code/:code", (req, res) => {
    const code = req.params.code;

    if (validCodes[code]) {
        if (Date.now() < validCodes[code].expires) {
            delete validCodes[code]; // usage unique
            return res.json({ valid: true });
        } else {
            delete validCodes[code];
        }
    }

    res.json({ valid: false });
});

// test
app.get("/", (req, res) => {
    res.send("Serveur OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Serveur lancé sur port", PORT);
});
