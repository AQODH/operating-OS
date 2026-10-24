import {test} from 'node:test';
import assert from 'node:assert/strict';
import {journal,contribution,disbursement,reverse,flatInterest,allocateRepayment} from '../lib/finance/core.mjs';
test('contribution and disbursement balance and reverse exactly',()=>{
 for(const lines of [contribution(50000),disbursement(100000)]){
 assert.equal(lines.reduce((s,l)=>s+l.amount,0),0);
 assert.deepEqual(reverse(reverse(lines)),lines);
 }
});
test('reject unbalanced and inexact money',()=>{
 assert.throws(()=>journal([{account:'cash',amount:100},{account:'income',amount:-99}]));
 assert.throws(()=>contribution(0.1));
 assert.throws(()=>contribution(Number.MAX_SAFE_INTEGER+1));
});
test('flat interest annual rate is prorated with half-up UGX rounding',()=>{
 assert.equal(flatInterest(100000,1200,6),6000);
 assert.equal(flatInterest(1,6000,10),1);
});
test('repayment pays interest then principal and refuses excess',()=>{
 assert.deepEqual(allocateRepayment(15000,100000,10000),{interest:10000,principal:5000});
 assert.throws(()=>allocateRepayment(110001,100000,10000));
});
