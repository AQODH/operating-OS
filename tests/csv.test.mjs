import {test} from 'node:test';import assert from 'node:assert/strict';import {parseCSV} from '../lib/csv.mjs';
test('CSV handles quotes commas and embedded newlines',()=>{assert.deepEqual(parseCSV('name,phone\r\n"A, B",123\r\n"C\nD",456'),[{name:'A, B',phone:'123',email:''},{name:'C\nD',phone:'456',email:''}])});test('CSV rejects malformed and empty rows',()=>{assert.throws(()=>parseCSV('name,phone\n"unclosed,1'));assert.throws(()=>parseCSV('name,phone\n,1'));assert.throws(()=>parseCSV('name,name\na,b'))});
import {encodeCSV} from '../lib/csv.mjs';
test('CSV export neutralizes spreadsheet formulas but preserves numbers',()=>{assert.equal(encodeCSV([['=1+1','+cmd','@SUM(A1)',-10]]),'"\'=1+1","\'+cmd","\'@SUM(A1)","-10"')});
