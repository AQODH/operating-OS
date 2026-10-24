import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorize,approveLoan} from '../lib/authorization.mjs';
test('viewers cannot post or approve',()=>{authorize('viewer','read');assert.throws(()=>authorize('viewer','post'));assert.throws(()=>authorize('viewer','approve'))});
test('officers can approve but cannot post',()=>{authorize('officer','approve');assert.throws(()=>authorize('officer','post'))});
test('treasurers post but do not approve',()=>{authorize('treasurer','post');assert.throws(()=>authorize('treasurer','approve'))});
test('approval requires a different actor and submitted state',()=>{const loan={status:'submitted',requestedBy:'alice'};assert.throws(()=>approveLoan(loan,'alice'));assert.equal(approveLoan(loan,'bob').approvedBy,'bob');assert.throws(()=>approveLoan({...loan,status:'approved'},'bob'))});
