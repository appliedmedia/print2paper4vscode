// sample-code.js - Simple syntax highlighting demo

// Variables
var oldSchool = "I'm a var variable"; // function-scoped
let modern = 42; // block-scoped
const constantValue = 3.14; // cannot be reassigned

// Function declaration
function greet(name) {
  return `Hello, ${name}!`;
}

// Arrow function
const square = n => n * n;

// Object
const person = {
  name: 'Alice',
  age: 30,
  greet() {
    console.log(greet(this.name));
  },
};

// Class
class Animal {
  constructor(type) {
    this.type = type;
  }
  speak() {
    console.log(`${this.type} makes a sound.`);
  }
}

// Control flow
for (let i = 0; i < 3; i++) {
  if (i % 2 === 0) {
    console.log(`${i} is even`);
  } else {
    console.log(`${i} is odd`);
  }
}

// Usage
console.log(oldSchool);
console.log(modern, constantValue);
console.log(square(5));

person.greet();

const dog = new Animal('Dog');
dog.speak();

// Advanced JavaScript Examples

// Array methods and functional programming
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);

// Destructuring assignment
const [first, second, ...rest] = numbers;
const { name: personName, age: personAge } = person;

// Template literals with expressions
const message = `The sum of ${numbers.length} numbers is ${sum}`;

// Async/await and Promises
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Promise.all for concurrent operations
const urls = ['api/users', 'api/posts', 'api/comments'];
const allData = await Promise.all(urls.map(url => fetchData(url)));

// Generators
function* fibonacci() {
  let [prev, curr] = [0, 1];
  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

const fib = fibonacci();
const firstTenFibs = Array.from({ length: 10 }, () => fib.next().value);

// Modules and imports (ES6)
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';

// Error handling with custom errors
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
  return true;
}

// Closures and higher-order functions
function createCounter(initialValue = 0) {
  let count = initialValue;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getValue: () => count,
    reset: () => (count = initialValue),
  };
}

const counter = createCounter(10);
counter.increment(); // 11
counter.increment(); // 12

// Symbol and private properties
const _privateData = Symbol('privateData');
class SecureClass {
  constructor(data) {
    this[_privateData] = data;
  }

  getData() {
    return this[_privateData];
  }
}

// Proxy for property interception
const handler = {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    return `Property "${prop}" not found`;
  },
};

const proxy = new Proxy({ name: 'John' }, handler);

// WeakMap for private data
const privateData = new WeakMap();
class PrivateClass {
  constructor(value) {
    privateData.set(this, { value });
  }

  getValue() {
    return privateData.get(this).value;
  }
}

// Usage examples
console.log('Doubled numbers:', doubled);
console.log('Even numbers:', evens);
console.log('Sum:', sum);
console.log('First two:', first, second);
console.log('Person:', personName, personAge);
console.log('Message:', message);
console.log('First 10 Fibonacci numbers:', firstTenFibs);
console.log('Counter value:', counter.getValue());
console.log('Proxy access:', proxy.name, proxy.nonexistent);

// Try-catch with custom error
try {
  validateEmail('invalid-email');
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed for ${error.field}: ${error.message}`);
  }
}
