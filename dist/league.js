// Two fictional student results per college and assignment. Equal team sizes
// make the house mean easy to reproduce from the student ledger.
export const fixtures = [
  { name:'Interface critique', short:'Critique', marks:[[78,86],[84,88],[80,82],[83,87]], flights:[14,0,13,15] },
  { name:'Algorithm design', short:'Algorithms', marks:[[82,84],[85,89],[78,82],[80,86]], flights:[15,0,18,14] },
  { name:'Design evaluation', short:'Evaluation', marks:[[80,88],[82,86],[82,90],[81,85]], flights:[16,0,16,18] }
];
export const teams = [
  { short:'Arts & Humanities', color:'#b77b9f', students:['Isla Reid','Leon Park'] },
  { short:'Science & Engineering', color:'#80abde', students:['You','Kit Fraser'] },
  { short:'Medical, Veterinary & Life Sciences', color:'#86bda1', students:['Maya Bell','Jude Wong'] },
  { short:'Social Sciences', color:'#deb774', students:['Eden Shah','Finn Ross'] }
];
export const homeTeam=1;
export function racePoints(hoops,comet){return hoops*4+(comet?10:0)}
export function standings(fixtureIndex,bests){
  const f=fixtures[fixtureIndex];
  return teams.map((t,i)=>{
    const coursework=Math.round((f.marks[i][0]+f.marks[i][1])/2);
    const flight=i===homeTeam?Math.max(0,Math.min(30,bests[fixtureIndex]||0)):f.flights[i];
    return {...t,id:i,coursework,flight,total:coursework+flight};
  }).sort((a,b)=>b.total-a.total||b.coursework-a.coursework||a.short.localeCompare(b.short));
}
export function bestScores(value){
  return fixtures.map((_,i)=>Number.isInteger(value?.[i])&&value[i]>=0&&value[i]<=30?value[i]:0);
}

export function seasonStandings(bests){
  const totals=teams.map((team,id)=>({...team,id,coursework:0,flight:0,total:0}));
  fixtures.forEach((_,i)=>{
    for(const row of standings(i,bests)){
      const t=totals[row.id];
      t.coursework+=row.coursework;t.flight+=row.flight;t.total+=row.total;
    }
  });
  return totals.sort((a,b)=>b.total-a.total||b.coursework-a.coursework||a.short.localeCompare(b.short));
}
export function cupHonour(bests){
  if(bests.every(n=>n===30))return 'Comet captain';
  if(bests.every(n=>n>0))return 'House pennant';
  return null;
}
