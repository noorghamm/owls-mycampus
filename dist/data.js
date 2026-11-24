import {registrationRecord} from './registration.js';
import {bestScores} from './league.js';
export const lectures = [
  { name: 'Algorithmics', time: '09:00', end: '10:00', venue: 'Boyd Orr Building', short: 'Boyd Orr', room: 'Lecture Theatre A', topic: 'Search trees and traversal', x: 18, y: 37 },
  { name: 'Human-Centred Design', time: '11:00', end: '12:00', venue: 'Sir Alwyn Williams Building', short: 'Alwyn Williams', room: 'Seminar Room 2', topic: 'Evaluating an interaction design', x: 52, y: 28 },
  { name: 'Systems Programming', time: '14:00', end: '15:00', venue: 'James McCune Smith', short: 'James McCune Smith', room: 'Learning Studio 1', topic: 'Threads and shared memory', x: 77, y: 62 }
];
const schoolSupport = 'https://www.gla.ac.uk/schools/computing/informationforstudents/studentsupport/';
export const contacts = [
  {
    sprite: 'academic', name: 'Dr Colette Mair', short: 'Dr Mair', role: 'Chief Adviser for Science',
    detail: 'College-level academic advice for science degrees. Your own Adviser of Studies is listed in your MyCampus Student Centre.',
    action: 'Find my assigned adviser', url: 'https://www.gla.ac.uk/media/Media_792272_smxx.pdf',
    source: 'https://www.gla.ac.uk/colleges/scienceengineering/collegedirectory/', sourceLabel: 'College directory'
  },
  {
    sprite: 'senior', name: 'Professor Gethin Norman', short: 'Prof Norman', role: 'Senior Adviser, Computing Science',
    detail: 'The School’s senior adviser can help with academic progression or a complex change to your studies.',
    action: 'Email senior advising', url: 'mailto:socs-senior-adviser@glasgow.ac.uk',
    source: 'https://www.gla.ac.uk/schools/computing/staff/gethinnorman/', sourceLabel: 'Staff profile'
  },
  {
    sprite: 'disability', name: 'Una Marie Darragh', short: 'Una Marie', role: 'School Disability Coordinator',
    detail: 'Ask about adjustments within Computing Science. For an appointment with a Disability Adviser, use the University Disability Service.',
    action: 'Email the coordinator', url: 'mailto:UnaMarie.Darragh@glasgow.ac.uk',
    extra: 'https://www.gla.ac.uk/myglasgow/disability/contact/appointment/', extraLabel: 'Disability Service appointments',
    source: schoolSupport, sourceLabel: 'School support directory'
  },
  {
    sprite: 'support', name: 'Stéphane Charrier', short: 'Stéphane', role: 'Student Support Officer',
    detail: 'For practical or personal matters affecting your studies, contact the student support office on the ground floor of the Sir Alwyn Williams Building.',
    action: 'Email student support', url: 'mailto:CompSci-StudentSupport@glasgow.ac.uk',
    source: schoolSupport, sourceLabel: 'School support directory'
  }
];
export const breaks = ['Library reading · 12:00–13:00','Lunch with friends · 12:15–13:00','Walk by the Kelvin · 12:30–13:00'];
export const houses = ['Arts & Humanities','Science & Engineering','Medical, Veterinary & Life Sciences','Social Sciences'];
export const featherSpots = [[13,68],[21,53],[12,43],[26,35],[39,40],[48,32],[58,42],[65,52],[73,56]];
export const saveKey = 'owls-mycampus.flight.v1';
export function restore(raw) {
  let s = {};
  try { s = JSON.parse(raw || '{}') || {}; } catch {}
  const ids = (key,max) => [...new Set((Array.isArray(s[key]) ? s[key] : []).filter(i=>Number.isInteger(i)&&i>=0&&i<max))];
  return { stamps:ids('stamps',3), feathers:ids('feathers',9), friends:ids('friends',4), met:ids('met',4), broomBests:bestScores(s.broomBests),
    registration:registrationRecord(s.registration,s.academic===true,s.finance===true), academic:s.academic===true, finance:s.finance===true, enrolled:s.enrolled===true,
    breakIndex:Number.isInteger(s.breakIndex)&&breaks[s.breakIndex]?s.breakIndex:-1, sound:s.sound===true };
}
export const points = stamps => stamps.length * 10 + (stamps.length === 3 ? 20 : 0);
