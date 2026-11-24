import test from 'node:test';
import assert from 'node:assert/strict';
import { restore, points, lectures, featherSpots, contacts } from '../dist/data.js';
import { readFileSync } from 'node:fs';

test('a lecture can earn only one stamp, with one full-flight bonus', () => {
  for (const stamps of [[0,1,2],[2,0,1],[1,2,0]]) {
    let record=restore('');
    for (const [i,stamp] of stamps.entries()) {
      record=restore(JSON.stringify({...record,stamps:[...record.stamps,stamp,stamp]}));
      assert.equal(points(record.stamps),[10,20,50][i]);
    }
  }
});
test('missing or malformed progress restores a playable sample day', () => {
  assert.deepEqual(restore('broken'),restore(null));
  assert.deepEqual(restore('{"stamps":[5,-1,"1",1,1]}').stamps,[1]);
  assert.equal(restore('{"breakIndex":200}').breakIndex,-1);
});
test('every venue, collectible and contact has a usable representation', () => {
  assert.equal(lectures[2].venue,'James McCune Smith');
  assert.equal(featherSpots.length,9);
  for(const asset of ['rowan','campus-map']){
    assert.match(readFileSync(new URL('../dist/art/'+asset+'.svg',import.meta.url),'utf8'),/<svg[\s>]/);
  }
});


test('the directory and game scenes use available pixel artwork', () => {
  for(const id of [...contacts.map(c=>c.sprite),'scholar','rider','pitch','tower','sorting-hat']){
    const asset = readFileSync(new URL('../dist/art/pixel-'+id+'.png',import.meta.url));
    assert.equal(asset.subarray(1,4).toString(),'PNG');
  }
});
