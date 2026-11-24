import test from 'node:test';
import assert from 'node:assert/strict';
import {restore} from '../dist/data.js';
import {registrationPage} from '../dist/registration.js';

test('first-time, returning and legacy students resume at an available registration step', () => {
  assert.equal(restore(null).registration.step,0);
  assert.equal(restore('{"academic":true}').registration.step,4);
  assert.equal(restore('{"academic":true,"finance":true}').registration.step,5);
  const invalid=restore('{"registration":{"step":5,"last":2,"funding":"toString"}}');
  assert.equal(invalid.registration.step,2);
  assert.equal(invalid.registration.funding,'');
  const saved=restore('{"academic":true,"registration":{"step":4,"last":4,"funding":"mixed"}}');
  assert.equal(saved.registration.funding,'mixed');
  assert.equal(saved.registration.step,4);
});

test('user-entered practice details are displayed as plain text', () => {
  const state=restore('{"registration":{"step":3,"last":3,"email":"<tag>","term":"A & B","termUnknown":false}}');
  const html=registrationPage(state);
  assert.match(html,/&lt;tag&gt;/);
  assert.match(html,/A &amp; B/);
  assert.doesNotMatch(html,/<tag>/);
});
