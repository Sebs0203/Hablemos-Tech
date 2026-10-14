#!/usr/bin/env python3
"""Genera el blog estático a partir de las entradas de este archivo.

Escribe /blog/index.html, /blog/<slug>/index.html y la sección #blog del
homepage (entre <!-- blog:inicio --> y <!-- blog:fin -->).

Uso: python3 scripts/generar-blog.py
"""

import html
import json
import math
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = 'https://hablemostech.com'
VERSION_CSS = '202610131500'
VERSION_JS = '202610131500'
PUBLICADO = '2026-10-13'

EVENTOS = {
    'vol-01': ('Foro de Tecnología MX 2026', 'Vol. 01, julio 2026'),
    'vol-02': ('Tech & Wine Fest 2026', 'Vol. 02, otoño 2026'),
}

TEMAS = [
    ('ciberseguridad', 'Ciberseguridad'),
    ('ia', 'IA'),
    ('nube', 'Nube'),
    ('negocio', 'Negocio y cliente'),
    ('industria', 'Industria'),
]


def e(texto):
    return html.escape(texto, quote=True)


# ---------- Piezas del cuerpo ----------

def cita(texto, autor):
    return (f'<blockquote class="post-cita"><p>“{texto}”</p>'
            f'<cite>{autor}</cite></blockquote>')


def cifras(items, nota=None):
    filas = ''.join(f'<li><strong>{n}</strong><span>{t}</span></li>' for n, t in items)
    pie = f'<p class="post-nota">{nota}</p>' if nota else ''
    return f'<div class="post-cifras-bloque"><ul class="post-cifras">{filas}</ul>{pie}</div>'


def pasos(items):
    filas = ''.join(f'<li><strong>{t}</strong> {d}</li>' for t, d in items)
    return f'<ol class="post-pasos">{filas}</ol>'


def caja(titulo, items):
    filas = ''.join(f'<li>{i}</li>' for i in items)
    return f'<aside class="post-caja"><h2>{titulo}</h2><ul>{filas}</ul></aside>'


def enlace(slug, texto):
    return f'<a href="/blog/{slug}/">{texto}</a>'


# ---------- Entradas ----------

ENTRADAS = [
    {
        'slug': 'el-codigo-que-no-escribiste',
        'titulo': 'El código que no escribiste',
        'rubro': 'Ciberseguridad',
        'temas': ['ciberseguridad'],
        'extracto': 'Los ataques más difíciles de ver no entran por tu firewall: llegan dentro de las dependencias que tú mismo instalas.',
        'ponentes': [('Gustavo Rodríguez', 'Director de ciberseguridad, Grupo Trycer')],
        'fuentes': [('vol-02', 4)],
        'foto': ('/assets/img/revista-vol-02/gustavo-rodriguez.jpg', 1800, 1200, '55% 40%',
                 'Gustavo Rodríguez, director de ciberseguridad de Grupo Trycer, en el stand de su empresa durante el Tech & Wine Fest.'),
        'cuerpo': f'''
<p>En 1984, Ken Thompson lo dejó escrito: no puedes confiar en código que no escribiste tú mismo. Gustavo Rodríguez, director de ciberseguridad de Grupo Trycer, subió al escenario del Tech &amp; Wine Fest con un casco de Iron Man y esa frase, para hablar del riesgo que casi nadie está midiendo: la cadena de suministro de software.</p>
<p>Su advertencia cabe en una línea: no te van a atacar a ti; van a atacar a alguien de quien dependes.</p>
<h2>La tienda de apps de los programadores</h2>
<p>Hoy, el código que no escribiste llega en una dependencia o te lo sugiere una IA. NPM y PIP funcionan como la tienda de apps de los programadores: alguien publicó el paquete, tú lo instalas, casi siempre como administrador, y confías en que haga lo que dice.</p>
<p>Una aplicación con 40 dependencias puede tener detrás a cerca de 1,500 personas, según la estimación que mostró Gustavo. Cada una es un eslabón que no controlas.</p>
<p>La IA suma un riesgo nuevo: si un asistente recomienda una librería que no existe, alguien puede publicarla con ese nombre y con código malicioso. Ya pasó algo parecido. En 2021, Alex Birsan subió paquetes con el nombre de dependencias internas de empresas como Apple y Microsoft, y los gestores instalaron la versión pública. Según Gustavo, Kaseya y Shai-Hulud siguieron el mismo patrón: dependencias que nadie verificó.</p>
{cita('Nadie lo va a detectar, porque viene del código.', 'Gustavo Rodríguez, sobre firewalls y antivirus')}
<h2>Cuatro puertas de entrada</h2>
<p>Así se mete un ataque a la cadena de suministro, según Gustavo:</p>
{pasos([
    ('Dependencia.', 'Código que bajas de NPM, PIP o RubyGems y que casi siempre instalas como administrador.'),
    ('Pipeline.', 'Acciones y plugins sin definir, y aplicaciones que corren sin permisos específicos.'),
    ('Artefacto.', 'Siempre compila limpio: el problema viene de antes, desde el desarrollo.'),
    ('Identidad.', 'Tokens sin límite, credenciales sin MFA y cuentas que son administradoras.'),
])}
{cifras([
    ('454 mil', 'paquetes maliciosos nuevos al año, según Sonatype'),
    ('65 %', 've la cadena de suministro como su mayor reto, según el Foro Económico Mundial'),
    ('+250', 'días en promedio para detectar una brecha'),
], 'Cifras citadas en la plática.')}
<h2>No todo lo que pide rescate es ransomware</h2>
<p>NotPetya cifraba el MBR y el MFT sin forma de recuperarlos: era un wiper. Y el ransomware de verdad es toda una industria, con brokers de acceso, afiliados, negociadores y hasta call centers.</p>
{caja('Por dónde empezar', [
    'Mapea de quién dependes: cada librería es una puerta.',
    'Revisa cada paquete que te sugiera una IA antes de instalarlo.',
    'Da a cada proveedor una VPN limitada y ventanas de mantenimiento.',
    'Activa MFA en cada servicio y en cada cuenta de administrador.',
    'Descarga los 18 CIS Controls v8: son gratis.',
])}
''',
    },
    {
        'slug': 'lo-que-de-verdad-cuesta-un-token',
        'titulo': 'Lo que de verdad cuesta un token',
        'rubro': 'IA en producción',
        'temas': ['ia'],
        'extracto': 'Casi nadie sabe cuánto le costará la IA hasta ver la factura. Y si no lo sabes, todavía no estás en producción.',
        'ponentes': [('Andrés Wong', 'Director de Inteligencia Artificial, Purple AI')],
        'fuentes': [('vol-02', 8)],
        'foto': ('/assets/img/revista-vol-02/andres-wong.jpg', 1800, 675, '50% 35%',
                 'Andrés Wong, director de Inteligencia Artificial de Purple AI, durante su plática en el Tech & Wine Fest.'),
        'cuerpo': f'''
<p>Un token es un pedazo de palabra, y es lo que cobran los proveedores de IA. En inglés se gasta uno por palabra; en español, dos. Es un detalle que casi nadie revisa al armar un piloto, y explica muchas facturas inesperadas.</p>
<p>Andrés Wong, director de Inteligencia Artificial de Purple AI, lo resumió en el Tech &amp; Wine Fest con una regla sencilla: si no sabes cuánto te cuesta, no tienes un producto, tienes una demostración.</p>
<h2>Un chatbot sugiere; un agente reintenta</h2>
<p>Un chatbot te dice qué hacer. Un agente lo hace, falla y vuelve a intentar. Con tokens de sobra, ese loop es poderoso; medido, es un problema, porque cada reintento se cobra.</p>
<h2>El caso: de un día y medio a 13 segundos</h2>
<p>Procesar un M3 de más de 100 partidas le tomaba un día y medio a una agencia aduanal. Purple AI lo atacó en rondas:</p>
{pasos([
    ('Manual:', '1.5 días.'),
    ('Ronda 1, agentes LLM:', '1.5 horas.'),
    ('Ronda 2, mejor algoritmo:', '13 minutos.'),
    ('Rediseño, el LLM decide y el código ejecuta:', '13 segundos.'),
])}
<p>El rediseño nació de la factura: con agentes LLM, procesar un archivo pasó de 30 dólares a 11,500 pesos. La solución fue repartir el trabajo: el LLM decide y el código ejecuta.</p>
{cifras([
    ('32', 'archivos en paralelo'),
    ('24/7', 'sin turnos ni pausas'),
    ('0', 'reemplazos: el equipo ahora valida'),
])}
<h2>Cómo bajar la cuenta</h2>
<ul>
<li>Pide formatos estrictos de salida: JSON, XML o Markdown.</li>
<li>Reduce el “pensamiento” del modelo cuando la tarea no lo necesita.</li>
<li>Usa código para todo lo que no requiere criterio.</li>
</ul>
<h2>Cuando el agente olvida</h2>
<p>Hay un costo menos visible. Cuando un agente compacta su contexto, puede guardar la tarea y olvidar la instrucción más importante, el “no borres esa tabla”. Wong citó el caso de una directiva de Meta: al compactar, su agente de correo olvidó sus instrucciones y vació la bandeja.</p>
{cita('Si no sabemos cuánto nos cuesta técnicamente y económicamente, es una demostración, no es producción.', 'Andrés Wong, Purple AI')}
<aside class="post-caja post-caja--podcast"><h2>Para escuchar</h2><p>El tema dio para un episodio completo de Hablemos Tech Podcast: por qué en español la IA sale más cara, cómo un “hola” puede costar lo mismo que procesar un PDF y lo que de verdad implica montar tu propia IA local.</p><p><a href="https://www.youtube.com/watch?v=lMJa_hWjcCI" target="_blank" rel="noopener noreferrer">Ver “El costo oculto de tokens de IA” en YouTube</a></p></aside>
{caja('Para el lunes', [
    'Mide los tokens antes de prometer ahorros.',
    'Separa lo que necesita criterio (el modelo) de lo que no (el código).',
    'Repite las instrucciones críticas cuando el agente compacte su contexto.',
])}
''',
    },
    {
        'slug': 'respaldar-no-es-recuperar',
        'titulo': 'Respaldar no es recuperar',
        'rubro': 'Nube',
        'temas': ['nube', 'ciberseguridad'],
        'extracto': 'Tener respaldos no es estar protegido. Lo que protege tu operación es saber cuánto tardas en volver, y haberlo probado.',
        'ponentes': [('Francisco Olazo', 'LATAM Lead Engineer, Enteracloud'), ('Diego Garza', 'Veeam')],
        'fuentes': [('vol-02', 10), ('vol-01', 14)],
        'foto': ('/assets/img/revista-vol-02/francisco-olazo.jpg', 1800, 653, '50% 40%',
                 'Francisco Olazo, de Enteracloud, explica RPO y RTO frente a su presentación en el Tech & Wine Fest.'),
        'cuerpo': f'''
<p>Febrero, seis de la mañana. Un cliente llama a Francisco Olazo, LATAM Lead Engineer en Enteracloud: su operación está detenida. Tenía respaldos de hacía meses, pero ningún servidor donde restaurarlos.</p>
<p>La falla era técnica; el impacto, de negocio: usuarios que no facturan, órdenes que no salen, mercancía detenida en el cruce. Y la pregunta que pocos saben responder: ¿cuánto tardaríamos en volver a operar?</p>
{cita('El backup protege la información. Una estrategia de recuperación protege tu operación.', 'Francisco Olazo, Enteracloud')}
<h2>RPO y RTO: las dos cifras que importan</h2>
<p>En el panel de ciberseguridad del Foro de Tecnología MX, Diego Garza, de Veeam, lo dijo sin rodeos: tener respaldos no es estar protegido. Hay que definir RPO y RTO, y probar la recuperación.</p>
<p>El RPO es cuánta información puedes perder, medida en tiempo: si respaldas cada noche, puedes perder hasta un día de trabajo. El RTO es cuánto puedes tardar en volver a operar. Ambas son decisiones de negocio antes que técnicas.</p>
<h2>La regla 3-2-1</h2>
{cifras([
    ('3', 'copias de cada dato'),
    ('2', 'medios distintos'),
    ('1', 'sitio alterno, inmutable y cifrado'),
], 'Recomendación de Diego Garza, Veeam.')}
<h2>Operar, recuperar, escalar</h2>
<p>Olazo ordena la estrategia en tres frentes:</p>
{pasos([
    ('Operar.', 'Alta disponibilidad, alertas y visibilidad. Si no podemos verlo, difícilmente podemos administrarlo.'),
    ('Recuperar.', 'Restaurar de prueba cada mes o cada dos meses. Es la única forma de saber que el respaldo sirve.'),
    ('Escalar.', 'Crecer on-premise toma de tres a cinco semanas. En la nube, el recurso llega con el proyecto.'),
])}
<p>La segunda es la que casi nadie hace. Un respaldo que nunca se restauró es una suposición, no un plan.</p>
{caja('Para el lunes', [
    'Restaura un respaldo este mes; no solo lo guardes.',
    'Prueba la recuperación en ambientes aislados.',
    'Define RPO y RTO para cada sistema crítico.',
    'Verifica que exista un lugar donde restaurar, además de la copia.',
])}
''',
    },
    {
        'slug': 'la-ia-no-alucina-miente',
        'titulo': 'La IA no alucina: miente',
        'rubro': 'IA en producción',
        'temas': ['ia'],
        'extracto': 'Un modelo de lenguaje está diseñado para responder, tenga o no la información. En producción, la salida es darle una fuente de verdad.',
        'ponentes': [('Andrés Wong', 'Purple AI')],
        'fuentes': [('vol-01', 8)],
        'foto': ('/assets/img/revista-vol-01/andres-wong.jpg', 1000, 667, '35% 50%',
                 'Andrés Wong, de Purple AI, en el escenario frente a la frase “El modelo alucina. El código valida.”'),
        'cuerpo': f'''
<p>“Alucinar” suena a accidente. Andrés Wong, de Purple AI, prefiere otra palabra: la IA miente. Está diseñada para responder, tenga o no la información.</p>
<p>Pedirle a un LLM que te recomiende una serie coreana es una cosa. Llevarlo a una agencia aduanal, donde un error en un pedimento cuesta millones, es otra.</p>
<h2>Agentes con nombre propio</h2>
<p>Wong casi no habla de inteligencia artificial en abstracto; dice que la palabra ya se desgastó. Habla de agentes, y les pone nombre. El suyo se llama Maya. Hasta su registro al Foro de Tecnología MX lo llevó otro agente, Tito: cuando Eventbrite lo bloqueó, abrió una máquina virtual y siguió a mano.</p>
<h2>Una fuente de verdad contra la cual validar</h2>
<p>Su salida se llama Source of Truth (Sort). Un proceso compara cada pedimento que genera el agente contra esa fuente y, si no coincide, el agente vuelve a intentarlo. El modelo puede equivocarse; el sistema no deja pasar el error.</p>
<p>Con ese enfoque, Purple AI construyó SICVD sobre Dify y Llama, ambos open source, para la agencia aduanal Skerluchen. Capturar un pedimento le tomaba a un agente aduanal hasta dos días; con el sistema, toma una hora.</p>
{cifras([
    ('2 días → 1 h', 'para capturar un pedimento'),
    ('9', 'sistemas internos integrados'),
    ('24/7', 'los archivos se procesan de noche'),
    ('2', 'años con el loop agéntico'),
])}
{cita('El LLM no importa. Importa el contexto, las herramientas y la información que le das al agente.', 'Andrés Wong, Purple AI')}
<h2>Los tres dolores: conocimiento, infraestructura y costo</h2>
<p>Llegar ahí no fue gratis. En infraestructura, 30,000 dólares en GPUs no bastaron para la primera ronda; otros 30,000 tampoco. En costo, conectar el sistema a Google para estimar precios llegó a costar 11,500 pesos diarios, hasta que FreeRouter, el enrutador open source de Wong, lo bajó a 20 dólares al mes por modelo.</p>
<p>Si te interesa el lado económico, sigue con {enlace('lo-que-de-verdad-cuesta-un-token', 'lo que de verdad cuesta un token')}.</p>
{caja('Para el lunes', [
    'Dale a tu agente una fuente de verdad contra la cual validar.',
    'Invierte en contexto, herramientas y datos antes que en elegir modelo.',
    'Mide el costo por tarea antes de escalar.',
])}
''',
    },
    {
        'slug': 'la-receta-de-un-agente',
        'titulo': 'La receta de un agente',
        'rubro': 'Agentes virtuales',
        'temas': ['ia', 'negocio'],
        'extracto': 'Diseñar un agente virtual es como contratar a alguien: necesita un rol, un contrato, capacitación y límites claros.',
        'ponentes': [('David Modiano', 'Director, Net2Phone')],
        'fuentes': [('vol-02', 14)],
        'foto': ('/assets/img/revista-vol-02/david-modiano.jpg', 880, 1000, '50% 30%',
                 'David Modiano, director de Net2Phone, durante su plática sobre agentes virtuales en el Tech & Wine Fest.'),
        'cuerpo': f'''
<p>Para David Modiano, director de Net2Phone, un agente virtual se diseña igual que se contrata a una persona. Y con el marco correcto, armarlo toma menos de 20 minutos.</p>
<p>Su marco se lee en una palabra: RECETA.</p>
<ol class="post-receta">
<li><strong>R</strong><span><b>Rol.</b> Quién es y para quién trabaja.</span></li>
<li><strong>E</strong><span><b>Entorno.</b> Horarios, catálogo, SKU y políticas.</span></li>
<li><strong>C</strong><span><b>Capacidades.</b> Cuatro tareas como máximo, para que no divague.</span></li>
<li><strong>E</strong><span><b>Escalamiento.</b> Cuándo deja de intentar y pasa a un humano.</span></li>
<li><strong>T</strong><span><b>Tono.</b> Idiomas, trato y largo de las respuestas.</span></li>
<li><strong>A</strong><span><b>Ancla.</b> Los límites para que no alucine.</span></li>
</ol>
<h2>Si fuera una contratación</h2>
<p>La comparación con un empleado nuevo ordena las piezas técnicas:</p>
{pasos([
    ('El contrato es el system prompt.', 'Es el 80% del resultado.'),
    ('La capacitación es la base de conocimiento.', 'Lo que el agente sabe de tu negocio.'),
    ('La puerta es el número y la transferencia.', 'Por dónde llega el cliente y por dónde sale hacia un humano.'),
    ('Las manos son MCP y las integraciones.', 'Lo que el agente puede hacer, no solo decir.'),
])}
<p>En el Foro de Tecnología MX, Modiano ya había descrito ese tipo de agentes: los que clasifican, validan, canalizan y acompañan el flujo completo, 24/7.</p>
<h2>Lo que el cliente quiere</h2>
{cifras([('70 %', 'de las personas solo quiere que su problema se resuelva, conteste un humano o un agente')], 'Dato citado por David Modiano.')}
<p>Por eso el escalamiento y el ancla pesan tanto como el rol: un agente útil resuelve lo que le toca y sabe cuándo pasar la conversación.</p>
<p>Para el diseño de la experiencia completa, lee también {enlace('tecnologia-que-no-estorba', 'Tecnología que no estorba')}.</p>
{caja('Para el lunes', [
    'Dale a tu agente una receta y un ancla.',
    'Limítalo a cuatro tareas.',
    'Escribe desde el inicio cuándo pasa a un humano.',
])}
''',
    },
    {
        'slug': 'tecnologia-que-no-estorba',
        'titulo': 'Tecnología que no estorba',
        'rubro': 'Experiencia de cliente',
        'temas': ['negocio', 'ia'],
        'extracto': 'La IA en atención al cliente no llegó a sumar consolas, sino a romper los silos entre CRM, ERP y canales.',
        'ponentes': [('Raúl Reséndiz', 'CEO, Grupo Scentec'), ('David Modiano', 'Director comercial, Net2Phone')],
        'fuentes': [('vol-02', 11), ('vol-01', 16)],
        'foto': ('/assets/img/revista-vol-02/raul-resendiz.jpg', 800, 1100, '50% 28%',
                 'Raúl Reséndiz, CEO de Grupo Scentec, durante su plática en el Tech & Wine Fest.'),
        'cuerpo': f'''
<p>Reponer una tarjeta personalizada debería ser sencillo. En el modelo de siempre, el cliente reporta la tarjeta, escucha “eso es otro proceso”, lo transfieren, navega otro menú y repite sus datos. En total, 45 minutos.</p>
<p>Orquestado, el mismo trámite se ve distinto: el cliente lo pide una vez, llega con el especialista correcto, que ya tiene el contexto, y se resuelve directo.</p>
<p>Para Raúl Reséndiz, CEO de Grupo Scentec, ese es el punto. La IA llegó a romper silos entre CRM, ERP y canales, no a sumar consolas.</p>
{cita('La experiencia como usuario debe ser única, transparente, eficiente y expedita.', 'Raúl Reséndiz, Grupo Scentec')}
<h2>Tres reglas de diseño</h2>
{pasos([
    ('Con límites.', 'Un modelo cerrado a datos propios; un RAG fija qué puede decir.'),
    ('Con humano.', 'Transferir está en el diseño: el ejecutivo recibe el contexto.'),
    ('Omnicanal.', 'WhatsApp hoy, Messenger mañana: la experiencia no cambia.'),
])}
<h2>Un solo lugar, cada canal</h2>
<p>David Modiano, director comercial de Net2Phone, llevó la misma idea a las comunicaciones en el Foro de Tecnología MX: dejar atrás el conmutador físico y reunir telefonía, WhatsApp, redes, SMS y correo en una sola plataforma en la nube.</p>
<p>Así la atención sigue sin importar el canal y nadie pierde el contexto. Con métricas en tiempo real, además, cada conversación se vuelve información para entender mejor al cliente.</p>
{cita('Las comunicaciones unificadas con IA son una fuente estratégica de información sobre el cliente.', 'David Modiano, Net2Phone')}
<p>Si vas a construir el agente que atiende, empieza por {enlace('la-receta-de-un-agente', 'la receta de un agente')}.</p>
{caja('Para el lunes', [
    'Diseña la salida al humano, con contexto.',
    'Cuenta cuántas veces tu cliente repite sus datos en un trámite.',
    'Limita lo que el modelo puede decir a tus propios datos.',
])}
''',
    },
    {
        'slug': 'la-impresora-es-un-endpoint',
        'titulo': 'La impresora es un endpoint',
        'rubro': 'Impresión segura',
        'temas': ['ciberseguridad'],
        'extracto': 'Guarda datos, correos, contactos y hasta credenciales. Si no la tratas como cualquier otro equipo de la red, es una puerta abierta.',
        'ponentes': [('Josué Israel Gutiérrez', 'Sr. Solutions Technical Support, Canon Mexicana'), ('David Juárez Maldonado', 'Canon Mexicana')],
        'fuentes': [('vol-02', 15), ('vol-01', 13)],
        'foto': ('/assets/img/revista-vol-02/josue-israel-gutierrez.jpg', 1800, 752, '22% 45%',
                 'Josué Israel Gutiérrez, de Canon Mexicana, durante su plática en el Tech & Wine Fest.'),
        'cuerpo': f'''
<p>No dejarías las llaves de tu casa a la vista. Con esa imagen, David Juárez Maldonado, de Canon Mexicana, recordó en el Foro de Tecnología MX algo que casi todos olvidan: una impresora guarda datos, correos, contactos y hasta credenciales.</p>
{cita('Cada vez que pones Ctrl+P no es solo imprimir una hoja.', 'David Juárez Maldonado, Canon Mexicana')}
{cifras([
    ('56 %', 'de las organizaciones ha reportado al menos una pérdida de datos relacionada con impresión'),
    ('58 mil mill.', 'de intentos de ciberataque al año'),
    ('Top 3', 'México, entre los más atacados de Latinoamérica'),
], 'Cifras citadas por David Juárez Maldonado.')}
<h2>Tres frentes</h2>
<p>Juárez señaló tres: el ransomware, el phishing que entra por equipos sin asegurar y la falsa seguridad de quien cree que basta un antivirus. Su llamado fue volver a lo básico: monitoreo, actualizaciones y Zero Trust también en periféricos.</p>
<h2>Un tercero más</h2>
<p>En el Tech &amp; Wine Fest, Josué Israel Gutiérrez, también de Canon Mexicana, lo llevó un paso más allá: muchos ataques llegan por un tercero, y la impresora también es uno.</p>
<p>Una impresora comprometida puede detener la operación o imprimir los mensajes del atacante. Y el riesgo no siempre está en tu red: Gutiérrez citó el caso de un competidor cuya nube de impresión falló y dejó expuestas a 240 empresas. El 60% eran escuelas y hospitales.</p>
<p>Su propuesta: arranque seguro, información cifrada e IA que vigila la red.</p>
{caja('Pregúntale a tu proveedor de impresión', [
    '¿Qué hace el equipo si alguien altera su arranque?',
    '¿Lo que se imprime queda cifrado?',
    '¿Puedo saber quién imprime, qué y cuándo?',
    '¿Cómo reaccionan si los hackean a ellos?',
])}
''',
    },
    {
        'slug': 'ti-es-el-negocio',
        'titulo': 'TI es el negocio',
        'rubro': 'Liderazgo',
        'temas': ['negocio'],
        'extracto': 'Ya no se buscan proveedores, sino socios que acompañen desde el diseño. Y la infraestructura es el cimiento de todo lo demás.',
        'ponentes': [('Victor Mendivil', 'Director de IT & Data para Norteamérica, Ontex')],
        'fuentes': [('vol-02', 12)],
        'foto': ('/assets/img/revista-vol-02/conversacion-monica-victor.jpg', 1408, 1080, '50% 35%',
                 'Mónica Pelayo, de Mopec Security, y Victor Mendivil, de Ontex, en conversación durante el Tech & Wine Fest.'),
        'cuerpo': f'''
<p>“TI no es parte del negocio. TI es el negocio.” Victor Mendivil atribuye la frase a un mentor, y la repitió frente al público del Tech &amp; Wine Fest, en conversación con Mónica Pelayo, de Mopec Security.</p>
<p>Mendivil es director de IT &amp; Data para Norteamérica en Ontex, consejero de ALTI y fue CIO de Ópticas Devlyn. Estas son sus respuestas, editadas por claridad.</p>
<h2>¿Qué buscas hoy en un socio de tecnología?</h2>
<p>“Ya no buscamos proveedores; eso era el pasado. El producto hasta lo puedo comprar en Amazon. Necesitamos a alguien experto que nos acompañe desde el diseño.”</p>
<h2>¿Qué tan importante es la infraestructura?</h2>
<p>“Es el cimiento del edificio. Puedes comprar la mejor cámara del mundo, pero si no tienes buen cableado ni un buen enlace a la nube, no le sacas provecho.”</p>
<h2>¿Sirve a otras áreas, además de seguridad?</h2>
<p>“En Best Buy, en 2008, ya usábamos cámaras para contar cuánta gente entraba y cuánta compraba. Con ellas también se hacen mapas de calor para medir las cabeceras de oferta.”</p>
{cita('TI no es parte del negocio. TI es el negocio.', 'Victor Mendivil, Ontex')}
<p>La conversación siguió con casos de video con IA en planta, que reunimos en {enlace('de-camaras-a-neuronas-digitales', 'De cámaras a neuronas digitales')}.</p>
{caja('Para el lunes', [
    'Busca socios, no proveedores, y diseña a cinco años.',
    'Antes de comprar el equipo, revisa el cableado y el enlace que lo van a sostener.',
    'Pregunta qué otra área puede aprovechar la tecnología que ya tienes.',
])}
''',
    },
    {
        'slug': 'de-camaras-a-neuronas-digitales',
        'titulo': 'De cámaras a neuronas digitales',
        'rubro': 'Video inteligente',
        'temas': ['industria', 'ia'],
        'extracto': 'El CCTV se pensó para grabar y revisar después. Hoy la cámara analiza en el momento y convierte lo que ve en indicadores de negocio.',
        'ponentes': [('Francisco Banda', 'Mopec Security'), ('Victor Mendivil', 'Ontex'), ('Miguel Centeno', 'Hikvision')],
        'fuentes': [('vol-01', 6), ('vol-02', 12)],
        'foto': ('/assets/img/revista-vol-01/francisco-banda.jpg', 1000, 667, '50% 50%',
                 'Francisco Banda, de Mopec Security, frente a la frase “Lo que ven hoy es solo el comienzo” en su presentación.'),
        'cuerpo': f'''
<p>El CCTV se diseñó para guardar video y revisarlo después de un incidente. Dependía de servidores locales, almacenamiento central y horas de revisión manual, y el valor de lo grabado se quedaba en el disco.</p>
<p>Francisco Banda, de Mopec Security, describió en el Foro de Tecnología MX el paso siguiente: de cámaras a neuronas digitales.</p>
<h2>Procesar en el borde</h2>
<p>Las neuronas digitales integran cámara, sensores y procesamiento en el borde. Cada cámara procesa lo que ve y envía solo metadatos, así que el sistema sigue operando aunque la conexión sea limitada.</p>
<p>El panel de control se vuelve un centro de inteligencia: correlaciona dispositivos, muestra métricas en tiempo real y busca con IA entre miles de eventos.</p>
<h2>Del video al indicador de negocio</h2>
{pasos([
    ('Retail.', 'Cruza video con POS y ERP para reducir mermas y auditar.'),
    ('Manufactura.', 'Detecta riesgos laborales de forma automática.'),
    ('Operación.', 'Convierte lo que se ve en indicadores para decidir.'),
])}
<h2>Lo que ya se hace en planta</h2>
<p>En el Tech &amp; Wine Fest, Victor Mendivil, director de IT &amp; Data para Norteamérica en Ontex, compartió casos concretos con Verkada, que Mopec Security distribuye en México:</p>
<ul>
<li><b>C-TPAT:</b> la cámara de acceso guarda placa y modelo de cada auto.</li>
<li><b>Incidentes:</b> “Búscame un accidente en las últimas 12 horas”, y aparece el clip.</li>
<li><b>Zonas críticas:</b> una línea virtual avisa, con video, cuando alguien la cruza.</li>
<li><b>Piso:</b> alerta si alguien saca el celular donde no se permite.</li>
</ul>
<h2>El video también es IoT</h2>
<p>Más cámaras inteligentes también significa más dispositivos en la red. Miguel Centeno, de Hikvision, lo recordó en el Foro: su búsqueda en video con lenguaje natural se apoya en ISO 27000 y NIS, pero el sistema depende también del firewall del cliente.</p>
{caja('Para el lunes', [
    'Procesa en el borde y manda solo metadatos.',
    'Elige un indicador de negocio que tu video ya podría medir.',
    'Trata cada cámara como un dispositivo de red más.',
])}
''',
    },
    {
        'slug': 'proteger-el-dato-donde-este',
        'titulo': 'Proteger el dato donde esté',
        'rubro': 'Ciberseguridad',
        'temas': ['ciberseguridad', 'ia'],
        'extracto': 'IA, identidades no humanas y dependencia tecnológica cambiaron la superficie de ataque. Del perímetro a la identidad: qué cambió y por dónde empezar.',
        'ponentes': [('Omar Jaimes Hernández', 'Scitum'), ('Diego Garza', 'Veeam'), ('Gustavo Rodríguez', 'Grupo Trycer')],
        'fuentes': [('vol-01', 14)],
        'foto': ('/assets/img/revista-vol-01/publico-salon.jpg', 1000, 667, '50% 50%',
                 'Público del Foro de Tecnología MX en el salón principal.'),
        'cuerpo': f'''
<p>Durante años, el foco de la seguridad fue el perímetro. Hoy el dato vive dentro y fuera del centro de datos, y protegerlo exige identidad, MFA y privilegios por rol.</p>
<p>Así lo planteó Diego Garza, de Veeam, en el panel de ciberseguridad del Foro de Tecnología MX, junto a Omar Jaimes Hernández, de Scitum, y Gustavo Rodríguez, de Grupo Trycer. El panel coincidió en tres ejes: identidades, resiliencia y soberanía.</p>
<h2>Identidades que no son personas</h2>
<p>Las identidades no humanas son APIs, software y agentes de IA, y ya forman parte de la superficie de ataque. Para gobernarlas, Scitum recomendó NIST 800-63 y, para agentes de IA, NIST AI 100.</p>
<h2>Lo que se sube ya no se baja</h2>
<p>Para Omar Jaimes Hernández, el riesgo real está en lo que se comparte: documentos corporativos completos terminan en servicios de IA externos, de donde ya no hay manera de retirarlos.</p>
<h2>Resiliencia</h2>
<p>Tener respaldos no es estar protegido. Garza pidió definir RPO y RTO y probar la recuperación; lo desarrollamos en {enlace('respaldar-no-es-recuperar', 'Respaldar no es recuperar')}.</p>
<h2>Soberanía y cadena de suministro</h2>
<p>Gustavo Rodríguez sumó dos matices. Uno legal: un dato alojado en Querétaro, bajo un régimen cloud de Estados Unidos, puede ser requerido por autoridades extranjeras. La soberanía, entendida como control propio de la infraestructura, el dato y el marco legal, tiene una meta nacional en 2030, y según el panel solo es viable en parte.</p>
<p>Otro práctico: los atacantes van siempre al eslabón más débil, que es la cadena de suministro. Gustavo lo explica a fondo en {enlace('el-codigo-que-no-escribiste', 'El código que no escribiste')}.</p>
{caja('Por dónde empezar', [
    '<b>Identidad:</b> NIST 800-63 y, para agentes de IA, NIST AI 100.',
    '<b>Respaldo:</b> prueba la recuperación en ambientes aislados.',
    '<b>Proveedores:</b> CIS Benchmarks y pentesting a APIs y dependencias.',
    '<b>IA:</b> vigila qué información se comparte con herramientas externas.',
])}
''',
    },
    {
        'slug': 'cuando-it-heredo-la-fabrica',
        'titulo': 'Cuando IT heredó la fábrica',
        'rubro': 'Ciberseguridad industrial',
        'temas': ['industria', 'ciberseguridad'],
        'extracto': 'Durante décadas, las plantas operaron aisladas para proteger la producción. Hoy comparten red con la oficina, y eso lo cambia todo.',
        'ponentes': [('Derly Alí Gutiérrez Arellano', 'Fortinet')],
        'fuentes': [('vol-01', 17)],
        'portadilla': 'IT + OT',
        'cuerpo': f'''
<p>Durante décadas, las plantas industriales operaron aisladas, y era a propósito: así se protegía la producción. Derly Alí Gutiérrez Arellano, de Fortinet, explicó en el Foro de Tecnología MX qué cambia cuando IT y OT comparten red.</p>
<p>La Industria 4.0 y la IA integran ambos mundos. Eso trae más eficiencia, pero también una superficie de exposición mucho mayor.</p>
<h2>Tres cambios</h2>
{pasos([
    ('Más conexiones.', 'Cada dispositivo conectado es un posible punto de acceso.'),
    ('Nuevas superficies.', 'Equipos antes aislados hoy hablan con aplicaciones corporativas.'),
    ('Disponibilidad.', 'Un incidente detiene líneas y puede comprometer la seguridad física.'),
])}
<h2>En OT manda la disponibilidad</h2>
<p>En la planta, la prioridad es que la línea no se detenga. Por eso toda protección en OT debe tocar lo menos posible la producción y convivir con equipos que operan durante décadas.</p>
<p>Eso cambia cómo se implementa casi todo: los parches, los escaneos y los cortes de red que en la oficina son rutina, en la planta se planean con producción.</p>
<h2>La IA también cuida la planta</h2>
<p>La misma tecnología que amplía la superficie ayuda a defenderla. La IA analiza datos de sensores, redes y sistemas de control, detecta anomalías y alerta temprano.</p>
<p>Para ver cómo se integran borde, energía y video en un proyecto de planta, sigue con {enlace('cuatro-piezas-una-operacion', 'Cuatro piezas, una operación')}.</p>
{caja('Para el lunes', [
    'Protege la planta sin detener la producción.',
    'Haz inventario de cada dispositivo de planta conectado a la red corporativa.',
    'Acuerda con producción las ventanas para cualquier cambio de seguridad.',
])}
''',
    },
    {
        'slug': 'agentes-que-analizan-y-actuan',
        'titulo': 'Agentes que analizan y actúan',
        'rubro': 'Infraestructura',
        'temas': ['nube', 'ia'],
        'extracto': 'La nube dejó de ser un lugar donde se alojan cargas. Con IA, ejecuta y automatiza procesos completos.',
        'ponentes': [('Francisco Olazo', 'Enteracloud')],
        'fuentes': [('vol-01', 4)],
        'foto': ('/assets/img/revista-vol-01/francisco-olazo.jpg', 1000, 667, '60% 40%',
                 'Francisco Olazo, de Enteracloud, con el micrófono frente a un diagrama de su plataforma en el Foro de Tecnología MX.'),
        'cuerpo': f'''
<p>Para Francisco Olazo, de Enteracloud, la nube cambió de función. Dejó de ser un lugar donde se alojan cargas: con IA, ejecuta y automatiza procesos completos.</p>
<h2>Una plataforma hecha con IA</h2>
<p>Olazo lo demostró con su propio caso. Construyó con IA una plataforma SaaS sin ser programador profesional: integró APIs, bases de datos y servicios en una fracción del tiempo habitual.</p>
<p>En la demostración del Foro de Tecnología MX, la plataforma descubrió sola la infraestructura y generó inventario, diagramas de red, reportes de seguridad y una comparación de costos entre nubes, en minutos. Sus agentes también reciben solicitudes por WhatsApp y ejecutan scripts de PowerShell.</p>
{cita('El aprendizaje no estuvo en escribir código, sino en estructurar los prompts.', 'Francisco Olazo, Enteracloud')}
<h2>Tres pilares, una sola nube</h2>
{pasos([
    ('La nube.', 'Cómputo, redes y almacenamiento redundante. Replicar entre centros de datos sostiene la operación.'),
    ('Linux.', 'Una capa de control estable para cargas de IA. No es migrar todo: es usarlo donde conviene.'),
    ('La IA.', 'Analiza, despliega, automatiza y decide. Vuelve inteligente a la infraestructura.'),
])}
{caja('Para el lunes', [
    'Usa la IA para potenciar a TI, no para reemplazarla.',
    'Empieza por automatizar el inventario y los diagramas que hoy haces a mano.',
    'Dedica tiempo a estructurar los prompts, no solo a escribir código.',
])}
''',
    },
    {
        'slug': 'el-forense-ya-no-trabaja-solo',
        'titulo': 'El forense ya no trabaja solo',
        'rubro': 'Forense digital',
        'temas': ['ciberseguridad', 'ia'],
        'extracto': 'La IA ya es un colaborador del investigador: procesa evidencia, encuentra patrones y acelera la investigación. El criterio sigue siendo humano.',
        'ponentes': [('Gustavo Rodríguez', 'Grupo Trycer')],
        'fuentes': [('vol-01', 12)],
        'foto': ('/assets/img/revista-vol-01/gustavo-rodriguez.jpg', 1000, 1333, '50% 45%',
                 'Gustavo Rodríguez, de Grupo Trycer, con el micrófono en el escenario del Foro de Tecnología MX.'),
        'cuerpo': f'''
<p>Una investigación digital hecha a mano sigue siempre el mismo camino: revisar registros, buscar patrones y redactar el reporte. Toma tiempo, y en un incidente el tiempo cuesta.</p>
<p>Gustavo Rodríguez, de Grupo Trycer, mostró el otro camino en el Foro de Tecnología MX: preguntar en lenguaje natural y obtener un reporte preliminar. Para él, la IA ya es un colaborador del investigador: procesa evidencia, encuentra patrones y acelera la investigación.</p>
<h2>Quién hace qué</h2>
{pasos([
    ('La IA procesa.', 'Revisa registros, resume y propone relaciones entre evidencias.'),
    ('El analista decide.', 'Valida la evidencia, cuida la cadena de custodia y define la respuesta.'),
    ('Sin comandos.', 'Explora la evidencia con consultas conversacionales.'),
])}
<p>La división importa. La IA acorta el trabajo repetitivo; la validación, la cadena de custodia y la decisión final siguen en manos del investigador. El futuro del DFIR, la respuesta forense a incidentes, no es reemplazar al investigador: es sumarle agentes al equipo.</p>
<h2>Por qué la velocidad importa</h2>
<p>En el Tech &amp; Wine Fest, el mismo Gustavo citó que detectar una brecha toma en promedio más de 250 días. Cualquier hora que se le gane a la investigación cuenta.</p>
<p>Sobre de dónde vienen hoy muchos de esos ataques, lee {enlace('el-codigo-que-no-escribiste', 'El código que no escribiste')}.</p>
{caja('Para el lunes', [
    'Deja que la IA procese; el criterio sigue siendo tuyo.',
    'Documenta la cadena de custodia también cuando la IA participa.',
])}
''',
    },
    {
        'slug': 'cuatro-piezas-una-operacion',
        'titulo': 'Cuatro piezas, una operación',
        'rubro': 'Operación en planta',
        'temas': ['industria'],
        'extracto': 'Borde, energía, video e integración resuelven problemas distintos. Juntos forman la columna vertebral de un proyecto en planta.',
        'ponentes': [('Enrique Guzmán', 'Avit'), ('Rafael Ríos', 'Zebra'), ('Miguel Centeno', 'Hikvision'), ('Gustavo Lugo', 'Panduit')],
        'fuentes': [('vol-01', 10)],
        'portadilla': 'Zero defect',
        'cuerpo': f'''
<p>Por separado resuelven problemas distintos. Juntos forman la columna vertebral de un proyecto operativo en planta. Esa fue la tesis del panel de Avit, Zebra, Hikvision y Panduit en el Foro de Tecnología MX.</p>
<h2>Las cuatro piezas</h2>
{pasos([
    ('Borde.', 'RFID, escaneo y visión artificial procesan en el dispositivo; la red recibe el dato limpio.'),
    ('Energía.', 'FMPS lleva energía hasta dos kilómetros y administra las fallas en tiempo real.'),
    ('Video.', 'La búsqueda corre en la cámara y encuentra eventos en el video con lenguaje natural.'),
    ('Integración.', 'Diagnóstico consultivo, nada de vender cajas, y números para justificar la inversión.'),
])}
<h2>Del dato limpio al zero defect</h2>
<p>Rafael Ríos, de Zebra, explicó cómo funciona la visión artificial en una línea: la cámara toma unas 100 fotos de piezas buenas y malas, la IA aprende el defecto y aparta como anomalía lo que no conoce. Esos datos permiten atacar el problema desde la raíz.</p>
<h2>El video también es IoT</h2>
<p>Miguel Centeno, de Hikvision, recordó que una cámara inteligente es un dispositivo más en la red. Su plataforma se apoya en ISO 27000 y NIS, pero, como dice Chuck Davis, vicepresidente global de ciberseguridad de la marca, el sistema depende también del firewall del cliente.</p>
<h2>Energía, en cifras</h2>
{cifras([
    ('2 km', 'de energía con FMPS, con gestión de fallas en tiempo real'),
    ('≈ 20 %', 'menos CAPEX sin IDFs extra para cámaras'),
    ('40 %', 'de ahorro máximo frente a una instalación eléctrica tradicional'),
    ('150 m', 'de cobre con datos, con Extended Reach'),
], 'Cifras citadas por Gustavo Lugo, Panduit.')}
<h2>Lo que lo vuelve resultado</h2>
<p>Enrique Guzmán, de Avit, cerró con la idea que une todo: las cuatro tecnologías no son silos, y lo que convierte lo instalado en resultados es la adopción. Capacitación, entrenamiento continuo y actualizaciones.</p>
{caja('Para el lunes', [
    'Integra: borde, energía y video no son silos.',
    'Presupuesta la capacitación junto con el equipo, no después.',
])}
''',
    },
    {
        'slug': 'dieciseis-ideas-para-el-lunes',
        'titulo': '16 ideas para el lunes',
        'rubro': 'Resumen',
        'temas': [],
        'extracto': 'Lo que nos llevamos de Tijuana y del Valle de Guadalupe, en una frase por plática. Cada idea enlaza a su entrada completa.',
        'ponentes': [],
        'fuentes': [('vol-01', 19), ('vol-02', 16)],
        'foto': ('/assets/img/revista-vol-01/publico-foro.jpg', 1000, 667, '50% 45%',
                 'Público del Foro de Tecnología MX 2026, en Tijuana.'),
        'cuerpo': f'''
<p>Cada edición de la revista cierra con ocho ideas para aplicar el lunes, una por plática. Juntamos las dieciséis del Foro de Tecnología MX y del Tech &amp; Wine Fest. Son la versión corta de todo el blog.</p>
<h2>Del Foro de Tecnología MX, en Tijuana</h2>
<ol class="post-ideas">
<li><p>Usa la IA para potenciar a TI, no para reemplazarla.</p><span>Francisco Olazo · {enlace('agentes-que-analizan-y-actuan', 'Leer')}</span></li>
<li><p>Procesa en el borde y manda solo metadatos.</p><span>Francisco Banda · {enlace('de-camaras-a-neuronas-digitales', 'Leer')}</span></li>
<li><p>Dale a tu agente una fuente de verdad contra la cual validar.</p><span>Andrés Wong · {enlace('la-ia-no-alucina-miente', 'Leer')}</span></li>
<li><p>Integra: borde, energía y video no son silos.</p><span>Enrique Guzmán · {enlace('cuatro-piezas-una-operacion', 'Leer')}</span></li>
<li><p>Deja que la IA procese; el criterio sigue siendo tuyo.</p><span>Gustavo Rodríguez · {enlace('el-forense-ya-no-trabaja-solo', 'Leer')}</span></li>
<li><p>Trata cada impresora como un punto de exposición.</p><span>David Juárez Maldonado · {enlace('la-impresora-es-un-endpoint', 'Leer')}</span></li>
<li><p>Prueba tu recuperación; no la supongas.</p><span>Diego Garza · {enlace('respaldar-no-es-recuperar', 'Leer')}</span></li>
<li><p>Protege la planta sin detener la producción.</p><span>Derly Alí Gutiérrez · {enlace('cuando-it-heredo-la-fabrica', 'Leer')}</span></li>
</ol>
<h2>Del Tech &amp; Wine Fest, en el Valle de Guadalupe</h2>
<ol class="post-ideas" start="9">
<li><p>Mapea de quién dependes: cada librería es una puerta.</p><span>Gustavo Rodríguez · {enlace('el-codigo-que-no-escribiste', 'Leer')}</span></li>
<li><p>Mide los tokens antes de prometer ahorros.</p><span>Andrés Wong · {enlace('lo-que-de-verdad-cuesta-un-token', 'Leer')}</span></li>
<li><p>Restaura un respaldo este mes; no solo lo guardes.</p><span>Francisco Olazo · {enlace('respaldar-no-es-recuperar', 'Leer')}</span></li>
<li><p>Diseña la salida al humano, con contexto.</p><span>Raúl Reséndiz · {enlace('tecnologia-que-no-estorba', 'Leer')}</span></li>
<li><p>Busca socios, no proveedores, y diseña a cinco años.</p><span>Victor Mendivil · {enlace('ti-es-el-negocio', 'Leer')}</span></li>
<li><p>Dale a tu agente una receta y un ancla.</p><span>David Modiano · {enlace('la-receta-de-un-agente', 'Leer')}</span></li>
<li><p>Trata a tu impresora como cualquier endpoint.</p><span>Josué Israel Gutiérrez · {enlace('la-impresora-es-un-endpoint', 'Leer')}</span></li>
<li><p>Sal de la oficina: el ecosistema se hace en persona.</p><span>Josué Madera</span></li>
</ol>
''',
    },
]

POR_SLUG = {p['slug']: p for p in ENTRADAS}

# Orden del homepage: destacada, lo último (4) y el carrusel.
INICIO_DESTACADA = 'el-codigo-que-no-escribiste'
INICIO_RECIENTES = ['lo-que-de-verdad-cuesta-un-token', 'respaldar-no-es-recuperar',
                    'la-ia-no-alucina-miente', 'la-receta-de-un-agente']
INICIO_CARRUSEL = ['tecnologia-que-no-estorba', 'la-impresora-es-un-endpoint', 'ti-es-el-negocio',
                   'de-camaras-a-neuronas-digitales', 'proteger-el-dato-donde-este',
                   'cuando-it-heredo-la-fabrica', 'agentes-que-analizan-y-actuan',
                   'el-forense-ya-no-trabaja-solo', 'dieciseis-ideas-para-el-lunes']


# ---------- Datos derivados ----------

def minutos(p):
    texto = re.sub(r'<[^>]+>', ' ', p['cuerpo'])
    palabras = len(re.findall(r'\w+', html.unescape(texto)))
    return max(2, math.ceil(palabras / 200))


def eventos_de(p):
    vistos = []
    for vol, _ in p['fuentes']:
        nombre = EVENTOS[vol][0]
        if nombre not in vistos:
            vistos.append(nombre)
    return vistos


def con_quien(p):
    if not p['ponentes']:
        return 'Redacción Hablemos Tech'
    nombres = [n for n, _ in p['ponentes']]
    if len(nombres) == 1:
        return nombres[0]
    if len(nombres) == 2:
        return f'{nombres[0]} y {nombres[1]}'
    return f'{nombres[0]} y {len(nombres) - 1} más'


def url(p):
    return f'/blog/{p["slug"]}/'


def relacionadas(p, n=3):
    puntaje = []
    for i, otra in enumerate(ENTRADAS):
        if otra is p:
            continue
        comunes = len(set(p['temas']) & set(otra['temas']))
        puntaje.append((-comunes, i, otra))
    puntaje.sort(key=lambda x: (x[0], x[1]))
    return [o for _, _, o in puntaje[:n]]


# ---------- Piezas compartidas ----------

def portadilla(p, clase):
    return (f'<span class="{clase} blog-portadilla" aria-hidden="true">'
            f'<img src="/assets/img/asterisco.png?v=1" alt="" width="64" height="64">'
            f'<span class="blog-portadilla__texto">{e(p["portadilla"])}</span></span>')


def foto(p, clase, carga='lazy'):
    if 'foto' not in p:
        return portadilla(p, clase)
    src, w, h, foco, _ = p['foto']
    return (f'<img class="{clase}" src="{src}" alt="" width="{w}" height="{h}" '
            f'loading="{carga}" decoding="async" style="--foco: {foco}">')


def pie(*partes):
    return '<p class="blog-pie">' + ''.join(f'<span>{e(x)}</span>' for x in partes) + '</p>'


def tarjeta(p, titulo_tag='h3', extra=''):
    temas = ' '.join(p['temas'])
    return f'''<li class="blog-tarjeta" data-temas="{temas}"{extra}>
              <a class="blog-tarjeta__enlace" href="{url(p)}">
                {foto(p, 'blog-tarjeta__foto')}
                <span class="blog-chip">{e(p['rubro'])}</span>
                <{titulo_tag} class="blog-tarjeta__titulo">{e(p['titulo'])}</{titulo_tag}>
                <p class="blog-tarjeta__extracto">{e(p['extracto'])}</p>
                {pie(con_quien(p), f'{minutos(p)} min de lectura')}
              </a>
            </li>'''


def destacada(p, titulo_tag='h3'):
    return f'''<article class="blog-destacado">
            <a class="blog-destacado__enlace" href="{url(p)}">
              {foto(p, 'blog-destacado__foto')}
              <div class="blog-destacado__capa">
                <span class="blog-chip blog-chip--vidrio">{e(p['rubro'])}</span>
                <{titulo_tag} class="blog-destacado__titulo">{e(p['titulo'])}</{titulo_tag}>
                <p class="blog-destacado__extracto">{e(p['extracto'])}</p>
                {pie(con_quien(p), f'{minutos(p)} min de lectura')}
              </div>
            </a>
          </article>'''


FLECHA_IZQ = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3.5 5.5 8 10 12.5" /></svg>'
FLECHA_DER = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5" /></svg>'

SCRIPTS_CUENTA = '''  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/js/config.js"></script>
  <script src="/js/auth/client.js"></script>
  <script src="/js/beacon-leads.js"></script>
  <script src="/js/auth/session.js?v=202610131100"></script>
  <script src="/js/auth/nav.js?v=202608251752"></script>
  <script src="/js/auth/modal.js?v=202610131130"></script>'''


def cabeza(titulo, descripcion, ruta, imagen, tipo='website', extra=''):
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{e(titulo)}</title>
  <meta name="description" content="{e(descripcion)}">
  <link rel="canonical" href="{SITIO}{ruta}">
  <meta property="og:type" content="{tipo}">
  <meta property="og:site_name" content="Hablemos Tech">
  <meta property="og:locale" content="es_MX">
  <meta property="og:title" content="{e(titulo)}">
  <meta property="og:description" content="{e(descripcion)}">
  <meta property="og:url" content="{SITIO}{ruta}">
  <meta property="og:image" content="{SITIO}{imagen}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/img/asterisco.png?v=favicon" type="image/png">
  <link rel="stylesheet" href="/css/hablemos.css?v={VERSION_CSS}">
{extra}</head>'''


def imagen_social(p):
    return p['foto'][0] if 'foto' in p else '/assets/img/revista-vol-01/portada-web.jpg'


# ---------- Página de cada entrada ----------

def pagina_entrada(p):
    eventos = eventos_de(p)
    if p['ponentes']:
        ponentes = ''.join(
            f'<li><strong>{e(n)}</strong><span>{e(c)}</span></li>' for n, c in p['ponentes'])
        firma_ponentes = f'<ul class="post__ponentes" aria-label="Ponentes">{ponentes}</ul>'
    else:
        firma_ponentes = ''

    if 'foto' in p:
        src, w, h, foco, leyenda = p['foto']
        portada = f'''<figure class="post__portada">
        <img src="{src}" alt="{e(leyenda)}" width="{w}" height="{h}" fetchpriority="high" decoding="async" style="--foco: {foco}">
        <figcaption>{e(leyenda)}</figcaption>
      </figure>'''
    else:
        portada = f'''<figure class="post__portada post__portada--tipografica" aria-hidden="true">
        {portadilla(p, 'post__portadilla')}
      </figure>'''

    fuentes = []
    for vol, pag in p['fuentes']:
        evento, edicion = EVENTOS[vol]
        fuentes.append(f'<li><span>{e(edicion)}, p. {pag:02d}</span><span>{e(evento)}</span></li>')

    if p['ponentes']:
        nombres = [n for n, _ in p['ponentes']]
        lista = nombres[0] if len(nombres) == 1 else ', '.join(nombres[:-1]) + ' y ' + nombres[-1]
        base = f'Este texto se basa en lo que compartieron {e(lista)}' if len(nombres) > 1 else f'Este texto se basa en la plática de {e(lista)}'
        base += f' en {e(" y ".join(eventos))}, y se publicó primero en la revista Hablemos Tech.'
    else:
        base = 'Este texto reúne los cierres de las dos primeras ediciones de la revista Hablemos Tech.'

    tarjetas = '\n            '.join(tarjeta(o, 'h3') for o in relacionadas(p))

    ld = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': p['titulo'],
        'description': p['extracto'],
        'image': SITIO + imagen_social(p),
        'datePublished': PUBLICADO,
        'inLanguage': 'es-MX',
        'author': {'@type': 'Organization', 'name': 'Redacción Hablemos Tech'},
        'publisher': {'@type': 'Organization', 'name': 'Hablemos Tech', 'url': SITIO},
        'mainEntityOfPage': SITIO + url(p),
    }
    extra = f'  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n'

    return f'''{cabeza(f"{p['titulo']} — Blog Hablemos Tech", p['extracto'], url(p), imagen_social(p), 'article', extra)}
<body class="pagina-revista pagina-blog">
  <div id="site-nav"></div>
  <script src="/components/nav/site-nav.js" data-current="blog"></script>

  <main class="post">
    <article class="post__articulo" aria-labelledby="post-titulo">
      <header class="post__cabecera">
        <nav class="post__migas" aria-label="Ruta">
          <a href="/blog/">{FLECHA_IZQ}Blog</a>
        </nav>
        <span class="blog-chip">{e(p['rubro'])}</span>
        <h1 class="post__titulo" id="post-titulo">{e(p['titulo'])}</h1>
        <p class="post__lead">{e(p['extracto'])}</p>
        <div class="post__firma">
          {firma_ponentes}
          {pie('Redacción Hablemos Tech', ' · '.join(eventos) if eventos else 'Vol. 01 y Vol. 02', f'{minutos(p)} min de lectura')}
        </div>
      </header>

      {portada}

      <div class="post__cuerpo">
{p['cuerpo'].strip()}
      </div>

      <footer class="post__fuente">
        <p class="post__fuente-texto">{base}</p>
        <ul class="post__fuente-lista">{''.join(fuentes)}</ul>
      </footer>
    </article>

    <section class="post-relacionados" aria-labelledby="relacionados-titulo">
      <h2 class="blog__subtitulo" id="relacionados-titulo">Sigue leyendo</h2>
      <ul class="blog-rejilla">
            {tarjetas}
      </ul>
    </section>

    <section class="post-boletin" aria-labelledby="post-boletin-titulo">
      <h2 class="post-boletin__titulo" id="post-boletin-titulo">La próxima edición, en tu correo.</h2>
      <p class="post-boletin__texto">Te avisamos cuando salga una revista nueva, un episodio o un evento.</p>
      <a class="boton boton--principal" href="/#boletin">Suscribirme al boletín</a>
    </section>
  </main>

{SCRIPTS_CUENTA}
</body>
</html>
'''


# ---------- Índice del blog ----------

def pagina_indice():
    primera, resto = ENTRADAS[0], ENTRADAS[1:]
    filtros = ''.join(
        f'<li><button class="blog-filtro" type="button" data-tema="{t}" aria-pressed="false">{e(n)}</button></li>'
        for t, n in TEMAS)
    tarjetas = '\n            '.join(tarjeta(p, 'h2') for p in resto)
    descripcion = 'Ideas que no caducan sobre ciberseguridad, IA, nube e industria, a partir de las pláticas de los eventos de Hablemos Tech.'
    return f'''{cabeza('Blog — Hablemos Tech', descripcion, '/blog/', imagen_social(primera))}
<body class="pagina-revista pagina-blog">
  <div id="site-nav"></div>
  <script src="/components/nav/site-nav.js" data-current="blog"></script>

  <main class="pagina-revista__contenedor blog-indice">
    <header class="revista-hub__cabecera">
      <p class="revista-hub__ceja">
        <img class="revista-hub__asterisco" src="/assets/img/asterisco.png?v=1" alt="" width="64" height="64">
        Blog
      </p>
      <h1 class="revista-hub__titulo">Notas del escenario</h1>
      <p class="revista-hub__lead">Lo más útil de nuestros eventos, editado para leerse en unos minutos: ciberseguridad, IA, nube e industria, con lo que puedes aplicar el lunes.</p>
    </header>

    <div class="blog-indice__destacada" data-blog-destacada data-temas="{' '.join(primera['temas'])}">
      {destacada(primera, 'h2')}
    </div>

    <div class="blog-indice__barra">
      <ul class="blog-filtros" aria-label="Filtrar por tema" hidden data-blog-filtros>
        <li><button class="blog-filtro" type="button" data-tema="" aria-pressed="true">Todo</button></li>
        {filtros}
      </ul>
      <p class="blog-indice__conteo" data-blog-conteo aria-live="polite">{len(ENTRADAS)} entradas</p>
    </div>

    <ul class="blog-rejilla" data-blog-rejilla>
            {tarjetas}
    </ul>
  </main>

{SCRIPTS_CUENTA}
  <script src="/js/blog-indice.js?v={VERSION_JS}"></script>
</body>
</html>
'''


# ---------- Sección del homepage ----------

def seccion_inicio():
    d = POR_SLUG[INICIO_DESTACADA]
    recientes = []
    for slug in INICIO_RECIENTES:
        p = POR_SLUG[slug]
        recientes.append(f'''<li>
                <a class="blog-reciente" href="{url(p)}">
                  {foto(p, 'blog-reciente__foto')}
                  <div class="blog-reciente__texto">
                    <h4 class="blog-reciente__titulo">{e(p['titulo'])}</h4>
                    {pie(con_quien(p), f'{minutos(p)} min de lectura')}
                  </div>
                </a>
              </li>''')
    carrusel = '\n            '.join(tarjeta(POR_SLUG[s], 'h4') for s in INICIO_CARRUSEL)
    return f'''<!-- blog:inicio -->
    <section class="blog" id="blog" aria-labelledby="blog-titulo">
      <div class="blog__contenedor">
        <header class="blog__encabezado">
          <p class="blog__meta"><img class="blog__asterisco" src="assets/img/asterisco.png?v=1" alt="" width="64" height="64">Blog</p>
          <h2 class="blog__titulo" id="blog-titulo">Notas del escenario</h2>
        </header>

        <div class="blog__portada">
          {destacada(d)}

          <div class="blog-recientes">
            <h3 class="blog__subtitulo">Lo último</h3>
            <ol class="blog-recientes__lista">
              {"".join(recientes)}
            </ol>
          </div>
        </div>

        <div class="blog__archivo" data-blog-carrusel>
          <div class="blog__barra">
            <h3 class="blog__subtitulo">Más del blog</h3>
            <div class="blog__flechas" hidden data-blog-controles>
              <button class="blog__flecha" type="button" data-blog-anterior aria-label="Entradas anteriores">{FLECHA_IZQ}</button>
              <button class="blog__flecha" type="button" data-blog-siguiente aria-label="Más entradas">{FLECHA_DER}</button>
            </div>
          </div>

          <ul class="blog-carrusel" data-blog-pista>
            {carrusel}
          </ul>

          <nav class="blog-paginas" aria-label="Páginas de entradas" hidden data-blog-controles>
            <button class="blog__flecha" type="button" data-blog-anterior aria-label="Entradas anteriores">{FLECHA_IZQ}</button>
            <ol class="blog-paginas__numeros" data-blog-numeros></ol>
            <p class="blog-paginas__folio" data-blog-folio aria-hidden="true"></p>
            <button class="blog__flecha" type="button" data-blog-siguiente aria-label="Más entradas">{FLECHA_DER}</button>
          </nav>
        </div>

        <div class="blog__cta">
          <a class="boton" href="/blog/">Ver todo el blog</a>
        </div>
      </div>
    </section>
    <!-- blog:fin -->'''


def escribir(ruta, contenido):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(contenido, encoding='utf-8')
    print('escrito', ruta.relative_to(RAIZ))


def main():
    slugs = [p['slug'] for p in ENTRADAS]
    assert len(slugs) == len(set(slugs)), 'slugs repetidos'
    for slug in [INICIO_DESTACADA, *INICIO_RECIENTES, *INICIO_CARRUSEL]:
        assert slug in POR_SLUG, slug
    for p in ENTRADAS:
        for destino in re.findall(r'href="/blog/([^/"]+)/"', p['cuerpo']):
            assert destino in POR_SLUG, f'{p["slug"]} enlaza a {destino}'

    for p in ENTRADAS:
        escribir(RAIZ / 'blog' / p['slug'] / 'index.html', pagina_entrada(p))
    escribir(RAIZ / 'blog' / 'index.html', pagina_indice())

    inicio = RAIZ / 'index.html'
    texto = inicio.read_text(encoding='utf-8')
    patron = re.compile(r'<!-- blog:inicio -->.*?<!-- blog:fin -->', re.S)
    if not patron.search(texto):
        patron = re.compile(r'<section class="blog" id="blog".*?</section>', re.S)
    texto, n = patron.subn(lambda _: seccion_inicio(), texto, count=1)
    assert n == 1, 'no encontré la sección del blog en index.html'
    inicio.write_text(texto, encoding='utf-8')
    print('actualizado index.html')


if __name__ == '__main__':
    main()
