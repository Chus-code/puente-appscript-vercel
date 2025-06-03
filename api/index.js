// Importa la librería para hacer peticiones HTTP
// Usamos node-fetch v2 para amplia compatibilidad en Vercel
const fetch = require('node-fetch');

// La URL de tu script de Google Apps Script se obtendrá de una variable de entorno en Vercel.
// ¡NO LA PEGUES AQUÍ DIRECTAMENTE! Se configurará en Vercel.
const GOOGLE_APPS_SCRIPT_URL = process.env.GAS_WEB_APP_URL;

module.exports = async (req, res) => {
  // 1. Asegúrate de que la petición es POST
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'ERROR_VERCEL', message: 'Método no permitido. Solo POST.' });
    return;
  }

  // 2. Verifica que la URL del script de GAS esté configurada en Vercel
  if (!GOOGLE_APPS_SCRIPT_URL) {
    res.status(500).json({ status: 'ERROR_VERCEL', message: 'La URL de Google Apps Script no está configurada en el servidor intermedio (GAS_WEB_APP_URL).' });
    return;
  }

  try {
    // 3. Lee el cuerpo de la petición (JSON) enviado desde App Inventor
    // Vercel parsea automáticamente el JSON si la cabecera Content-Type es application/json
    const requestBody = req.body;

    // 4. Haz la petición POST al script de Google Apps Script
    const gasResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Muy importante para que GAS lo reciba como JSON
      },
      body: JSON.stringify(requestBody) // Reenvía el mismo JSON que recibiste
    });

    // 5. Procesa la respuesta de Google Apps Script
    const gasResponseText = await gasResponse.text(); // Lee la respuesta como texto
    let gasResponseJson;
    try {
        gasResponseJson = JSON.parse(gasResponseText); // Intenta parsear como JSON
    } catch (jsonParseError) {
        // Si la respuesta de GAS no es JSON válido, informa de un error
        console.error('Error al parsear JSON de GAS:', jsonParseError.message);
        res.status(500).json({
            status: 'ERROR_VERCEL_PARSE_GAS_RESPONSE',
            message: 'El script de Google Apps Script devolvió una respuesta no-JSON válida.',
            gasRawResponse: gasResponseText, // Incluye la respuesta cruda de GAS
            gasStatusCode: gasResponse.status // Incluye el código de estado HTTP de GAS
        });
        return;
    }

    // 6. Envía la respuesta de Google Apps Script de vuelta a App Inventor
    res.status(gasResponse.status).json(gasResponseJson);

  } catch (error) {
    // Manejo de errores si algo falla durante la petición de Vercel a GAS
    console.error('Error en el servidor intermedio al contactar GAS:', error);
    res.status(500).json({ status: 'ERROR_VERCEL_SERVER', message: 'Error interno del servidor intermedio.', debug: error.message });
  }
};
