// ─────────────────────────────────────────────────────────────────────────────
// staticObjections.ts
// Objeciones precargadas para el drawer de manejo de objeciones.
// Se usan cuando el pitch aún no ha sido generado por IA.
// ─────────────────────────────────────────────────────────────────────────────

import type { ZoneSummary } from '../data/providers/DataProvider.interface'

export interface StaticObjection {
  id: string
  objection: string
  response: string
}

type CategoryKey = 'general' | 'hamburguesas' | 'pizza' | 'pollo' | 'sushi' | 'comida_rapida' | 'mexicana' | 'saludable' | 'italiana'

// ── Objeciones generales ──────────────────────────────────────────────────────

const GENERAL: StaticObjection[] = [
  {
    id: 'g1',
    objection: 'La comisión es muy alta',
    response: 'La comisión se aplica solo sobre ventas incrementales — dinero nuevo que hoy no entra a tu caja. Tu operación actual no se toca. Es literalmente un costo que pagas únicamente cuando ya ganaste.',
  },
  {
    id: 'g2',
    objection: 'Ya tengo domicilios propios',
    response: 'Tus domicilios atienden clientes que ya te conocen. Rappi te expone a usuarios en tu zona que nunca han pedido en tu restaurante — es un canal completamente incremental, no canibaliza lo que ya tienes.',
  },
  {
    id: 'g3',
    objection: 'No tengo capacidad para más pedidos',
    response: 'Empezamos gradual. Los primeros 30 días son de aprendizaje — tú controlas el volumen desde el panel. Pausas cuando quieras, activas solo los días que quieras. No hay compromiso de volumen mínimo.',
  },
  {
    id: 'g4',
    objection: 'Un amigo/conocido tuvo mala experiencia con Rappi',
    response: 'Entiendo, y me parece válido. ¿Me puedes contar qué pasó? Quiero asegurarme de que eso no se repita contigo. Además, ahora tienes un ejecutivo asignado — yo soy tu punto de contacto directo, no un call center.',
  },
  {
    id: 'g5',
    objection: 'Ya hay muchos restaurantes de mi categoría en Rappi',
    response: 'Precisamente — eso valida que hay demanda activa. El usuario ya tiene el hábito de pedir en esa categoría. La pregunta es: ¿por qué no estás capturando una parte de esa demanda que ya existe en tu zona?',
  },
  {
    id: 'g6',
    objection: 'No tengo tiempo para manejar otra plataforma',
    response: 'El onboarding lo hacemos nosotros. Tú solo necesitas aceptar pedidos — que es lo mismo que haces con cualquier delivery. El panel es muy sencillo. En la práctica te toma menos de 5 minutos adicionales al día.',
  },
]

// ── Objeciones por categoría ──────────────────────────────────────────────────

const BY_CATEGORY: Record<CategoryKey, StaticObjection[]> = {
  general: [],

  hamburguesas: [
    {
      id: 'ham1',
      objection: 'Las hamburguesas se dañan en el delivery, llegan frías o aplastadas',
      response: 'Eso era antes. Ahora trabajamos con empaques específicos para hamburguesas y los tiempos de entrega en tu zona están optimizados. Además, las marcas exitosas en tu categoría aquí tienen calificaciones promedio de 4.7/5.',
    },
    {
      id: 'ham2',
      objection: 'Mi producto es muy artesanal para una plataforma masiva',
      response: 'El perfil Prime de Rappi busca exactamente eso — producto de calidad, no comida de cadena. El ticket promedio más alto de esos usuarios refleja que están dispuestos a pagar por calidad. Tu producto artesanal es una ventaja competitiva, no una desventaja.',
    },
    {
      id: 'ham3',
      objection: 'Los costos de empaque aumentarían mucho',
      response: 'Tenemos proveedores aliados de empaque con descuentos para nuevos partners. Además, el costo de empaque se amortiza rápidamente con el volumen — en el P&L que te mostré, ya lo incluimos en la estructura de costos.',
    },
  ],

  pizza: [
    {
      id: 'piz1',
      objection: 'La pizza llega fría — ese es el mayor problema del delivery',
      response: 'Con las bolsas térmicas de pizza y los tiempos de entrega actuales, la temperatura se mantiene bien en radios cortos. Muchas pizzerías en tu zona reportan que la calificación de temperatura es su punto más fuerte.',
    },
    {
      id: 'piz2',
      objection: 'Ya tengo mi propio sistema de domicilios y funciona bien',
      response: 'Perfecto, entonces ya sabes operar delivery. Rappi no reemplaza ese sistema — es un canal adicional que te trae clientes que no te conocen. Tu sistema actual atiende a los que ya son tuyos.',
    },
    {
      id: 'piz3',
      objection: 'Los fines de semana ya estoy a tope, no puedo con más pedidos',
      response: 'Puedes configurar el horario de disponibilidad. Activas Rappi solo lunes a jueves, que son días de menor volumen propio, y capturas demanda incremental sin afectar tu operación de fin de semana.',
    },
  ],

  pollo: [
    {
      id: 'pol1',
      objection: 'El pollo tiene que estar recién hecho, el delivery lo arruina',
      response: 'La clave está en el tamaño de la porción y el empaque. Hay formatos de pollo que viajan perfectamente — muslos, alitas, combos pequeños. Las marcas exitosas en tu categoría en esta zona lo han resuelto y tienen excelentes calificaciones.',
    },
    {
      id: 'pol2',
      objection: 'Mi precio ya es muy competitivo, no puedo absorber la comisión',
      response: 'Muchas marcas de pollo crean un menú de delivery específico con precios ligeramente ajustados — no para cobrarle más al cliente, sino para que el canal sea sostenible. Es una práctica estándar en la industria.',
    },
  ],

  sushi: [
    {
      id: 'sus1',
      objection: 'El sushi no viaja bien, llega aguado o desarmado',
      response: 'Tienes razón en que requiere atención al empaque. Pero el ticket promedio de sushi en tu zona es de los más altos de todas las categorías — lo que significa que el margen aguanta la inversión en empaque de calidad y todavía deja utilidad.',
    },
    {
      id: 'sus2',
      objection: 'Mis clientes van al restaurante por la experiencia, no por delivery',
      response: 'Absolutamente — y eso no va a cambiar. Pero hay un segmento distinto: el que quiere sushi en casa un martes en la noche. Ese cliente hoy no puede ser tuyo porque no tiene cómo pedirte. Rappi te abre ese segmento sin tocar tu modelo de restaurante.',
    },
    {
      id: 'sus3',
      objection: 'El usuario de Rappi no es mi cliente objetivo',
      response: 'El usuario Prime de Rappi en tu zona tiene un ticket promedio alto y busca opciones premium. Es exactamente tu cliente objetivo — con el hábito de pedir desde el celular. Las marcas de sushi premium están entre las que más crecen en la plataforma.',
    },
  ],

  comida_rapida: [
    {
      id: 'cr1',
      objection: 'La comida rápida tiene márgenes muy bajos, la comisión no me sirve',
      response: 'En comida rápida el volumen compensa el margen. Con el ticket promedio de tu categoría en esta zona y el volumen de pedidos que hay, el canal Rappi puede generar una utilidad absoluta importante aunque el margen % sea delgado.',
    },
    {
      id: 'cr2',
      objection: 'Hay demasiada competencia de comida rápida en Rappi',
      response: 'Sí, hay oferta — pero también hay demanda enorme. Tu zona tiene miles de pedidos semanales en esta categoría. El mercado es suficientemente grande para que tú captures tu parte. La clave es posicionamiento y calificación.',
    },
  ],

  mexicana: [
    {
      id: 'mex1',
      objection: 'Los tacos y burritos se ponen blandos en el delivery',
      response: 'El empaque correcto resuelve eso — salsas y toppings por separado, tortilla en contenedor independiente. Es una práctica estándar. Las marcas de comida mexicana bien operadas tienen excelentes calificaciones en delivery.',
    },
    {
      id: 'mex2',
      objection: 'Mi cocina es muy pequeña para absorber más volumen',
      response: 'Empezamos con el volumen que tú definas. Si tu cocina puede manejar 10 pedidos adicionales al día, configuramos para eso. No hay presión de volumen. El objetivo inicial es probar el canal, no sobrecargar tu operación.',
    },
  ],

  saludable: [
    {
      id: 'sal1',
      objection: 'La comida saludable pierde presentación en el delivery',
      response: 'El cliente de comida saludable en Rappi tiene expectativas distintas — prioriza ingredientes y frescura sobre presentación elaborada. Con un empaque limpio y etiquetado claro de ingredientes, el formato de delivery funciona muy bien para esta categoría.',
    },
    {
      id: 'sal2',
      objection: 'Mi producto fresco no dura el tiempo del delivery',
      response: 'Los tiempos de entrega en tu zona están optimizados. Además, puedes ajustar el menú de delivery para incluir tus opciones más robustas al transporte. No tienes que ofrecer todo tu menú, solo lo que viaja mejor.',
    },
  ],

  italiana: [
    {
      id: 'ita1',
      objection: 'La pasta se pasa si tarda en llegar',
      response: 'La solución estándar es enviar la pasta ligeramente al dente, sabiendo que llegará en su punto. Alternativamente, formatos como lasaña, risotto o gnocchi al horno viajan perfectamente. Muchas trattorias exitosas en Rappi tienen menús de delivery optimizados.',
    },
    {
      id: 'ita2',
      objection: 'Mi restaurante es una experiencia, no un delivery',
      response: 'Completamente de acuerdo — y eso no cambia. Pero hay clientes que quieren tu cocina italiana en casa una noche entre semana. Ese segmento hoy no puede acceder a ti. Rappi te da ese canal sin afectar la experiencia del restaurante.',
    },
  ],
}

// ── Función de acceso ─────────────────────────────────────────────────────────

/** Retorna objeciones combinadas: generales + específicas de la categoría */
export function getObjectionsForCategory(
  category: string,
  zoneData?: ZoneSummary,
): StaticObjection[] {
  // Normalizar nombre de categoría al key del mapa
  const normalized = category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '') as CategoryKey

  const specific = BY_CATEGORY[normalized] ?? []

  // Inyectar tasa de cancelación de la zona en la objeción general g5 (índice 4)
  const general = GENERAL.map((obj) => {
    if (obj.id === 'g4' && zoneData) {
      const firstCat = zoneData.categories[0]
      const cancelPct = firstCat
        ? (firstCat.cancellationRate * 100).toFixed(1).replace('.', ',')
        : '—'
      const cancelBetter = firstCat
        ? (firstCat.cancellationRate * 100 * 0.6).toFixed(1).replace('.', ',')
        : '—'
      return {
        ...obj,
        objection: 'El porcentaje de cancelaciones es alto',
        response: `En tu zona la tasa actual es ${cancelPct}%. Lo que hacemos es trabajar juntos las primeras semanas para identificar y reducir esas causas. Las marcas exitosas en tu categoría llegan a ${cancelBetter}% — y nosotros te acompañamos en ese proceso.`,
      }
    }
    if (obj.id === 'g2' && zoneData) {
      return {
        ...obj,
        response: `Tus domicilios atienden clientes que ya te conocen. Rappi te expone a ${zoneData.totalUsers.toLocaleString('es-CO')} usuarios en tu zona que nunca han pedido en tu restaurante — es un canal completamente incremental, no canibaliza lo que ya tienes.`,
      }
    }
    return obj
  })

  return [...general, ...specific]
}
