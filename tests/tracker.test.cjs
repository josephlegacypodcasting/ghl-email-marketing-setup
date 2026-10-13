const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const groups = JSON.parse(fs.readFileSync('data/tasks.json','utf8'));
const page=fs.readFileSync('index.html','utf8');
const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
const tasks = groups.flatMap(group => group[2]);
const taskCount=tasks.length;
const firstId='MB-'+tasks[0][0];
const secondId='MB-'+tasks[1][0];
const known = new Set(tasks.map(task => 'MB-'+task[0]));
assert.equal(known.size,taskCount);
tasks.forEach(task => {
  if (task[3] === '—') return;
  task[3].split(', ').forEach(dep => {
    assert(known.has('MB-'+dep), 'Missing dependency '+dep);
    assert(Number(dep)<Number(task[0]), 'Dependency cycle or forward dependency');
  });
});
function setup(stored = null, unavailable = false, embedded = {updated:0,tasks:{}}) {
  const events = {};
  const element = () => ({children:[],textContent:'',append(...children){this.children.push(...children);},appendChild(child){this.children.push(child);},replaceChildren(){this.children=[];},focus(){this.focused=true;}});
  const fields = value => ({value,matches:()=>true,focus(){this.focused=true;}});
  const rows = tasks.map(task => {
    const controls = {owner:fields(task[2]),status:fields('pending'),notes:fields('')};
    const note = {textContent:''};
    const noteUI={};
    ['.evidence-note-list','.note-count','.notes-empty','.evidence-notes','.note-feedback'].forEach(selector=>noteUI[selector]=element());
    return {dataset:{task:'MB-'+task[0],deps:task[3]==='—'?'':task[3].split(', ').map(d=>'MB-'+d).join(',')},controls,note,noteUI,
      querySelectorAll:()=>Object.entries(controls).map(([name,field]) => {field.dataset={field:name};return field;}),
      querySelector:selector => selector === '.dependency-status' ? note : noteUI[selector] || controls[selector.match(/status|owner|notes/)[0]]};
  });
  const phases = groups.map(group => ({
    children:rows.filter(row=>group[2].some(task=>'MB-'+task[0]===row.dataset.task)),count:{textContent:''},
    querySelectorAll(){return this.children;},querySelector(){return this.count;}
  }));
  const elements = {};
  ['task-progress','task-progress-text','task-filter','task-empty','task-storage-note','task-expand','task-save'].forEach(id => {
    elements[id] = {value:id==='task-filter'?'all':0,addEventListener:(type,handler)=>events[id+':'+type]=handler};
  });
  elements['task-saved-state']={textContent:JSON.stringify(embedded)};
  const earlierList=element();
  elements['earlier-task-notes']={hidden:true,querySelector:()=>earlierList};
  elements['project-tasks']={querySelectorAll:selector=>selector==='[data-task]'?rows:phases,addEventListener:(type,handler)=>events[type]=handler};
  rows.forEach(row=>{
    const phase=phases.find(p=>p.children.includes(row));
    const guide={open:false,hidden:false,focused:false,scrolled:false,
      closest:()=>phase,scrollIntoView(){this.scrolled=true;},
      querySelector(){return {focus:()=>{guide.focused=true;}};}};
    elements['guide-'+row.dataset.task]=guide;
  });
  let storedValue = stored;
  let lastBlob=null;
  const document = {getElementById:id=>elements[id],createElement:()=>({...element(),click(){},remove(){}}),body:{appendChild(){}},documentElement:{cloneNode(){
    const saved={textContent:''},filter={value:'all'},empty={setAttribute(){}};
    return {querySelector:selector=>selector==='#task-saved-state'?saved:selector==='#task-filter'?filter:empty,
      querySelectorAll:()=>[],get outerHTML(){return '<html><script id="task-saved-state" type="application/json">'+saved.textContent+'</script></html>';}};
  }}};
  const localStorage = {getItem:()=>{if(unavailable)throw Error('Denied');return JSON.stringify(storedValue);},setItem:(_,value)=>{if(unavailable)throw Error('Denied');storedValue=JSON.parse(value);}};
  vm.runInNewContext(source,{document,localStorage,console,Blob,URL:{createObjectURL(blob){lastBlob=blob;return 'blob:test';},revokeObjectURL(){}},setTimeout:fn=>fn()});
  return {rows,elements,events,getStored:()=>storedValue,getBlob:()=>lastBlob};
}
const current = setup();
assert.equal(current.elements['task-progress-text'].textContent,'0 / '+taskCount+' tasks completed');
const first = current.rows[0];
first.controls.status.value='done';
current.events.input({target:first.controls.status});
assert.equal(current.elements['task-progress'].value,1);
assert.equal(current.getStored().tasks[firstId].status,'done');
assert.equal(current.rows[1].note.textContent,'Prerequisites marked Done');
current.elements['task-filter'].value='done';
current.events['task-filter:change']();
assert.equal(current.rows.filter(row=>!row.hidden).length,1);
if(source.includes('const guideLink')) {
  const anchor={getAttribute:()=> '#guide-MB-09'};
  current.events.click({target:{closest:selector=>selector.includes('#guide-')?anchor:null},preventDefault(){}});
  assert.equal(current.elements['task-filter'].value,'all');
  assert.equal(current.elements['guide-MB-09'].open,true);
  assert.equal(current.elements['guide-MB-09'].focused,true);
  assert.equal(current.elements['guide-MB-09'].scrolled,true);
  assert.equal(current.rows.filter(row=>!row.hidden).length,taskCount);
}
const restored=setup({updated:20,tasks:{[firstId]:{status:'done',owner:'Assigned owner',notes:'Evidence reviewed'}}},false,{updated:10,tasks:{}});
assert.equal(restored.rows[0].controls.owner.value,'Assigned owner');
assert.equal(restored.elements['task-progress'].value,1);
const fallback=setup(null,true);
fallback.rows[0].controls.notes.value='Unsaved browser note';
fallback.events.input({target:fallback.rows[0].controls.notes});
assert(fallback.elements['task-storage-note'].textContent.includes('storage is unavailable'));
const savedFile=setup(null,true,{updated:30,tasks:{[firstId]:{status:'done',owner:'Saved file owner',notes:'Preserved evidence'}}});
if(source.includes('entriesByTask')) {
  assert.equal(savedFile.rows[0].controls.notes.value,'');
  assert.equal(savedFile.rows[0].noteUI['.evidence-note-list'].children[0].children[1].textContent,'Preserved evidence');
  const addNote=(fixture,index,text)=>{
    fixture.rows[index].controls.notes.value=text;
    fixture.events.input({target:fixture.rows[index].controls.notes});
    fixture.events.click({target:{closest:selector=>selector==='[data-add-note]'?{dataset:{addNote:fixture.rows[index].dataset.task}}:null}});
  };
  addNote(current,0,'First evidence\nMulti-line text');
  addNote(current,0,'<script>alert(1)</script> is plain text');
  assert.equal(current.getStored().tasks[firstId].noteEntries.length,2);
  assert.equal(current.getStored().tasks[firstId].notes,'');
  assert.equal(current.rows[0].noteUI['.note-count'].textContent,'2');
  assert.equal(current.rows[0].noteUI['.evidence-note-list'].children[1].children[1].textContent,'<script>alert(1)</script> is plain text');
  assert(Number.isFinite(Date.parse(current.getStored().tasks[firstId].noteEntries[0].createdAt)));
  addNote(current,1,'Separate task evidence');
  assert.equal(current.getStored().tasks[firstId].noteEntries.length,2);
  assert.equal(current.getStored().tasks[secondId].noteEntries.length,1);
  const reload=setup(current.getStored());
  assert.equal(reload.rows[0].noteUI['.note-count'].textContent,'2');
  assert.equal(reload.rows[1].noteUI['.note-count'].textContent,'1');
  assert.equal(reload.elements['task-progress'].value,1);
  const legacy=setup({updated:5,tasks:{[firstId]:{notes:'Old evidence'}}});
  legacy.events.input({target:legacy.rows[0].controls.owner});
  assert.equal(legacy.getStored().tasks[firstId].noteEntries[0].text,'Old evidence');
  assert.equal(legacy.getStored().tasks[firstId].noteEntries[0].createdAt,null);
  assert.equal(setup(legacy.getStored()).rows[0].noteUI['.note-count'].textContent,'1');
  addNote(current,0,'   ');
  assert.equal(current.getStored().tasks[firstId].noteEntries.length,2);
  assert(current.rows[0].noteUI['.note-feedback'].textContent.includes('Enter a note'));
  addNote(fallback,0,'Offline evidence');
  assert(fallback.rows[0].noteUI['.note-feedback'].textContent.includes('Download an HTML copy'));
  const savedNoteState=setup(null,true,current.getStored());
  assert.equal(savedNoteState.rows[0].noteUI['.note-count'].textContent,'2');
  assert.equal(savedNoteState.rows[1].noteUI['.note-count'].textContent,'1');
  const retired=setup({updated:55,tasks:{'MB-04':{notes:'Prior project evidence',noteEntries:[{id:'earlier',text:'Retained plain text',createdAt:null}]}}});
  assert.equal(retired.elements['earlier-task-notes'].hidden,false);
  retired.events.input({target:retired.rows[0].controls.owner});
  assert.equal(retired.getStored().tasks['MB-04'].notes,'Prior project evidence');
  assert.equal(retired.getStored().tasks['MB-04'].noteEntries[0].text,'Retained plain text');
} else assert.equal(savedFile.rows[0].controls.notes.value,'Preserved evidence');
assert.equal(savedFile.elements['task-progress'].value,1);
const html=fs.readFileSync('index.html','utf8');
assert(!html.includes('EmailDeliverability.com'));
assert(html.includes('18 core tasks + 4 event-sync tasks'));
assert.equal((html.match(/data-task="MB-/g)||[]).length,taskCount);
assert(html.includes('data:font/ttf;base64,'));
assert(html.includes('id="task-saved-state"'));
assert(!/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html));
if(fs.existsSync('data/guides.json')) {
  const guides=JSON.parse(fs.readFileSync('data/guides.json','utf8'));
  assert.equal(Object.keys(guides).length,taskCount);
  assert.equal((html.match(/class="task-guide" id="guide-MB-/g)||[]).length,taskCount);
  assert.equal((html.match(/class="guide-link"/g)||[]).length,taskCount);
  assert.equal((html.match(/aria-label="Process map for MB-/g)||[]).length,taskCount);
  tasks.forEach(task=>{
    const guide=guides[task[0]];
    assert.equal(guide.steps.length,4);
    assert(/^[\x00-\x7f]*$/.test(guide.ascii),'Non-ASCII process map');
    assert(html.includes('id="guide-MB-'+task[0]+'"'));
  });
}
async function verifyExport() {
  const exportCase=setup({updated:50,tasks:{[firstId]:{notes:'Unsubmitted draft',noteEntries:[{id:'saved-1',text:'Line one\n<script>literal evidence</script>',createdAt:'2026-10-13T15:00:00Z'}]}}});
  exportCase.events['task-save:click']();
  const downloaded=await exportCase.getBlob().text();
  assert(downloaded.startsWith('<!doctype html>\n<html>'),'Expected real newline after doctype');
  assert(!downloaded.includes('<script>literal evidence</script>'),'Note markup must not become executable HTML');
  const saved=JSON.parse(downloaded.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(saved.tasks[firstId].notes,'Unsubmitted draft');
  assert.equal(saved.tasks[firstId].noteEntries[0].text,'Line one\n<script>literal evidence</script>');
  const reopen=setup(null,true,saved);
  assert.equal(reopen.rows[0].noteUI['.note-count'].textContent,'1');
  assert.equal(reopen.rows[0].controls.notes.value,'Unsubmitted draft');
  console.log('Verified: multiple notes, plain text, legacy migration, timestamps, task isolation, storage fallback, HTML export/reopen, guides and progress.');
}
verifyExport().catch(error=>{console.error(error);process.exitCode=1;});
