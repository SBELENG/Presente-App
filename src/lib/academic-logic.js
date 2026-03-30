
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
