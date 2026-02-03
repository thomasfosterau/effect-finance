# effect-stripe

## Project Overview

An Effect wrapper around the Stripe API that provides type-safe error handling, composable operations, and seamless integration with the Effect ecosystem. This library enables developers to work with Stripe using Effect's functional programming patterns for better error handling, resource management, and composability.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.6+
- **Framework**: Effect 3.0+ (functional effect system)
- **External API**: Stripe Node.js SDK 17.6+
- **Testing**: Vitest 2.0+
- **Linting**: ESLint 9+ with TypeScript ESLint
- **Formatting**: Prettier 3.3+
- **Package Manager**: npm (lockfile: `package-lock.json`)

## Architecture & Design Principles

### Resource-Centric API Design

This library follows Effect's **resource-centric** conventions:

✅ **DO**: Import and use resource modules directly
```typescript
import * as Product from "@thomasfosterau/effect-stripe/Product";
const product = yield* Product.create({ name: "My Product" });
```

❌ **DON'T**: Use service-centric patterns
```typescript
// Avoid this pattern
const stripe = yield* StripeService;
const product = yield* stripe.products.create({ name: "My Product" });
```

### Effect Patterns

- Use `Effect.gen` for composing operations
- All operations return `Effect<T, StripeError, StripeService>`
- Leverage Effect's error handling with `catchTag` for specific error types
- Use Effect Layers for dependency injection and resource management
- Use Request/RequestResolver pattern for API operations with caching support

### Module Structure

Each Stripe resource has its own module with standard CRUD operations:
- `create` - Create a new resource
- `retrieve` - Get a single resource by ID
- `update` - Update an existing resource
- `del` - Delete a resource (named `del` to avoid JS keyword conflict)
- `list` - List resources with pagination

## Coding Guidelines

### TypeScript

- **Strict Mode**: Always use strict TypeScript settings
- **No `any`**: Avoid `any` types; use `unknown` if type is truly unknown
- **Interfaces**: Use `interface` for public API definitions
- **Readonly**: Mark object properties as `readonly` where appropriate
- **Type Imports**: Use `import type` for type-only imports from Stripe

### Code Style (Prettier & ESLint)

- **Semicolons**: Always use semicolons
- **Quotes**: Use double quotes for strings
- **Indentation**: 2 spaces, no tabs
- **Line Length**: 80 characters max
- **Trailing Commas**: Use ES5-style trailing commas
- **Unused Variables**: Prefix with `_` to indicate intentionally unused (e.g., `_unused`)

### Naming Conventions

- **Files**: Use PascalCase for module files (e.g., `Product.ts`, `Customer.ts`)
- **Classes**: PascalCase (e.g., `StripeService`, `StripeError`)
- **Functions/Methods**: camelCase (e.g., `create`, `retrieve`, `makeStripeResolver`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_API_VERSION`)
- **Interfaces**: PascalCase, descriptive names (e.g., `StripeConfig`, `CreateProductRequest`)
- **Request Types**: Suffix with `Request` (e.g., `CreateProductRequest`)
- **Resolver Types**: Suffix with `Resolver` (e.g., `CreateProductResolver`)

### Documentation

- **JSDoc**: All public APIs must have JSDoc comments
- **Examples**: Include `@example` blocks for complex functions
- **Parameters**: Document all parameters and return types
- **Module Headers**: Include module-level documentation with examples

Example:
```typescript
/**
 * Create a product
 *
 * @example
 * ```typescript
 * const product = yield* Product.create({ name: "Premium Plan" });
 * ```
 */
export const create = (params: Stripe.ProductCreateParams) => ...
```

### Imports

- Group imports in this order:
  1. Effect imports
  2. External libraries (e.g., Stripe)
  3. Internal modules (using `.js` extension for ESM compatibility)
- Always use `.js` extension for local imports (ESM requirement)

Example:
```typescript
import { Effect, Context, Layer } from "effect";
import type Stripe from "stripe";
import { StripeError } from "./errors.js";
```

## Error Handling

### Error Types

All errors extend Effect's `Data.TaggedError`:

- `StripeError` - Base error type
- `StripeApiError` - API returned an error
- `StripeConfigError` - Configuration is invalid
- `StripeNetworkError` - Network error occurred
- `StripeAuthenticationError` - Authentication failed
- `StripeRateLimitError` - Rate limit exceeded
- `StripeInvalidRequestError` - Request parameters are invalid

### Error Handling Pattern

Use Effect's `catchTag` for specific error handling:

```typescript
const program = Effect.gen(function* () {
  const customer = yield* Customer.create({ email: "test@example.com" });
  return customer;
}).pipe(
  Effect.catchTag("StripeAuthenticationError", (error) =>
    Effect.fail(new Error("Invalid API key"))
  ),
  Effect.catchTag("StripeRateLimitError", (error) =>
    Effect.retry({ times: 3 })
  )
);
```

## Testing Standards

### Framework & Tools

- **Framework**: Vitest with Node environment
- **Coverage**: Aim for 80%+ coverage; use `v8` provider
- **Test Files**: Co-locate with source files using `.test.ts` suffix

### Testing Patterns

- Use `describe` blocks for grouping related tests
- Use `it` for individual test cases
- Use `Effect.runPromise` to run Effect programs in tests
- Test both success and error paths
- Use descriptive test names that explain the behavior

Example:
```typescript
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as Product from "./Product";

describe("Product", () => {
  describe("create", () => {
    it("should create a product with valid params", async () => {
      const layer = Stripe.layer({ apiKey: "sk_test_123" });
      const program = Product.create({ name: "Test Product" });
      
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );
      
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Product");
    });
  });
});
```

### What to Test

- ✅ Public API functions
- ✅ Error handling paths
- ✅ Request/Resolver implementations
- ✅ Layer creation
- ❌ Don't test Stripe SDK internals
- ❌ Don't test Effect framework internals

## Security Best Practices

### API Keys

- **Never commit API keys** to version control
- Use environment variables for sensitive data (e.g., `STRIPE_API_KEY`)
- Use `layerFromEnv()` for loading API keys from environment
- Document which environment variables are required

### Input Validation

- Rely on Stripe SDK's built-in validation
- Use TypeScript types to ensure compile-time safety
- Validate configuration in `make` and `layerFromEnv` functions

### Dependencies

- Keep Stripe SDK version up to date for security patches
- Use `npm audit` / `pnpm audit` to check for vulnerabilities
- Pin major versions in `peerDependencies` and `dependencies`

## Development Workflow

### Commands

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm typecheck
```

### Before Committing

1. Run `pnpm lint` to check for linting errors
2. Run `pnpm format` to format code
3. Run `pnpm test` to ensure tests pass
4. Run `pnpm typecheck` to verify TypeScript types

### Release Process

Uses Changesets for version management:
1. Create changes with `pnpm changeset`
2. Version with `pnpm version`
3. Publish with `pnpm release`

## Additional Resources

- [Effect Documentation](https://effect.website/)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Repository README](../README.md)
