import { Effect, Request, RequestResolver, Data } from 'effect';

// Use Request.tagged to define request
class GetProduct extends Request.tagged('GetProduct')<
  { readonly id: string },
  unknown,
  { readonly id: string; readonly name: string }
> {}

// Create a resolver
const getProductResolver = RequestResolver.fromEffect((request) => {
  console.log('Resolving product:', request.id);
  return Effect.succeed({ id: request.id, name: 'Test Product' });
});

// Use the request
const program = Effect.request(
  new GetProduct({ id: 'prod_123' }),
  getProductResolver
);

// Run it
Effect.runPromise(program).then(result => {
  console.log('Result:', result);
}).catch(console.error);
