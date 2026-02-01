import { Effect, Request, RequestResolver } from 'effect';

// Define a request using Request.tagged
class GetProduct extends Request.Class {
  constructor(id) {
    super();
    this.id = id;
  }
  // Effect type signature: <Success, Error>
  [Request.RequestTypeId] = {
    _A: (_) => _  // Success type
  }
}

// Create a resolver
const getProductResolver = RequestResolver.make((request) => {
  console.log('Resolving product:', request.id);
  return Effect.succeed({ id: request.id, name: 'Test Product' });
});

// Use the request
const program = Effect.request(
  new GetProduct('prod_123'),
  getProductResolver
);

// Run it
Effect.runPromise(program).then(console.log).catch(console.error);
