import { obtenerDatosDeLaHoja } from './sheets';

async function main() {
  console.log('Iniciando la obtención de datos desde Google Sheets...');
  try {
    const datos = await obtenerDatosDeLaHoja();
    console.log('--- ¡Datos Obtenidos Exitosamente! ---');
    console.log(`Se encontraron ${datos.length} filas.`);
    
    // Imprime las primeras 5 filas para verificar
    console.log('Primeras 5 filas:');
    console.table(datos.slice(0, 5));

    // Extrae y muestra solo la lista de IPS
    const ipsList = datos.map(fila => fila.ips).filter(Boolean);
    console.log('\n--- Lista de IPS Extraída ---');
    console.log(ipsList);

  } catch (error) {
    console.error('--- ¡Ha ocurrido un error! ---');
    console.error(error);
  }
}

main();
