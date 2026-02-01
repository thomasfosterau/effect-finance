import { Request, RequestResolver } from 'effect';
console.log('Request namespace:', typeof Request);
console.log('RequestResolver namespace:', typeof RequestResolver);

// Check if they're functions or objects
console.log('\nRequest keys:', Object.getOwnPropertyNames(Request).filter(k => !k.startsWith('_')).slice(0, 20).join(', '));
console.log('\nRequestResolver keys:', Object.getOwnPropertyNames(RequestResolver).filter(k => !k.startsWith('_')).slice(0, 20).join(', '));
