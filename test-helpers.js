/**
 * Test Helper for Edit Profile Feature
 * 
 * Copy and paste these functions into your browser console
 * to quickly test the edit profile functionality
 */

// Set up a test user
function setupTestUser() {
  const testUser = {
    id: 'test-user-' + Date.now(),
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    avatar: '',
    bio: 'This is a test bio',
    role: 'user'
  };
  
  localStorage.setItem('userId', testUser.id);
  localStorage.setItem('user', JSON.stringify(testUser));
  localStorage.setItem('token', 'test-token-' + Date.now());
  
  console.log('✅ Test user set up:', testUser);
  console.log('Refresh the page to see the profile form populated');
  return testUser;
}

// Set up a test admin
function setupTestAdmin() {
  const testAdmin = {
    id: 'admin-user-' + Date.now(),
    name: 'Admin User',
    email: 'admin@example.com',
    username: 'adminuser',
    avatar: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    bio: 'System Administrator',
    role: 'admin'
  };
  
  localStorage.setItem('userId', testAdmin.id);
  localStorage.setItem('user', JSON.stringify(testAdmin));
  localStorage.setItem('token', 'admin-token-' + Date.now());
  
  console.log('✅ Test admin set up:', testAdmin);
  console.log('Refresh the page to see the admin badge');
  return testAdmin;
}

// Clear test data
function clearTestData() {
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  console.log('✅ Test data cleared');
  console.log('Refresh the page');
}

// Check current auth state
function checkAuthState() {
  const userId = localStorage.getItem('userId');
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  console.log('Current Auth State:');
  console.log('- User ID:', userId);
  console.log('- User Data:', user ? JSON.parse(user) : null);
  console.log('- Token:', token ? token.substring(0, 20) + '...' : null);
}

// Test Cloudinary configuration
async function testCloudinaryUpload() {
  console.log('Testing Cloudinary upload configuration...');
  
  // Create a test file (1x1 pixel PNG)
  const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch(testImageData);
    const blob = await response.blob();
    const file = new File([blob], 'test.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await uploadResponse.json();
    
    if (uploadResponse.ok) {
      console.log('✅ Cloudinary upload test successful!');
      console.log('Uploaded URL:', result.url);
      return result;
    } else {
      console.error('❌ Cloudinary upload test failed');
      console.error('Error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Cloudinary upload test error:', error);
    return null;
  }
}

// Export helper functions
window.testHelpers = {
  setupTestUser,
  setupTestAdmin,
  clearTestData,
  checkAuthState,
  testCloudinaryUpload
};

console.log('🧪 Test helpers loaded!');
console.log('Available functions:');
console.log('- testHelpers.setupTestUser()');
console.log('- testHelpers.setupTestAdmin()');
console.log('- testHelpers.clearTestData()');
console.log('- testHelpers.checkAuthState()');
console.log('- testHelpers.testCloudinaryUpload()');
