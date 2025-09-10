// Verify password hash compatibility
const bcrypt = require('bcrypt');

async function verifyPasswordHash() {
  const password = 'NestFest2024!Secure';
  
  // Generate a new hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash for NestFest2024!Secure:');
  console.log(newHash);
  console.log('');
  
  // Test if password matches the hash
  const testHash = '$2b$10$a6opPnhQHfF6w6hC2Lcup.tFVK6G0DQ1lZG2QZn9Y8SLxr5pAbg7m';
  const matches = await bcrypt.compare(password, testHash);
  console.log('Does NestFest2024!Secure match old hash?', matches);
  
  // Test with the new hash
  const matchesNew = await bcrypt.compare(password, newHash);
  console.log('Does NestFest2024!Secure match new hash?', matchesNew);
}

verifyPasswordHash();