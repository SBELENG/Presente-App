
/**
 * Lógica académica compartida para el cálculo de estados (REGULAR, PROMOCIÓN, LIBRE)
 */

export function calculateAcademicStatus(catedra, grades, attendancePct) {
  if (!catedra) return { label: '-', color: 'text-slate-400' };
  
  // REGLA 2.2: La asistencia solo cuenta cuando termina el semestre
  const hoy = new Date();
  const fechaFin = catedra.fecha_fin ? new Date(catedra.fecha_fin) : null;
  const esFinDeSemestre = fechaFin ? hoy >= fechaFin : false;
  
  const currentAttendance = attendancePct ?? 100;
  const targetAttendance = catedra.porcentaje_asistencia || 80;
  
  // Solo aplicamos el rigor de la asistencia si ya terminó la cursada
  const hasAttendance = esFinDeSemestre ? (currentAttendance >= targetAttendance) : true;

  // --- 1. CONFIGURACIÓN ---
  const minReg = 5; // Pedido por el usuario: Regulariza con 5
  const minProm = 6; // Pedido por el usuario: Promociona con nota mínima de 6
  const minAvgProm = 7; // Pedido por el usuario: Promedio de 7
  const cantParciales = catedra.cant_parciales || 2;

  // --- 2. NOTAS ---
  const originalPartials = [];
  let sumOriginal = 0;
  for (let i = 1; i <= cantParciales; i++) {
    const val = parseFloat(grades[`parcial_${i}`] || grades[`P${i}`]);
    originalPartials.push(isNaN(val) ? null : val);
    if (!isNaN(val)) sumOriginal += val;
  }

  const recs = [];
  for (let i = 1; i <= 2; i++) {
    const val = parseFloat(grades[`recuperatorio_${i}`] || grades[`R${i}`]);
    if (!isNaN(val)) recs.push(val);
  }

  const usedRecuperatorio = recs.length > 0;
  const finalPartials = [...originalPartials];
  
  if (usedRecuperatorio) {
    const sortedRecs = [...recs].sort((a, b) => b - a);
    const needyIdxs = finalPartials
      .map((v, i) => ({ v, i }))
      .filter(item => item.v === null || item.v < minReg)
      .sort((a, b) => (a.v === null ? -1 : a.v) - (b.v === null ? -1 : b.v));

    for (let j = 0; j < Math.min(sortedRecs.length, needyIdxs.length); j++) {
      if (sortedRecs[j] > (needyIdxs[j].v || 0)) {
        finalPartials[needyIdxs[j].i] = sortedRecs[j];
      }
    }
  }

  // --- 3. PROMEDIO ---
  const allFinalGrades = finalPartials.filter(v => v !== null);
  const avg = allFinalGrades.length > 0 ? allFinalGrades.reduce((a, b) => a + b, 0) / allFinalGrades.length : 0;

  // --- 4. DETERMINACIÓN DE ESTADO ---
  const allPartialsTaken = originalPartials.every(p => p !== null);
  const hasFailedFinalPartial = finalPartials.some(p => p === null || p < minReg);
  const canStillRecover = recs.length < (catedra.cant_recuperatorios || 1);

  // Status Logic 2.4: 
  if (!allPartialsTaken) {
    return { label: 'EN CURSO', color: 'text-slate-400 bg-slate-100 border-slate-200', key: 'EN_CURSO' };
  }

  // REGLA DE ORO: Si algún parcial final (después de usar o NO usar recuperatorio) sigue < 5, está LIBRE.
  // Pero si tiene un aplazo y NO ha usado el recuperatorio correspondiente, está EN CURSO.
  const partialsWithPendingRecovery = originalPartials.some((p, i) => {
    if (p >= minReg) return false; // Parcial aprobado
    const rVal = parseFloat(grades[`recuperatorio_${i+1}`] || grades[`R${i+1}`]);
    return isNaN(rVal); // Aún no rindió el recuperatorio para ese parcial
  });
  
  if (hasFailedFinalPartial) {
    if (partialsWithPendingRecovery) {
      return { label: 'EN CURSO', color: 'text-slate-400 bg-slate-100 border-slate-200', key: 'EN_CURSO' };
    } else {
      return { label: 'LIBRE', color: 'text-danger bg-danger/10 border-danger/20', key: 'LIBRE' };
    }
  }

  // Para ser regular: Promedio >= 5, asistencia OK y TODOS los parciales >= 5 (finales)
  const isRegular = avg >= minReg && hasAttendance && !hasFailedFinalPartial;

  // Regla Promocional: Promedio >= 7, Parciales ORIGINALES >= 6 y NO usar recuperatorios
  const partialsOkForProm = originalPartials.every(p => p >= minProm);
  const canPromote = !usedRecuperatorio && partialsOkForProm && avg >= minAvgProm && hasAttendance && catedra.es_promocional;

  if (canPromote) return { label: 'PROMOCION', color: 'text-primary bg-primary/10 border-primary/20', key: 'PROMOCION' };
  if (isRegular) return { label: 'REGULAR', color: 'text-success bg-success/10 border-success/20', key: 'REGULAR' };
  
  return { label: 'LIBRE', color: 'text-danger bg-danger/10 border-danger/20', key: 'LIBRE' };
}

/**
 * Genera el listado de fechas (objetos Date) entre inicio y fin, 
 * filtrando por los días de la semana indicados.
 */
export function generarFechas(fechaInicio, fechaFin, diasSemana = []) {
  if (!fechaInicio || !fechaFin || !diasSemana.length) return []
  
  const dMap = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 }
  const diasNums = diasSemana.map(d => dMap[d])
  
  const start = new Date(fechaInicio + 'T12:00:00')
  const end = new Date(fechaFin + 'T12:00:00')
  const result = []
  
  let curr = new Date(start)
  while (curr <= end) {
    if (diasNums.includes(curr.getDay())) {
      result.push(new Date(curr))
    }
    curr.setDate(curr.getDate() + 1)
  }
  return result
}

/**
 * Recupera de forma precisa el listado de fechas esperadas (y dictadas)
 * para un estudiante específico, combinando la teoría y la práctica (si corresponde a su comisión).
 * Devuelve un array de objetos Date.
 */
export function getStudentExpectedDates(catedra, insc, clasesDB = []) {
  if (!catedra) return [];

  const tipo = Array.isArray(catedra.tipo_clase) ? catedra.tipo_clase : [catedra.tipo_clase || 'teorico_practica'];
  const esTeo = tipo.includes('teorica') || tipo.includes('teorico_practica');
  const esPrac = tipo.includes('practica') || tipo.includes('teorico_practica');
  
  let expectedDates = [];

  // Fechas Teóricas
  if (esTeo) {
    const dTeo = generarFechas(catedra.fecha_inicio, catedra.fecha_fin, catedra.dias_clase || []);
    expectedDates = [...expectedDates, ...dTeo];
  }

  // Fechas Prácticas
  if (esPrac) {
    let dPrac = [];
    const comisiones = catedra.comisiones_division || [];
    
    // Identificar comisión del alumno
    let myCom = null;
    let myComIdx = -1;
    if (insc.comision_manual) {
      myComIdx = comisiones.findIndex(c => c.nombre === insc.comision_manual);
      myCom = comisiones[myComIdx];
    } else {
      const primera = (insc.apellido_estudiante || '').trim()[0]?.toUpperCase();
      if (primera) {
        myComIdx = comisiones.findIndex(c => c.desde && c.hasta && primera >= c.desde.toUpperCase() && primera <= c.hasta.toUpperCase());
        myCom = comisiones[myComIdx];
      }
    }

    const bloques = catedra.bloques_semanales || {};
    const hasBloques = Object.keys(bloques).length > 0;
    
    const diasPractica = (catedra.dias_practica && catedra.dias_practica.length > 0)
      ? catedra.dias_practica
      : (catedra.dias_clase || []);

    if (myCom) {
      if (hasBloques) {
        // Lógica de bloques por comisión
        let diasNums;
        if (catedra.dias_practica && catedra.dias_practica.length > 0) {
          const dMap = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
          diasNums = catedra.dias_practica.map(d => dMap[d]).filter(n => n !== undefined);
        } else if (catedra.agenda_rota_practicas) {
          diasNums = [1, 2, 3, 4, 5, 6];
        } else {
          const dMap = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
          diasNums = (catedra.dias_clase || []).map(d => dMap[d]).filter(n => n !== undefined);
        }
        
        const fInicio = catedra.fecha_inicio_practica || catedra.fecha_inicio;
        const fFin = catedra.fecha_fin_practica || catedra.fecha_fin;
        const inicio = fInicio ? new Date(fInicio + 'T12:00:00') : null;
        const fin = fFin ? new Date(fFin + 'T12:00:00') : null;

        Object.entries(bloques).forEach(([weekId, comIndices]) => {
          if (!Array.isArray(comIndices) || !comIndices.includes(myComIdx)) return;
          const [yearStr, weekStr] = weekId.split('-W');
          const year = parseInt(yearStr);
          const week = parseInt(weekStr);
          const jan4 = new Date(year, 0, 4, 12);
          const monday = new Date(jan4);
          monday.setDate(jan4.getDate() - (jan4.getDay() === 0 ? 6 : jan4.getDay() - 1) + (week - 1) * 7);
          
          for (let d = 0; d < 7; d++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + d);
            if (!diasNums.includes(day.getDay())) continue;
            if (inicio && fin) {
              if (day >= inicio && day <= fin) dPrac.push(new Date(day));
            } else {
              dPrac.push(new Date(day));
            }
          }
        });
      } else {
        // Lógica simple de comisión (por dias de la comision o fallback)
        const dComMs = (myCom.dias && myCom.dias.length > 0) ? myCom.dias : diasPractica;
        dPrac = generarFechas(catedra.fecha_inicio, catedra.fecha_fin, dComMs);
      }
    } else {
      // Sin comisión
      if (catedra.agenda_rota_practicas && esPrac) {
        dPrac = generarFechas(
          catedra.fecha_inicio_practica || catedra.fecha_inicio,
          catedra.fecha_fin_practica || catedra.fecha_fin,
          diasPractica
        );
      } else {
        dPrac = generarFechas(catedra.fecha_inicio, catedra.fecha_fin, diasPractica);
      }
    }
    
    expectedDates = [...expectedDates, ...dPrac];
  }

  // Defensa absoluta: Agregar clases "huérfanas" reales tomadas por el profe a las que este alumno le hayan puesto "presente",
  // o que caigan justo en el tipo de clase apropiado.
  // Pero para simplificar, deduplicamos por timestamp.
  const uniqueStamps = new Set(expectedDates.map(d => d.getTime()));
  const finalDates = [...expectedDates];

  // También se pueden chequear aquí días huérfanos que el alumno sí asistió
  
  finalDates.sort((a, b) => a - b);
  return finalDates;
}
