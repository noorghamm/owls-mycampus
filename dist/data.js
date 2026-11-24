export const lectures = [
  { name: 'Algorithmics', time: '09:00', end: '10:00', venue: 'Boyd Orr Building', short: 'Boyd Orr', room: 'Lecture Theatre A', topic: 'Search trees and traversal', x: 18, y: 37 },
  { name: 'Human-Centred Design', time: '11:00', end: '12:00', venue: 'Sir Alwyn Williams Building', short: 'Alwyn Williams', room: 'Seminar Room 2', topic: 'Evaluating an interaction design', x: 52, y: 28 },
  { name: 'Systems Programming', time: '14:00', end: '15:00', venue: 'James McCune Smith', short: 'James McCune Smith', room: 'Learning Studio 1', topic: 'Threads and shared memory', x: 77, y: 62 }
];
export const companions = [
  { animal:'fox', name:'Sorrel', role:'Academic adviser', title:'The map-reader', detail:'Course choices, degree planning and your next academic step.', action:'Find your adviser', url:'https://www.gla.ac.uk/media/Media_792272_smxx.pdf', quote:'Sorrel tucks your feather between the pages of her star atlas.' },
  { animal:'stag', name:'Alder', role:'Senior adviser', title:'The keeper of paths', detail:'Complex enrolment questions and academic progression.', action:'Email senior advising', url:'mailto:socs-senior-adviser@glasgow.ac.uk', quote:'Alder bows his antlers. Your feather catches like a little golden leaf.' },
  { animal:'hare', name:'Clover', role:'Disability adviser', title:'The lantern-bearer', detail:'Access, adjustments and Disability Service appointments.', action:'Appointment information', url:'https://www.gla.ac.uk/myglasgow/disability/contact/appointment/', quote:'Clover lines her lantern with your feather. The doorway glows a little brighter.' },
  { animal:'hedgehog', name:'Bramble', role:'Student support officer', title:'The hearth-keeper', detail:'Personal or practical issues affecting your studies.', action:'School support', url:'https://www.gla.ac.uk/schools/computing/informationforstudents/studentsupport/', quote:'Bramble sets your feather over the hearth beside a teacup the size of a thimble.' }
];
export const breaks = ['Library reading · 12:00–13:00','Lunch with friends · 12:15–13:00','Walk by the Kelvin · 12:30–13:00'];
export const houses = ['Arts & Humanities','Science & Engineering','Medical, Veterinary & Life Sciences','Social Sciences'];
export const featherSpots = [[13,68],[21,53],[12,43],[26,35],[39,40],[48,32],[58,42],[65,52],[73,56]];
export const saveKey = 'owls-mycampus.flight.v1';
export function restore(raw) {
  let s = {};
  try { s = JSON.parse(raw || '{}') || {}; } catch {}
  const ids = (key,max) => [...new Set((Array.isArray(s[key]) ? s[key] : []).filter(i=>Number.isInteger(i)&&i>=0&&i<max))];
  return { stamps:ids('stamps',3), feathers:ids('feathers',9), friends:ids('friends',4),
    academic:s.academic===true, finance:s.finance===true, enrolled:s.enrolled===true,
    breakIndex:Number.isInteger(s.breakIndex)&&breaks[s.breakIndex]?s.breakIndex:-1, sound:s.sound===true };
}
export const points = stamps => stamps.length * 10 + (stamps.length === 3 ? 20 : 0);
