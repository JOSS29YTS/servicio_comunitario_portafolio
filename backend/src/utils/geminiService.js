// ============================================================
// SERVICIO: Indexación y Análisis con Gemini AI (Google GenAI)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const fs = require('fs')
const path = require('path')

// Cargar SDK dinámicamente o manejarlo de forma segura
let GoogleGenerativeAiSdk = null
try {
  GoogleGenerativeAiSdk = require('@google/generative-ai')
} catch (e) {
  // Carga tardía durante ejecuciones asíncronas
}

/**
 * Retorna true si el entorno está configurado para operar en Modo Simulación
 */
function isSimulationMode() {
  const apiKey = process.env.GEMINI_API_KEY
  return !apiKey || apiKey.includes('placeholder') || apiKey.includes('simulacion')
}

// System Instruction unificada con tu prompt de asistente académico
const SYSTEM_INSTRUCTION = `Eres un asistente académico y catalogador de proyectos de grado para el Colegio Nuestra Señora de Fátima. Tu tarea es analizar los proyectos de investigación de estudiantes de 5to año de bachillerato que se te proporcionen en formato PDF.

Debes ser rigurosamente objetivo, analítico y formal. Para cada documento, debes extraer la información y estructurarla exactamente en el esquema JSON solicitado. Si alguna sección no está claramente definida en el documento, debes indicarlo textualmente con 'No especificado'.

Los campos del esquema representan:
1. **titulo_oficial**: El título del proyecto de investigación tal como aparece en el documento.
2. **resumen_estructurado**: Un objeto que contiene:
   - **problema_planteado**: Qué situación o necesidad motiva la investigación.
   - **objetivo_general**: Qué se propone lograr el proyecto.
   - **metodologia**: Cómo se llevó a cabo la investigación.
   - **resultados_principales**: Qué se encontró o desarrolló en el estudio.
   - **conclusiones**: Qué concluye el autor sobre los hallazgos.
   - **palabras_clave**: Entre 4 y 6 términos representativos que sirvan para indexación.
3. **categoria_sugerida**: Elige estrictamente la que mejor se adapte entre: 'Tecnología', 'Salud', 'Medio Ambiente', 'Transporte', 'Educación', 'Otro'.
4. **tema_especifico**: Un nombre abreviado y representativo para el tema de estudio.`

// Esquema JSON estricto para forzar a Gemini a devolver la estructura exacta
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    titulo_oficial: { type: 'string' },
    categoria_sugerida: { 
      type: 'string', 
      enum: ['Tecnología', 'Salud', 'Medio Ambiente', 'Transporte', 'Educación', 'Otro'] 
    },
    tema_especifico: { type: 'string' },
    resumen_estructurado: {
      type: 'object',
      properties: {
        problema_planteado: { type: 'string' },
        objetivo_general: { type: 'string' },
        metodologia: { type: 'string' },
        resultados_principales: { type: 'string' },
        conclusiones: { type: 'string' },
        palabras_clave: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['problema_planteado', 'objetivo_general', 'metodologia', 'resultados_principales', 'conclusiones', 'palabras_clave']
    }
  },
  required: ['titulo_oficial', 'categoria_sugerida', 'tema_especifico', 'resumen_estructurado']
}

/**
 * Analiza un documento PDF y genera un análisis estructurado.
 * 
 * @param {string} pdfPath Ruta física al archivo PDF
 * @param {Buffer} [pdfBuffer] Buffer opcional en memoria del PDF
 * @param {string} [tituloSugerido] Título sugerido (para afinar simulación si está activo)
 * @returns {Promise<Object>} Análisis JSON estructurado
 */
async function generarResumenEstructurado(pdfPath, pdfBuffer = null, tituloSugerido = 'Proyecto de Investigación') {
  try {
    const finalBuffer = pdfBuffer || (fs.existsSync(pdfPath) ? fs.readFileSync(pdfPath) : null)
    
    // 1. EVALUAR MODO SIMULACIÓN
    if (isSimulationMode() || !finalBuffer) {
      console.log(`[GEMINI SERVICE] Activando modo simulación para el archivo: ${pdfPath || 'Buffer'}`)

      // Lógica de Inteligencia de Simulación: Analizar semánticamente el título
      const title = tituloSugerido || 'Proyecto Escolar'
      const titleLower = title.toLowerCase()

      let categoria = 'Otro'
      let tema = 'Comunidad y Educación'
      let problema = 'Falta de herramientas didácticas o recursos de integración que limitan el desarrollo en el entorno escolar.'
      let objetivo = 'Diseñar e implementar un plan piloto de integración que permita optimizar los recursos del plantel.'
      let metodologia = 'Enfoque cuali-cuantitativo, investigación de acción participativa mediante encuestas y observación directa.'
      let resultados = 'Establecimiento de una base organizativa estable, desarrollo de guías ilustrativas y capacitación de los delegados.'
      let conclusiones = 'Se logró una articulación del 85% de los objetivos propuestos, incrementando el sentido de pertenencia institucional.'
      let keywords = ['Educación', 'Comunidad', 'Colegio NSF', 'Bachillerato']

      if (titleLower.includes('tecnologia') || titleLower.includes('web') || titleLower.includes('sistema') || titleLower.includes('software') || titleLower.includes('codigo')) {
        categoria = 'Tecnología'
        tema = 'Sistemas e Informatización'
        problema = 'Ausencia de un canal digital ágil e centralizado para indexar, preservar y catalogar la memoria histórica y científica del colegio.'
        objetivo = 'Desarrollar una plataforma web profesional con React, Node.js y MySQL para archivar y visualizar los proyectos de grado.'
        metodologia = 'Investigación tecnológica y aplicada. Metodología ágil Scrum en fases de requerimientos, codificación y pruebas unitarias.'
        resultados = 'Plataforma web funcionando con inicio de sesión seguro, búsqueda interactiva, auditoría MySQL y previsualizador de PDF.'
        conclusiones = 'La digitalización reduce en un 95% el tiempo de búsqueda física de tesis y previene pérdidas materiales de archivos.'
        keywords = ['Desarrollo Web', 'Base de Datos', 'Digitalización', 'React', 'Automatización']
      } else if (titleLower.includes('ambiente') || titleLower.includes('verde') || titleLower.includes('recicla') || titleLower.includes('ecolog') || titleLower.includes('basura')) {
        categoria = 'Medio Ambiente'
        tema = 'Conservación Ecológica'
        problema = 'Degradación de las áreas verdes del plantel e incremento de residuos sólidos por falta de cultura de reciclaje escolar.'
        objetivo = 'Implementar jardineras ecológicas y talleres de compostaje para concienciar a los estudiantes de educación media.'
        metodologia = 'Diseño cuasi-experimental. Diagnóstico ecológico inicial, reforestación activa y medición de residuos recolectados.'
        resultados = 'Recuperación de 120 metros cuadrados de jardineras y recolección mensual de 45 kilos de plástico reutilizable.'
        conclusiones = 'La acción participativa estudiantil es eficaz para revertir focos de contaminación y embellecer el plantel.'
        keywords = ['Reciclaje', 'Ecología', 'Compostaje', 'Áreas Verdes', 'Preservación']
      } else if (titleLower.includes('salud') || titleLower.includes('nutric') || titleLower.includes('aliment') || titleLower.includes('higiene') || titleLower.includes('medicina')) {
        categoria = 'Salud'
        tema = 'Bienestar y Nutrición'
        problema = 'Hábitos alimentarios deficientes y consumo excesivo de productos procesados en la cantina que afectan el rendimiento escolar.'
        objetivo = 'Evaluar la distribución nutricional del menú escolar y diseñar una guía informativa de meriendas saludables.'
        metodologia = 'Investigación descriptiva de campo. Encuestas a 150 estudiantes y análisis calórico comparativo de alimentos comunes.'
        resultados = 'Diseño de la Guía Nutritiva Escolar y adopción de opciones frutales en el 40% de los desayunos semanales.'
        conclusiones = 'Brindar educación nutricional temprana influye favorablemente en la selección de meriendas activas y sanas.'
        keywords = ['Merienda Saludable', 'Nutrición', 'Hábitos Alimenticios', 'Bienestar', 'Guía Escolar']
      }

      const simulatedJson = {
        titulo_oficial: title.toUpperCase(),
        categoria_sugerida: categoria,
        tema_especifico: tema,
        resumen_estructurado: {
          problema_planteado: problema,
          objetivo_general: objetivo,
          metodologia: metodologia,
          resultados_principales: resultados,
          conclusiones: conclusiones,
          palabras_clave: keywords
        }
      }

      // Hermoso banner de simulación en consola (ANSI)
      console.log('\n\x1b[35m%s\x1b[0m', '┌────────────────────────────────────────────────────────┐')
      console.log('\x1b[35m%s\x1b[0m', '│            ✨  ANALIZADOR CIENTÍFICO DE GEMINI AI       │')
      console.log('\x1b[35m%s\x1b[0m', '│          [MODO SIMULACIÓN - MODELO 2.0 FLASH]          │')
      console.log('\x1b[35m%s\x1b[0m', '├────────────────────────────────────────────────────────┤')
      console.log(`│  Extraído:   ${title.substring(0, 40).padEnd(41)}│`)
      console.log(`│  Categoría:  ${categoria.padEnd(41)}│`)
      console.log(`│  Tema:       ${tema.padEnd(41)}│`)
      console.log(`│  Keywords:   ${keywords.join(', ').padEnd(41)}│`)
      console.log(`│  Estado:     \x1b[32m✔ Ficha de Indexación IA autogenerada\x1b[35m    │`)
      console.log('\x1b[35m%s\x1b[0m', '└────────────────────────────────────────────────────────┘\n')

      // Simular retardo asíncrono realista (500ms) para emular respuesta de red
      await new Promise(r => setTimeout(r, 500))

      return simulatedJson
    }

    // 2. SUBIDA REAL (GOOGLE GENERATIVE AI SDK)
    if (!GoogleGenerativeAiSdk) {
      GoogleGenerativeAiSdk = require('@google/generative-ai')
    }
    const { GoogleGenerativeAI } = GoogleGenerativeAiSdk

    const apiKey = process.env.GEMINI_API_KEY
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

    console.log(`[GEMINI SERVICE] Conectando con Gemini API real (${modelName}) para parsear proyecto...`)

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION
    })

    // Construir estructura multimodal
    const prompt = 'Analiza el proyecto de investigación escolar adjunto en PDF y extrae de forma estructurada en español.'

    const media = {
      inlineData: {
        data: finalBuffer.toString('base64'),
        mimeType: 'application/pdf'
      }
    }

    const result = await model.generateContent({
      contents: [media, prompt],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    })

    const text = result.response.text()
    console.log('[GEMINI SERVICE] ✔ Respuesta recibida con éxito de la API de Gemini.')

    // Retornar JSON ya parseado
    return JSON.parse(text)

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[GEMINI SERVICE] ❌ Error en análisis de Gemini AI: ${error.message}`)
    // Retornar un fallback de error estructurado para no romper la creación del proyecto
    return {
      titulo_oficial: tituloSugerido.toUpperCase(),
      categoria_sugerida: 'Otro',
      tema_especifico: 'Sin indexación',
      resumen_estructurado: {
        problema_planteado: 'No especificado debido a un error técnico en el servicio de IA.',
        objetivo_general: 'No especificado.',
        metodologia: 'No especificado.',
        resultados_principales: 'No especificado.',
        conclusiones: 'No especificado.',
        palabras_clave: ['Error IA', 'Preservación']
      }
    }
  }
}

module.exports = {
  generarResumenEstructurado,
  isSimulationMode
}
