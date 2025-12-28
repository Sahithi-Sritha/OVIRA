# Ovira AI - Test Suite Documentation

This document describes the comprehensive test suite for the Ovira AI women's health tracking application.

## Test Infrastructure

### Testing Framework
- **Jest**: Primary testing framework
- **React Testing Library**: For React component testing
- **@testing-library/jest-dom**: Custom Jest matchers for DOM elements

### Configuration Files
- `jest.config.js`: Main Jest configuration
- `jest.setup.js`: Test environment setup and global mocks

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### API Routes

#### `/api/chat` (148 test cases)
**File**: `src/app/api/chat/__tests__/route.test.ts`

**Test Categories**:
1. **Request Validation** (3 tests)
   - Missing message
   - Empty message
   - Null message

2. **Fallback Responses - No API Key** (5 tests)
   - Default fallback
   - Pain-related queries
   - Mood-related queries
   - Cycle-related queries
   - General queries

3. **AI Integration - With API Key** (8 tests)
   - Successful API calls
   - Conversation history handling
   - User context inclusion
   - Multiple model retry logic
   - Network error handling
   - Malformed response handling

4. **API Key Handling** (1 test)
   - Key trimming and cleaning

5. **Edge Cases** (6 tests)
   - Very long messages
   - Special characters
   - Empty history
   - Invalid JSON
   
6. **Generation Config** (1 test)
   - Temperature and token settings

#### `/api/health-report` (47 test cases)
**File**: `src/app/api/health-report/__tests__/route.test.ts`

**Test Categories**:
1. **Request Validation** (4 tests)
   - Missing logs
   - Empty logs array
   - Missing user profile
   - Valid minimal request

2. **Fallback Response - No API Key** (5 tests)
   - Fallback report generation
   - Statistics calculation
   - High pain day identification
   - Flow day counting
   - Symptom aggregation

3. **AI Integration - With API Key** (5 tests)
   - Successful report generation
   - User context inclusion
   - Model retry on failure
   - Fallback on all failures
   - Malformed JSON handling

4. **Data Processing** (7 tests)
   - Missing optional fields
   - Large log volumes
   - All flow levels
   - All mood types
   - All energy levels

5. **Edge Cases and Error Handling** (6 tests)
   - Network errors
   - Invalid date formats
   - Extreme pain levels
   - Empty symptoms
   - Missing profile fields

6. **Report Structure Validation** (3 tests)
   - All required fields
   - Nested structure validation

### React Components

#### `HealthReportPage` (40+ test cases)
**File**: `src/app/(dashboard)/health-report/__tests__/page.test.tsx`

**Test Categories**:
1. **Initial Loading** (2 tests)
   - Loading spinner display
   - Log fetching on mount

2. **No Logs State** (3 tests)
   - Empty state message
   - Link to log entry
   - Disabled generate button

3. **With Logs State** (3 tests)
   - Ready message display
   - Log count display
   - Enabled generate button

4. **Report Generation** (6 tests)
   - API call on button click
   - Loading state during generation
   - Success report display
   - Error message display
   - Network error handling

5. **Report Display** (8 tests)
   - Executive summary
   - Statistics grid
   - Cycle overview
   - Symptom analysis
   - Recommendations
   - Doctor questions
   - Lifestyle tips
   - Print button

6. **Risk Assessment Display** (2 tests)
   - No risk message
   - Risk display when present

7. **Urgent Flags** (2 tests)
   - Flag display when present
   - No display when empty

8. **Print Functionality** (1 test)
   - Window.print call

9. **Regenerate Report** (2 tests)
   - Regenerate button display
   - Regeneration functionality

10. **Authentication** (2 tests)
    - No fetch without user
    - Missing profile handling

## Test Best Practices Used

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Mocking**: External dependencies (Firebase, API calls) are properly mocked
3. **Coverage**: Tests cover happy paths, edge cases, and error conditions
4. **Descriptive Names**: Test names clearly describe what is being tested
5. **Arrange-Act-Assert**: Tests follow the AAA pattern
6. **Async Handling**: Proper use of `waitFor` and async/await
7. **Clean Up**: Mocks are cleared between tests

## Key Testing Patterns

### API Route Testing
```typescript
// Test pattern for API routes
const request = new NextRequest('http://localhost:3000/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
})

const response = await POST(request)
const data = await response.json()

expect(response.status).toBe(200)
expect(data).toHaveProperty('expectedField')
```

### Component Testing
```typescript
// Test pattern for React components
render(<Component />)

await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})

fireEvent.click(screen.getByText('Button'))

await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled()
})
```

## Mock Strategies

### Firebase Mocking
- Firestore operations are mocked at the module level
- Query results are controlled through mock implementations

### API Mocking
- `global.fetch` is mocked for external API calls
- Responses can be customized per test

### Component Mocking
- UI components are mocked to focus on logic testing
- Icons and complex components are simplified

## Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Future Improvements

1. Add integration tests for full user flows
2. Add E2E tests with Playwright or Cypress
3. Add visual regression testing
4. Add performance testing for large datasets
5. Add accessibility testing

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Ensure all dependencies are installed: `npm install`

**Issue**: Firebase mocks not working
**Solution**: Check that `@/lib/firebase/firebase` is properly mocked

**Issue**: Async tests timing out
**Solution**: Increase timeout or check for proper `waitFor` usage

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before committing
3. Maintain > 90% code coverage
4. Follow existing test patterns
5. Document complex test scenarios

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)